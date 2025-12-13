from django.db import models
import django.utils.timezone
from django.conf import settings

from foods.constants import DEFAULT_CURRENCY, PriceUnit, PriceCategory


class Allergen(models.Model):
    name = models.CharField(max_length=100)


class Micronutrient(models.Model):
    name = models.CharField(max_length=255, unique=True)
    unit = models.CharField(max_length=2, blank=False, default='g')

    def __str__(self):
        return self.name


class FoodEntryMicronutrient(models.Model):
    food_entry = models.ForeignKey(
        'FoodEntry',
        on_delete=models.CASCADE,
        related_name='micronutrient_values',
    )
    micronutrient = models.ForeignKey(
        Micronutrient,
        on_delete=models.CASCADE,
        related_name='entries',
    )
    value = models.FloatField()

    class Meta:
        unique_together = ('food_entry', 'micronutrient')

    def __str__(self):
        return f'{self.food_entry} – {self.micronutrient.name}: {self.value}'

# Create your models here.
class FoodEntry(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    servingSize = models.FloatField()
    caloriesPerServing = models.FloatField()
    proteinContent = models.FloatField()
    fatContent = models.FloatField()
    carbohydrateContent = models.FloatField()
    allergens = models.ManyToManyField(
        Allergen, related_name="food_entries", blank=True
    )
    dietaryOptions = models.JSONField(default=list)
    nutritionScore = models.FloatField()
    imageUrl = models.URLField(blank=True)
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    price_unit = models.CharField(
        max_length=20, choices=PriceUnit.choices, default=PriceUnit.PER_100G
    )
    price_category = models.CharField(
        max_length=8, choices=PriceCategory.choices, blank=True, null=True
    )
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    category_overridden_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="manual_price_overrides",
    )
    category_overridden_at = models.DateTimeField(null=True, blank=True)
    category_override_reason = models.TextField(blank=True)
    validated = models.BooleanField(default=False)
    createdBy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_food_entries",
    )

class FoodProposal(models.Model):
    """
    Represents a request to make a private FoodEntry public.

    Flow:
    1. User creates a private FoodEntry (validated=False, createdBy=user)
    2. User submits it for approval → creates FoodProposal
    3. When approved → FoodEntry.validated = True (becomes public)
    4. When rejected → FoodEntry stays private (user can still use it)
    """
    food_entry = models.OneToOneField(
        FoodEntry,
        on_delete=models.CASCADE,
        related_name='proposal',
        null=True,  # Temporarily nullable for data migration
        blank=True,
        help_text="The private FoodEntry being proposed for public validation"
    )
    isApproved = models.BooleanField(
        null=True, blank=True, default=None
    )  # null=pending, True=approved, False=rejected
    createdAt = models.DateTimeField(default=django.utils.timezone.now)
    proposedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)


class PriceCategoryThreshold(models.Model):
    price_unit = models.CharField(max_length=20, choices=PriceUnit.choices)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    lower_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    upper_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    last_recalculated_at = models.DateTimeField(null=True, blank=True)
    updates_since_recalculation = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("price_unit", "currency")
        verbose_name = "Price category threshold"
        verbose_name_plural = "Price category thresholds"

    def __str__(self):
        return f"{self.get_price_unit_display()} thresholds ({self.currency})"


class PriceAudit(models.Model):
    class ChangeType(models.TextChoices):
        PRICE_UPDATE = "price_update", "Price Update"
        CATEGORY_OVERRIDE = "category_override", "Category Override"
        THRESHOLD_RECALC = "threshold_recalc", "Threshold Recalculation"
        RECIPE_RECALC = "recipe_recalc", "Recipe Recalculation"

    food = models.ForeignKey(
        FoodEntry,
        on_delete=models.CASCADE,
        related_name="price_audits",
        null=True,
        blank=True,
    )
    price_unit = models.CharField(max_length=20, choices=PriceUnit.choices)
    currency = models.CharField(max_length=3, default=DEFAULT_CURRENCY)
    old_base_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    new_base_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    old_price_category = models.CharField(
        max_length=8, choices=PriceCategory.choices, blank=True, null=True
    )
    new_price_category = models.CharField(
        max_length=8, choices=PriceCategory.choices, blank=True, null=True
    )
    change_type = models.CharField(max_length=32, choices=ChangeType.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="price_audits",
    )
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        descriptor = (
            self.food.name if self.food else self.get_change_type_display()
        )
        return f"{descriptor} ({self.get_change_type_display()})"


class PriceReport(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_REVIEW = "in_review", "In Review"
        RESOLVED = "resolved", "Resolved"

    food = models.ForeignKey(
        FoodEntry, on_delete=models.CASCADE, related_name="price_reports"
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="price_reports",
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_price_reports",
    )
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Report #{self.id} for {self.food.name}"


class ImageCache(models.Model):
    """
    Cache model for storing proxied food images from external sources.
    Improves performance by caching externally-hosted images locally.
    Uses url_hash for uniqueness to avoid MySQL index length limitations.
    """

    url_hash = models.CharField(max_length=64, unique=True, db_index=True)
    original_url = models.TextField()
    cached_file = models.ImageField(upload_to="cached_images/")
    content_type = models.CharField(max_length=100, default="image/jpeg")
    file_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    access_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["last_accessed"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Cache for {self.original_url[:50]}..."

from django.db import models
import django.utils.timezone
from django.conf import settings


class Allergen(models.Model):
    name = models.CharField(max_length=100)


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
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Micronutrient content (vitamins, minerals) per serving"
    )



class FoodProposal(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    servingSize = models.FloatField()
    caloriesPerServing = models.FloatField()
    proteinContent = models.FloatField()
    fatContent = models.FloatField()
    carbohydrateContent = models.FloatField()
    allergens = models.ManyToManyField(
        Allergen, related_name="food_proposals", blank=True
    )
    dietaryOptions = models.JSONField(default=list)
    nutritionScore = models.FloatField()
    imageUrl = models.URLField(blank=True)
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Micronutrient content (vitamins, minerals) per serving"
    )
    isApproved = models.BooleanField(
        null=True, blank=True, default=None
    )  # null=pending, True=approved, False=rejected
    createdAt = models.DateTimeField(default=django.utils.timezone.now)
    proposedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)



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


# ============================================================================
# Micronutrient Data Models (USDA FoodData Central)
# ============================================================================


class NutrientDefinition(models.Model):
    """
    Nutrient metadata from USDA database (vitamins, minerals, etc.)
    Maps to nutrient.csv
    """
    nutrient_id = models.IntegerField(unique=True, db_index=True, help_text="USDA nutrient ID")
    name = models.CharField(max_length=255, help_text="Nutrient name (e.g., 'Vitamin C')")
    unit_name = models.CharField(max_length=50, help_text="Unit of measurement (e.g., 'MG', 'UG')")
    nutrient_nbr = models.CharField(max_length=10, help_text="Nutrient number code")
    rank = models.FloatField(null=True, blank=True, help_text="Display order rank")

    class Meta:
        db_table = 'foods_nutrient_definition'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['nutrient_nbr']),
        ]
        verbose_name = "Nutrient Definition"
        verbose_name_plural = "Nutrient Definitions"

    def __str__(self):
        return f"{self.name} ({self.unit_name})"


class FoodData(models.Model):
    """
    Detailed food information from USDA FoodData Central
    Maps to food.csv
    """
    fdc_id = models.IntegerField(unique=True, db_index=True, help_text="FoodData Central ID")
    data_type = models.CharField(max_length=100, help_text="Type of food data (e.g., 'survey_fndds_food')")
    description = models.CharField(max_length=500, help_text="Food description")
    food_category_id = models.IntegerField(null=True, blank=True, help_text="Food category ID")
    publication_date = models.DateField(null=True, blank=True, help_text="Publication date")
    
    # Optional link to legacy FoodEntry model
    legacy_food_entry = models.OneToOneField(
        FoodEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usda_food_data',
        help_text="Link to legacy FoodEntry if matched"
    )

    class Meta:
        db_table = 'foods_food_data'
        indexes = [
            models.Index(fields=['description']),
            models.Index(fields=['data_type']),
            models.Index(fields=['food_category_id']),
        ]
        verbose_name = "Food Data"
        verbose_name_plural = "Food Data"

    def __str__(self):
        return f"{self.description} (FDC: {self.fdc_id})"


class FoodNutrient(models.Model):
    """
    Junction table linking foods to nutrients with amounts
    Maps to food_nutrient.csv
    """
    food_data = models.ForeignKey(
        FoodData,
        on_delete=models.CASCADE,
        related_name='nutrients',
        help_text="Related food"
    )
    nutrient = models.ForeignKey(
        NutrientDefinition,
        on_delete=models.CASCADE,
        related_name='food_nutrients',
        help_text="Related nutrient"
    )
    amount = models.FloatField(help_text="Amount of nutrient per 100g")

    class Meta:
        db_table = 'foods_food_nutrient'
        indexes = [
            models.Index(fields=['food_data', 'nutrient']),
            models.Index(fields=['nutrient', 'amount']),
        ]
        unique_together = [['food_data', 'nutrient']]
        verbose_name = "Food Nutrient"
        verbose_name_plural = "Food Nutrients"

    def __str__(self):
        return f"{self.food_data.description}: {self.nutrient.name} = {self.amount}{self.nutrient.unit_name}"


class FoodPortion(models.Model):
    """
    Serving size and portion information for foods
    Maps to food_portion.csv
    """
    food_data = models.ForeignKey(
        FoodData,
        on_delete=models.CASCADE,
        related_name='portions',
        help_text="Related food"
    )
    seq_num = models.IntegerField(help_text="Sequence number for ordering")
    portion_description = models.CharField(max_length=255, help_text="Description (e.g., '1 cup', '1 tablespoon')")
    gram_weight = models.FloatField(help_text="Weight in grams")

    class Meta:
        db_table = 'foods_food_portion'
        indexes = [
            models.Index(fields=['food_data', 'seq_num']),
            models.Index(fields=['portion_description']),
        ]
        ordering = ['food_data', 'seq_num']
        verbose_name = "Food Portion"
        verbose_name_plural = "Food Portions"

    def __str__(self):
        return f"{self.food_data.description}: {self.portion_description} ({self.gram_weight}g)"

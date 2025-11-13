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
    isApproved = models.BooleanField(default=False)
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

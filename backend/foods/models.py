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
    imageUrl = models.URLField(blank=True)  # Deprecated, keeping for backward compatibility
    imageUrlHigh = models.CharField(max_length=500, blank=True, null=True)
    imageUrlMedium = models.CharField(max_length=500, blank=True, null=True)
    imageUrlLow = models.CharField(max_length=500, blank=True, null=True)


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
    imageUrl = models.URLField(blank=True)  # Deprecated, keeping for backward compatibility
    imageUrlHigh = models.CharField(max_length=500, blank=True, null=True)
    imageUrlMedium = models.CharField(max_length=500, blank=True, null=True)
    imageUrlLow = models.CharField(max_length=500, blank=True, null=True)
    isApproved = models.BooleanField(default=False)
    createdAt = models.DateTimeField(default=django.utils.timezone.now)
    proposedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

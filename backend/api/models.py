from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class Allergen(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class User(models.Model):
    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    address = models.TextField()

    # Tags: e.g., Dietitian, Store Owner
    tags = models.ManyToManyField(Tag, blank=True)

    # Allergens and Additives
    allergens = models.ManyToManyField(Allergen, blank=True)

    def __str__(self):
        return f"{self.name} {self.surname}"


class Recipe(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recipes")

    def __str__(self):
        return self.name


class FoodEntry(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    servingSize = models.FloatField()
    caloriesPerServing = models.FloatField()
    proteinContent = models.FloatField()
    fatContent = models.FloatField()
    carbohydrateContent = models.FloatField()
    allergens = models.JSONField(default=list)
    dietaryOptions = models.JSONField(default=list)
    nutritionScore = models.FloatField()
    imageUrl = models.URLField(blank=True)

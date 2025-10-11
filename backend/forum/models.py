from typing import Any
from django.db import models
from django.conf import settings
from django.db.models import Sum


class Tag(models.Model):
    objects: Any
    name = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:
        return str(self.name)


class Post(models.Model):
    objects: Any
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return f"{self.title} by {self.author}"


class Comment(models.Model):
    objects: Any
    post = models.ForeignKey("Post", related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author} on {self.post}"


class Like(models.Model):
    objects: Any
    post = models.ForeignKey(Post, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")  # prevents duplicate likes

    def __str__(self):
        return f"{self.user} likes {self.post}"


class RecipeIngredient(models.Model):
    objects: Any
    recipe = models.ForeignKey(
        "Recipe", related_name="ingredients", on_delete=models.CASCADE
    )
    food = models.ForeignKey("foods.FoodEntry", on_delete=models.CASCADE)
    amount = models.FloatField(help_text="Amount in grams")

    def __str__(self):
        return f"{self.amount}g of {self.food.name}"

    @property
    def protein_content(self):
        return (self.amount / self.food.servingSize) * self.food.proteinContent

    @property
    def fat_content(self):
        return (self.amount / self.food.servingSize) * self.food.fatContent

    @property
    def carbohydrate_content(self):
        return (self.amount / self.food.servingSize) * self.food.carbohydrateContent

    @property
    def calorie_content(self):
        return (self.amount / self.food.servingSize) * self.food.caloriesPerServing


class Recipe(models.Model):
    objects: Any
    post = models.OneToOneField("Post", related_name="recipe", on_delete=models.CASCADE)
    instructions = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Recipe for {self.post.title}"

    @property
    def total_protein(self):
        return sum(ingredient.protein_content for ingredient in self.ingredients.all())

    @property
    def total_fat(self):
        return sum(ingredient.fat_content for ingredient in self.ingredients.all())

    @property
    def total_carbohydrates(self):
        return sum(
            ingredient.carbohydrate_content for ingredient in self.ingredients.all()
        )

    @property
    def total_calories(self):
        return sum(ingredient.calorie_content for ingredient in self.ingredients.all())

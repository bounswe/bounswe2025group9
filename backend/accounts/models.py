from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class Tag(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class UserTag(models.Model):
    """Through model for User-Tag relationship with per-user verification"""

    user = models.ForeignKey("User", on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    verified = models.BooleanField(default=False)
    certificate = models.FileField(upload_to="certificates/", null=True, blank=True)

    class Meta:
        unique_together = ("user", "tag")

    def __str__(self):
        return f"{self.user.username} - {self.tag.name} ({'verified' if self.verified else 'unverified'})"


class Allergen(models.Model):
    name = models.CharField(max_length=64, unique=True)
    common = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    email = models.EmailField(unique=True)

    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    address = models.TextField(null=True, blank=True)

    tags = models.ManyToManyField(Tag, through="UserTag", blank=True)
    allergens = models.ManyToManyField(Allergen, blank=True)

    profile_image = models.ImageField(
        upload_to="profile_images/", null=True, blank=True  # folder inside MEDIA_ROOT
    )

    current_meal_plan = models.ForeignKey(
        "meal_planner.MealPlan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_for_users",
    )

    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_set",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return f"{self.name} {self.surname}"


class Recipe(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recipes")

    def __str__(self):
        return self.name

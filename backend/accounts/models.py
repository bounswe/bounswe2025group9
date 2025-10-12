from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class Tag(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class Allergen(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    email = models.EmailField(unique=True)

    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    address = models.TextField(null=True, blank=True)

    tags = models.ManyToManyField(Tag, blank=True)
    allergens = models.ManyToManyField(Allergen, blank=True)

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

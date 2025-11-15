from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
import uuid
import os


def certificate_upload_to(instance, filename):
    """Generate secure filename for certificates using token"""
    ext = os.path.splitext(filename)[1]
    return f"certificates/{instance.certificate_token}{ext}"


def profile_image_upload_to(instance, filename):
    """Generate secure filename for profile images using token"""
    ext = os.path.splitext(filename)[1]
    return f"profile_images/{instance.profile_image_token}{ext}"


class Tag(models.Model):
    name = models.CharField(max_length=64)

    def __str__(self):
        return self.name


class UserTag(models.Model):
    """Through model for User-Tag relationship with per-user verification"""

    user = models.ForeignKey("User", on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    verified = models.BooleanField(default=False)
    certificate_token = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )
    certificate = models.FileField(
        upload_to=certificate_upload_to, null=True, blank=True
    )

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

    profile_image_token = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )
    profile_image = models.ImageField(
        upload_to=profile_image_upload_to, null=True, blank=True
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

class Report(models.Model):
    """
    Represents a user report (e.g., reporting inappropriate behavior).
    """

    reporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reports_made",
        help_text="The user who submitted the report.",
    )
    reportee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reports_received",
        help_text="The user being reported.",
    )
    reason = models.TextField(help_text="The reason or description of the report.")
    reviewed = models.BooleanField(default=False)

    class Meta:
        unique_together = ("reporter", "reportee")

    def __str__(self):
        return f"Report by {self.reporter.username} on {self.reportee.username}"
    
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following_set")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers_set")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
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


class UserMetrics(models.Model):
    """
    Stores user's physical metrics for calculating nutrition targets.
    One-to-one relationship with User.
    """
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', 'Sedentary (little or no exercise)'),
        ('light', 'Light (exercise 1-3 days/week)'),
        ('moderate', 'Moderate (exercise 3-5 days/week)'),
        ('active', 'Active (exercise 6-7 days/week)'),
        ('very_active', 'Very Active (hard exercise & physical job)'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='metrics'
    )
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Height in centimeters"
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Weight in kilograms"
    )
    age = models.PositiveIntegerField(help_text="Age in years")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Metrics"
    
    def __str__(self):
        return f"{self.user.username}'s metrics"
    
    def calculate_bmr(self):
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation."""
        from project.utils.nutrition_calculator import calculate_bmr
        return calculate_bmr(
            float(self.weight),
            float(self.height),
            self.age,
            self.gender
        )
    
    def calculate_tdee(self):
        """Calculate Total Daily Energy Expenditure."""
        from project.utils.nutrition_calculator import calculate_tdee
        bmr = self.calculate_bmr()
        return calculate_tdee(bmr, self.activity_level)


class NutritionTargets(models.Model):
    """
    Stores user's daily nutrition targets.
    Can be auto-calculated from UserMetrics or manually customized.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='nutrition_targets'
    )
    calories = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Daily calorie target"
    )
    protein = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Daily protein target in grams"
    )
    carbohydrates = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Daily carbohydrates target in grams"
    )
    fat = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Daily fat target in grams"
    )
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Daily micronutrient targets (e.g., vitamins, minerals)"
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="True if manually set, False if auto-calculated from metrics"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Nutrition Targets"
    
    def __str__(self):
        return f"{self.user.username}'s nutrition targets"
    
    @classmethod
    def create_from_metrics(cls, user_metrics):
        """
        Create or update nutrition targets based on user metrics.
        Uses default macro ratios: 40% carbs, 30% protein, 30% fat.
        Also calculates micronutrient targets based on RDA values for age and gender.
        """
        from project.utils.nutrition_calculator import calculate_macro_targets, calculate_micronutrient_targets
        
        tdee = user_metrics.calculate_tdee()
        macro_targets = calculate_macro_targets(tdee)
        micronutrient_targets = calculate_micronutrient_targets(
            user_metrics.age,
            user_metrics.gender
        )

        # Hydration target: weight-based (35 ml/kg) 
        try:
            weight_kg = float(user_metrics.weight)
            weight_based = weight_kg * 35  # ml ~= grams
        except Exception:
            weight_based = 0.0

        baseline = 3700 if user_metrics.gender == 'M' else 2700
        hydration_target = weight_based if weight_based > 0 else baseline

        # Store as simple number for consistency with frontend consumption
        micronutrient_targets["Water (g)"] = round(hydration_target, 2)
        
        targets, created = cls.objects.update_or_create(
            user=user_metrics.user,
            defaults={
                'calories': macro_targets['calories'],
                'protein': macro_targets['protein_g'],
                'carbohydrates': macro_targets['carbohydrates_g'],
                'fat': macro_targets['fat_g'],
                'micronutrients': micronutrient_targets,
                'is_custom': False,
            }
        )
        
        return targets


class AccountDeletionLog(models.Model):
    """
    Audit log for account deletions.
    Stores minimal information to verify deletion compliance.
    """
    user_identifier = models.CharField(max_length=150, help_text="Username or ID of the deleted user")
    email = models.EmailField(help_text="Email of the deleted user (hashed or raw depending on policy)")
    reason = models.TextField(blank=True, help_text="Reason for deletion if provided")
    deleted_at = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True, help_text="Summary of deleted/anonymized counts")

    def __str__(self):
        return f"Deletion Log: {self.user_identifier} at {self.deleted_at}"
from django.db import models
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver
from decimal import Decimal, ROUND_HALF_UP



class MealPlan(models.Model):
    """Model representing a user's meal plan with total nutrition and meals array"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='meal_plans'
    )
    name = models.CharField(max_length=200, default='My Meal Plan')
    
    # Total nutrition fields
    total_calories = models.FloatField(default=0.0)
    total_protein = models.FloatField(default=0.0)
    total_fat = models.FloatField(default=0.0)
    total_carbohydrates = models.FloatField(default=0.0)
    micronutrients_summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Aggregated micronutrient totals for the meal plan"
    )
    
    # Array of foods as meals - storing food IDs and meal information
    meals = models.JSONField(default=list, help_text="Array of meal objects with food information")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}'s Meal Plan - {self.name}"
    
    def calculate_total_nutrition(self):
        """Calculate and update total nutrition from meals array"""
        from project.utils.nutrition_calculator import aggregate_micronutrients
        
        total_calories = 0.0
        total_protein = 0.0
        total_fat = 0.0
        total_carbs = 0.0
        micronutrients_list = []

        for meal in self.meals:
            # Assuming meal structure: {'food_id': int, 'serving_size': float, 'meal_type': str}
            from foods.models import FoodEntry
            from foods.services import FoodAccessService
            try:
                # Get accessible foods for this meal plan's owner
                accessible_foods = FoodAccessService.get_accessible_foods(user=self.user)
                food_entry = accessible_foods.get(id=meal.get('food_id'))
                serving_size = meal.get('serving_size', 1.0)

                total_calories += food_entry.caloriesPerServing * serving_size
                total_protein += food_entry.proteinContent * serving_size
                total_fat += food_entry.fatContent * serving_size
                total_carbs += food_entry.carbohydrateContent * serving_size
                
                # Calculate micronutrients for this meal
                if food_entry.micronutrient_values.exists():
                    meal_micronutrients = {
                        mv.micronutrient.name: mv.value * serving_size
                        for mv in food_entry.micronutrient_values.select_related("micronutrient")
                    }
                    micronutrients_list.append(meal_micronutrients)
            except FoodEntry.DoesNotExist:
                continue

        # Aggregate all micronutrients
        aggregated_micronutrients = aggregate_micronutrients(micronutrients_list)

        # Update the total nutrition fields
        self.total_calories = total_calories
        self.total_protein = total_protein
        self.total_fat = total_fat
        self.total_carbohydrates = total_carbs
        self.micronutrients_summary = aggregated_micronutrients
        self.save(update_fields=['total_calories', 'total_protein', 'total_fat', 'total_carbohydrates', 'micronutrients_summary'])


class DailyNutritionLog(models.Model):
    """
    Tracks actual daily food consumption.
    Different from MealPlan which is for planning - this is for logging what was actually eaten.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_nutrition_logs'
    )
    date = models.DateField(db_index=True, help_text="Date of this nutrition log")
    
    # Aggregated totals (calculated from FoodLogEntry instances)
    total_calories = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    total_protein = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    total_fat = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    total_carbohydrates = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    micronutrients_summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Aggregated micronutrient totals for the day"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = [('user', 'date')]
        indexes = [
            models.Index(fields=['user', 'date']),
        ]
    
    def __str__(self):
        return f"{self.user.username}'s log for {self.date}"
    
    def recalculate_totals(self):
        """Recalculate and update totals from all food log entries for this day."""
        from project.utils.nutrition_calculator import aggregate_micronutrients
        
        entries = self.entries.all()
        
        total_calories = sum(float(entry.calories) for entry in entries)
        total_protein = sum(float(entry.protein) for entry in entries)
        total_fat = sum(float(entry.fat) for entry in entries)
        total_carbs = sum(float(entry.carbohydrates) for entry in entries)
        
        # Aggregate micronutrients
        micronutrient_list = [entry.micronutrients for entry in entries if entry.micronutrients]
        micronutrients = aggregate_micronutrients(micronutrient_list)
        
        # Update fields
        self.total_calories = total_calories
        self.total_protein = total_protein
        self.total_fat = total_fat
        self.total_carbohydrates = total_carbs
        self.micronutrients_summary = micronutrients
        self.save(update_fields=[
            'total_calories', 'total_protein', 'total_fat',
            'total_carbohydrates', 'micronutrients_summary'
        ])


class FoodLogEntry(models.Model):
    """
    Individual food consumption record for a specific date.
    Stores calculated nutrition values for the logged serving size.
    """
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    daily_log = models.ForeignKey(
        DailyNutritionLog,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    food = models.ForeignKey(
        'foods.FoodEntry',
        on_delete=models.PROTECT,  # Prevent deletion of foods that are logged
        related_name='log_entries',
        null=True,  # Made nullable to support private foods
        blank=True
    )
    serving_size = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Serving size multiplier (e.g., 2 for two servings)"
    )
    serving_unit = models.CharField(
        max_length=50,
        default='serving',
        help_text="Unit of measurement (e.g., serving, cup, gram)"
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    
    # Calculated nutrition values (stored for this specific serving)
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein = models.DecimalField(max_digits=7, decimal_places=2)
    carbohydrates = models.DecimalField(max_digits=7, decimal_places=2)
    fat = models.DecimalField(max_digits=7, decimal_places=2)
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Micronutrient values for this serving"
    )
    
    logged_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['logged_at']
        verbose_name_plural = "Food Log Entries"
    
    def __str__(self):
        food_name = self.food.name if self.food else "Unknown"
        return f"{food_name} ({self.serving_size} {self.serving_unit}) - {self.meal_type}"
    
    def save(self, *args, **kwargs):
        """Calculate nutrition values before saving."""
        food_source = self.food
        
        if not food_source:
            raise ValueError("Cannot save FoodLogEntry without a valid food reference.")
        
        # Calculate nutrition based on serving size and round to 2 decimal places
        serving_size_float = float(self.serving_size)
        
        # Round to 2 decimal places using Decimal for precision
        self.calories = Decimal(str(food_source.caloriesPerServing * serving_size_float)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        self.protein = Decimal(str(food_source.proteinContent * serving_size_float)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        self.fat = Decimal(str(food_source.fatContent * serving_size_float)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        self.carbohydrates = Decimal(str(food_source.carbohydrateContent * serving_size_float)).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        
        # Handle micronutrients via the related manager
        if food_source.micronutrient_values.exists():
            self.micronutrients = {
                mv.micronutrient.name: mv.value * serving_size_float
                for mv in food_source.micronutrient_values.select_related("micronutrient")
            }
        
        # Now run validation (after nutrition fields are set)
        self.full_clean()  # Run validation
        super().save(*args, **kwargs)
        
        # Update daily log totals
        self.daily_log.recalculate_totals()


# Signal to recalculate totals when an entry is deleted
@receiver(post_delete, sender=FoodLogEntry)
def recalculate_daily_log_on_delete(sender, instance, **kwargs):
    """Update daily log totals when a food entry is deleted."""
    instance.daily_log.recalculate_totals()


class PlannedFoodEntry(models.Model):
    """
    Planned food entry for a specific date.
    Unlike FoodLogEntry, these are not actually consumed - they're planned/scheduled foods.
    Can be converted to FoodLogEntry when the user confirms consumption.
    """
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    daily_log = models.ForeignKey(
        DailyNutritionLog,
        on_delete=models.CASCADE,
        related_name='planned_entries'
    )
    food = models.ForeignKey(
        'foods.FoodEntry',
        on_delete=models.PROTECT,
        related_name='planned_log_entries',
        null=True,
        blank=True
    )
    serving_size = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Serving size multiplier (e.g., 2 for two servings)"
    )
    serving_unit = models.CharField(
        max_length=50,
        default='serving',
        help_text="Unit of measurement (e.g., serving, cup, gram)"
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    
    # Calculated nutrition values (stored for this specific serving)
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein = models.DecimalField(max_digits=7, decimal_places=2)
    carbohydrates = models.DecimalField(max_digits=7, decimal_places=2)
    fat = models.DecimalField(max_digits=7, decimal_places=2)
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Micronutrient values for this serving"
    )
    
    planned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['planned_at']
        verbose_name_plural = "Planned Food Entries"
    
    def __str__(self):
        food_name = self.food.name if self.food else "Unknown"
        return f"[Planned] {food_name} ({self.serving_size} {self.serving_unit}) - {self.meal_type}"
    
    def save(self, *args, **kwargs):
        """Calculate nutrition values before saving."""
        food_source = self.food
        
        if food_source:
            # Calculate nutrition based on serving size and round to 2 decimal places
            serving_size_float = float(self.serving_size)
            
            self.calories = Decimal(str(food_source.caloriesPerServing * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.protein = Decimal(str(food_source.proteinContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.fat = Decimal(str(food_source.fatContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.carbohydrates = Decimal(str(food_source.carbohydrateContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            
            # Handle micronutrients
            if food_source.micronutrient_values.exists():
                self.micronutrients = {
                    mv.micronutrient.name: mv.value * serving_size_float
                    for mv in food_source.micronutrient_values.select_related("micronutrient")
                }
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    def convert_to_log_entry(self):
        """
        Convert this planned entry to an actual FoodLogEntry.
        Returns the created FoodLogEntry and deletes this planned entry.
        """
        log_entry = FoodLogEntry.objects.create(
            daily_log=self.daily_log,
            food=self.food,
            serving_size=self.serving_size,
            serving_unit=self.serving_unit,
            meal_type=self.meal_type,
        )
        self.delete()
        return log_entry


class SavedMealPlan(models.Model):
    """
    A saved meal plan template that users can reuse.
    Similar structure to DailyNutritionLog but without a date - it's a reusable template.
    Users can log or plan these meal plans to any date.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_meal_plans'
    )
    name = models.CharField(max_length=200, default='My Meal Plan')
    description = models.TextField(blank=True, default='')
    
    # Aggregated totals (calculated from SavedMealPlanEntry instances)
    total_calories = models.DecimalField(max_digits=8, decimal_places=2, default=0.0)
    total_protein = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    total_fat = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    total_carbohydrates = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    micronutrients_summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Aggregated micronutrient totals for the meal plan"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username}'s Saved Meal Plan - {self.name}"
    
    def recalculate_totals(self):
        """Recalculate and update totals from all entries in this meal plan."""
        from project.utils.nutrition_calculator import aggregate_micronutrients
        
        entries = self.entries.all()
        
        total_calories = sum(float(entry.calories) for entry in entries)
        total_protein = sum(float(entry.protein) for entry in entries)
        total_fat = sum(float(entry.fat) for entry in entries)
        total_carbs = sum(float(entry.carbohydrates) for entry in entries)
        
        # Aggregate micronutrients
        micronutrient_list = [entry.micronutrients for entry in entries if entry.micronutrients]
        micronutrients = aggregate_micronutrients(micronutrient_list)
        
        # Update fields
        self.total_calories = total_calories
        self.total_protein = total_protein
        self.total_fat = total_fat
        self.total_carbohydrates = total_carbs
        self.micronutrients_summary = micronutrients
        self.save(update_fields=[
            'total_calories', 'total_protein', 'total_fat',
            'total_carbohydrates', 'micronutrients_summary', 'updated_at'
        ])


class SavedMealPlanEntry(models.Model):
    """
    Individual food entry within a saved meal plan template.
    Similar to FoodLogEntry but belongs to a SavedMealPlan instead of DailyNutritionLog.
    """
    MEAL_TYPE_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    meal_plan = models.ForeignKey(
        SavedMealPlan,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    food = models.ForeignKey(
        'foods.FoodEntry',
        on_delete=models.PROTECT,
        related_name='saved_meal_plan_entries',
        null=True,
        blank=True
    )
    serving_size = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Serving size multiplier (e.g., 2 for two servings)"
    )
    serving_unit = models.CharField(
        max_length=50,
        default='serving',
        help_text="Unit of measurement (e.g., serving, cup, gram)"
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    
    # Calculated nutrition values (stored for this specific serving)
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein = models.DecimalField(max_digits=7, decimal_places=2)
    carbohydrates = models.DecimalField(max_digits=7, decimal_places=2)
    fat = models.DecimalField(max_digits=7, decimal_places=2)
    micronutrients = models.JSONField(
        default=dict,
        blank=True,
        help_text="Micronutrient values for this serving"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['meal_type', 'created_at']
        verbose_name_plural = "Saved Meal Plan Entries"
    
    def __str__(self):
        food_name = self.food.name if self.food else "Unknown"
        return f"{food_name} ({self.serving_size} {self.serving_unit}) - {self.meal_type}"
    
    def save(self, *args, **kwargs):
        """Calculate nutrition values before saving."""
        food_source = self.food
        
        if food_source:
            # Calculate nutrition based on serving size and round to 2 decimal places
            serving_size_float = float(self.serving_size)
            
            self.calories = Decimal(str(food_source.caloriesPerServing * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.protein = Decimal(str(food_source.proteinContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.fat = Decimal(str(food_source.fatContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            self.carbohydrates = Decimal(str(food_source.carbohydrateContent * serving_size_float)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            
            # Handle micronutrients
            if food_source.micronutrient_values.exists():
                self.micronutrients = {
                    mv.micronutrient.name: mv.value * serving_size_float
                    for mv in food_source.micronutrient_values.select_related("micronutrient")
                }
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update meal plan totals
        self.meal_plan.recalculate_totals()


# Signal to recalculate totals when a saved meal plan entry is deleted
@receiver(post_delete, sender=SavedMealPlanEntry)
def recalculate_saved_meal_plan_on_delete(sender, instance, **kwargs):
    """Update saved meal plan totals when an entry is deleted."""
    try:
        instance.meal_plan.recalculate_totals()
    except SavedMealPlan.DoesNotExist:
        # Meal plan was also deleted, nothing to update
        pass

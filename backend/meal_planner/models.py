from django.db import models
from django.conf import settings


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
        total_calories = 0.0
        total_protein = 0.0
        total_fat = 0.0
        total_carbs = 0.0
        
        for meal in self.meals:
            # Assuming meal structure: {'food_id': int, 'serving_size': float, 'meal_type': str}
            from foods.models import FoodEntry
            try:
                food_entry = FoodEntry.objects.get(id=meal.get('food_id'))
                serving_size = meal.get('serving_size', 1.0)
                
                total_calories += food_entry.caloriesPerServing * serving_size
                total_protein += food_entry.proteinContent * serving_size
                total_fat += food_entry.fatContent * serving_size
                total_carbs += food_entry.carbohydrateContent * serving_size
            except FoodEntry.DoesNotExist:
                continue
        
        # Update the total nutrition fields
        self.total_calories = total_calories
        self.total_protein = total_protein
        self.total_fat = total_fat
        self.total_carbohydrates = total_carbs
        self.save(update_fields=['total_calories', 'total_protein', 'total_fat', 'total_carbohydrates'])

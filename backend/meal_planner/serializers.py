from rest_framework import serializers
from .models import MealPlan
from foods.models import FoodEntry
from foods.serializers import FoodEntrySerializer


class MealSerializer(serializers.Serializer):
    """Serializer for individual meal items in the meals array"""
    food_id = serializers.IntegerField()
    serving_size = serializers.FloatField(default=1.0)
    meal_type = serializers.CharField(max_length=50, default='meal')
    
    def validate_food_id(self, value):
        """Validate that the food entry exists"""
        if not FoodEntry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Food entry with this ID does not exist.")
        return value


class MealPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a meal plan with food IDs"""
    meals = MealSerializer(many=True, required=False)
    
    class Meta:
        model = MealPlan
        fields = ['name', 'meals']
    
    def create(self, validated_data):
        meals_data = validated_data.pop('meals', [])
        
        # Create meal plan first
        meal_plan = MealPlan.objects.create(**validated_data)
        
        # Set the meals data directly to the JSONField
        if meals_data:
            meal_plan.meals = meals_data
            meal_plan.save()  # Save after setting meals
            meal_plan.calculate_total_nutrition()
        
        return meal_plan
    
    def update(self, instance, validated_data):
        meals_data = validated_data.pop('meals', [])
        
        # Update other fields first
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update meals array if provided
        if meals_data:
            instance.meals = meals_data
            instance.calculate_total_nutrition()
        
        instance.save()
        return instance


class MealPlanSerializer(serializers.ModelSerializer):
    """Serializer for reading meal plans with detailed meal information"""
    meals_details = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlan
        fields = [
            'id', 'name', 'total_calories', 'total_protein', 
            'total_fat', 'total_carbohydrates', 'meals', 
            'meals_details', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'total_calories', 'total_protein', 
            'total_fat', 'total_carbohydrates', 'created_at', 'updated_at'
        ]
    
    def get_meals_details(self, obj):
        """Get detailed food information for each meal"""
        meals_details = []
        for meal in obj.meals:
            try:
                food_entry = FoodEntry.objects.get(id=meal.get('food_id'))
                food_serializer = FoodEntrySerializer(food_entry)
                meal_detail = {
                    'food': food_serializer.data,
                    'serving_size': meal.get('serving_size', 1.0),
                    'meal_type': meal.get('meal_type', 'meal'),
                    'calculated_nutrition': {
                        'calories': food_entry.caloriesPerServing * meal.get('serving_size', 1.0),
                        'protein': food_entry.proteinContent * meal.get('serving_size', 1.0),
                        'fat': food_entry.fatContent * meal.get('serving_size', 1.0),
                        'carbohydrates': food_entry.carbohydrateContent * meal.get('serving_size', 1.0),
                    }
                }
                meals_details.append(meal_detail)
            except FoodEntry.DoesNotExist:
                continue
        return meals_details

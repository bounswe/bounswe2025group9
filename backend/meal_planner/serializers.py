from rest_framework import serializers
from .models import MealPlan
from foods.models import FoodEntry
from foods.serializers import FoodEntrySerializer
from foods.services import FoodAccessService


class MealSerializer(serializers.Serializer):
    """Serializer for individual meal items in the meals array"""
    food_id = serializers.IntegerField()
    serving_size = serializers.FloatField(default=1.0)
    meal_type = serializers.CharField(max_length=50, default='meal')
    
    def validate_food_id(self, value):
        """Validate that the food entry exists and is accessible to the user"""
        # Get user from context (passed from the view)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Check if food exists and is accessible
        accessible_foods = FoodAccessService.get_accessible_foods(user=user)
        if not accessible_foods.filter(id=value).exists():
            raise serializers.ValidationError("Food entry with this ID does not exist or is not accessible.")
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
            'total_fat', 'total_carbohydrates', 'micronutrients_summary',
            'meals', 'meals_details', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'total_calories', 'total_protein', 
            'total_fat', 'total_carbohydrates', 'micronutrients_summary',
            'created_at', 'updated_at'
        ]
    
    def get_meals_details(self, obj):
        """Get detailed food information for each meal"""
        # Get user from context
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Get accessible foods for the user
        accessible_foods = FoodAccessService.get_accessible_foods(user=user)

        meals_details = []
        for meal in obj.meals:
            try:
                food_entry = accessible_foods.get(id=meal.get('food_id'))
                food_serializer = FoodEntrySerializer(food_entry)
                serving_size = meal.get('serving_size', 1.0)
                
                # Calculate micronutrients for this meal
                meal_micronutrients = {}
                if food_entry.micronutrient_values.exists():
                    meal_micronutrients = {
                        mv.micronutrient.name: mv.value * serving_size
                        for mv in food_entry.micronutrient_values.select_related("micronutrient")
                    }
                
                meal_detail = {
                    'food': food_serializer.data,
                    'serving_size': serving_size,
                    'meal_type': meal.get('meal_type', 'meal'),
                    'calculated_nutrition': {
                        'calories': food_entry.caloriesPerServing * serving_size,
                        'protein': food_entry.proteinContent * serving_size,
                        'fat': food_entry.fatContent * serving_size,
                        'carbohydrates': food_entry.carbohydrateContent * serving_size,
                        'micronutrients': meal_micronutrients,
                    }
                }
                meals_details.append(meal_detail)
            except FoodEntry.DoesNotExist:
                continue
        return meals_details


class FoodLogEntrySerializer(serializers.ModelSerializer):
    """Serializer for individual food log entries."""
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_serving_size = serializers.DecimalField(
        source='food.servingSize',
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=False,
        help_text="Original serving size of the food (for display calculations)"
    )
    image_url = serializers.CharField(source='food.imageUrl', read_only=True, allow_blank=True)
    food_id = serializers.PrimaryKeyRelatedField(
        source='food',
        queryset=FoodEntry.objects.none(),  # Will be set in __init__
        write_only=True
    )

    def __init__(self, *args, **kwargs):
        """Initialize and set accessible foods queryset based on user context"""
        super().__init__(*args, **kwargs)

        # Get user from context
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Set queryset to only accessible foods for this user
        self.fields['food_id'].queryset = FoodAccessService.get_accessible_foods(user=user)

    class Meta:
        from .models import FoodLogEntry
        model = FoodLogEntry
        fields = [
            'id', 'food_id', 'food_name', 'food_serving_size', 'image_url',
            'serving_size', 'serving_unit', 'meal_type', 'calories', 'protein',
            'carbohydrates', 'fat', 'micronutrients', 'logged_at'
        ]
        read_only_fields = ['id', 'food_serving_size', 'image_url', 'calories',
                           'protein', 'carbohydrates', 'fat', 'micronutrients', 'logged_at']

    def validate_serving_size(self, value):
        """Validate serving size is positive."""
        if value <= 0:
            raise serializers.ValidationError("Serving size must be greater than 0.")
        return value

class DailyNutritionLogSerializer(serializers.ModelSerializer):
    """Serializer for daily nutrition log with nested entries and target comparison."""
    entries = FoodLogEntrySerializer(many=True, read_only=True)
    targets = serializers.SerializerMethodField(read_only=True)
    adherence = serializers.SerializerMethodField(read_only=True)

    class Meta:
        from .models import DailyNutritionLog
        model = DailyNutritionLog
        fields = [
            'date', 'total_calories', 'total_protein', 'total_carbohydrates',
            'total_fat', 'micronutrients_summary', 'entries', 'targets', 'adherence',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'total_calories', 'total_protein', 'total_carbohydrates', 'total_fat',
            'micronutrients_summary', 'created_at', 'updated_at'
        ]

    def get_targets(self, obj):
        """Get user's nutrition targets if available."""
        try:
            targets = obj.user.nutrition_targets
            return {
                'calories': float(targets.calories),
                'protein': float(targets.protein),
                'carbohydrates': float(targets.carbohydrates),
                'fat': float(targets.fat),
                'micronutrients': targets.micronutrients,
            }
        except:
            return None

    def get_adherence(self, obj):
        """Calculate adherence percentage to targets."""
        try:
            targets = obj.user.nutrition_targets
            adherence = {
                'calories': round((float(obj.total_calories) / float(targets.calories)) * 100, 1) if float(targets.calories) > 0 else 0,
                'protein': round((float(obj.total_protein) / float(targets.protein)) * 100, 1) if float(targets.protein) > 0 else 0,
                'carbohydrates': round((float(obj.total_carbohydrates) / float(targets.carbohydrates)) * 100, 1) if float(targets.carbohydrates) > 0 else 0,
                'fat': round((float(obj.total_fat) / float(targets.fat)) * 100, 1) if float(targets.fat) > 0 else 0,
            }
            return adherence
        except:
            return None


class DailyNutritionLogListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views (no nested entries)."""
    
    class Meta:
        from .models import DailyNutritionLog
        model = DailyNutritionLog
        fields = [
            'date', 'total_calories', 'total_protein', 'total_carbohydrates',
            'total_fat', 'micronutrients_summary'
        ]
        read_only_fields = [
            'total_calories', 'total_protein', 'total_carbohydrates', 'total_fat',
            'micronutrients_summary'
        ]


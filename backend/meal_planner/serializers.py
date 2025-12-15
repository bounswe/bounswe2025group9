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
        fields = ['id', 'name', 'meals']
        read_only_fields = ['id']
    
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
    water_grams = serializers.SerializerMethodField(read_only=True)

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
            'carbohydrates', 'fat', 'micronutrients', 'water_grams', 'logged_at'
        ]
        read_only_fields = ['id', 'food_serving_size', 'image_url', 'calories',
                           'protein', 'carbohydrates', 'fat', 'micronutrients', 'water_grams', 'logged_at']
    
    def get_food_name(self, obj):
        """Return the name of the linked FoodEntry if available."""
        return obj.food.name if obj.food else None

    def get_water_grams(self, obj):
        """Return water contribution for this entry (g), to support hydration UI/what-if scenarios."""
        try:
            return round(float(obj.micronutrients.get("Water (g)", 0) or 0), 2)
        except Exception:
            return 0.0

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
    hydration_actual = serializers.SerializerMethodField(read_only=True)
    hydration_target = serializers.SerializerMethodField(read_only=True)
    hydration_ratio = serializers.SerializerMethodField(read_only=True)
    hydration_penalty = serializers.SerializerMethodField(read_only=True)
    base_nutrition_score = serializers.SerializerMethodField(read_only=True)
    hydration_adjusted_score = serializers.SerializerMethodField(read_only=True)

    class Meta:
        from .models import DailyNutritionLog
        model = DailyNutritionLog
        fields = [
            'date', 'total_calories', 'total_protein', 'total_carbohydrates',
            'total_fat', 'micronutrients_summary', 'entries', 'targets', 'adherence',
            'hydration_actual', 'hydration_target', 'hydration_ratio', 'hydration_penalty',
            'base_nutrition_score', 'hydration_adjusted_score',
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

    # --- Hydration & score helpers -----------------------------------------------------
    def _get_water_values(self, obj):
        """Return (actual_water_g, target_water_g)."""
        actual = 0.0
        target = 0.0

        try:
            actual = float(obj.micronutrients_summary.get("Water (g)", 0) or 0)
        except (TypeError, ValueError):
            actual = 0.0

        try:
            targets = obj.user.nutrition_targets
            water_target = targets.micronutrients.get("Water (g)")
            if isinstance(water_target, dict):
                target = float(water_target.get("target", 0) or 0)
            else:
                target = float(water_target or 0)
        except Exception:
            target = 0.0

        return actual, target

    def get_hydration_actual(self, obj):
        actual, _ = self._get_water_values(obj)
        return round(actual, 2)

    def get_hydration_target(self, obj):
        _, target = self._get_water_values(obj)
        return round(target, 2)

    def get_hydration_ratio(self, obj):
        actual, target = self._get_water_values(obj)
        if target <= 0:
            return 1.0
        ratio = actual / target
        # Cap at 1.0 so meeting/exceeding target keeps the score stable
        return round(min(ratio, 1.0), 3)

    def _compute_base_nutrition_score(self, obj):
        """
        Compute a daily base nutrition score as a calorie-weighted average of
        logged foods' nutritionScore (0-10 scale). This stays aligned with the
        existing food-level scoring and avoids changing macro/micro totals.
        """
        entries = obj.entries.select_related("food")
        total_weight = 0.0
        weighted_score = 0.0

        for entry in entries:
            food = entry.food
            if not food or food.nutritionScore is None:
                continue
            try:
                calories = float(entry.calories)
            except (TypeError, ValueError):
                calories = 0.0
            total_weight += max(calories, 0.0)
            weighted_score += max(calories, 0.0) * float(food.nutritionScore)

        if total_weight == 0.0:
            return None
        return round(weighted_score / total_weight, 2)

    def get_base_nutrition_score(self, obj):
        base = self._compute_base_nutrition_score(obj)
        return base

    def get_hydration_penalty(self, obj):
        """
        Hydration weighting:
        - No penalty when hydration meets/exceeds target.
        - Linear penalty up to -2.0 points when hydration is at 0%.
        """
        ratio = self.get_hydration_ratio(obj)
        penalty = -2.0 * max(0.0, 1.0 - ratio)
        return round(penalty, 2)

    def get_hydration_adjusted_score(self, obj):
        """
        Final score = base_nutrition_score + hydration_penalty
        - Keeps existing macro/micro calculations intact.
        - Ensures hydration shortfall directly lowers the score.
        """
        base = self._compute_base_nutrition_score(obj)
        if base is None:
            return None
        adjusted = base + self.get_hydration_penalty(obj)
        # Clamp to 0-10
        return round(max(0.0, min(10.0, adjusted)), 2)


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


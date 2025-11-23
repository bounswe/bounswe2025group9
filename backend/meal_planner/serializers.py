from rest_framework import serializers
from .models import MealPlan
from foods.models import FoodEntry, FoodProposal
from foods.serializers import FoodEntrySerializer


class MealSerializer(serializers.Serializer):
    """Serializer for individual meal items in the meals array"""
    food_id = serializers.IntegerField(required=False, allow_null=True)
    private_food_id = serializers.IntegerField(required=False, allow_null=True)
    serving_size = serializers.FloatField(default=1.0)
    meal_type = serializers.CharField(max_length=50, default='meal')
    
    def validate(self, data):
        """Validate that exactly one of food_id or private_food_id is provided."""
        from foods.models import FoodProposal
        
        food_id = data.get('food_id')
        private_food_id = data.get('private_food_id')
        
        if not food_id and not private_food_id:
            raise serializers.ValidationError(
                "Either food_id or private_food_id must be provided."
            )
        if food_id and private_food_id:
            raise serializers.ValidationError(
                "Only one of food_id or private_food_id can be provided."
            )
        
        # Validate food_id existence
        if food_id and not FoodEntry.objects.filter(id=food_id).exists():
            raise serializers.ValidationError("Food entry with this ID does not exist.")
        
        # Validate private_food_id existence and ownership
        if private_food_id:
            # Get user from request in context
            request = self.context.get('request')
            if not request or not request.user:
                raise serializers.ValidationError("User context is required for private foods.")
            
            user = request.user
            
            if not FoodProposal.objects.filter(
                id=private_food_id,
                proposedBy=user,
                is_private=True
            ).exists():
                raise serializers.ValidationError(
                    "Private food with this ID does not exist or is not accessible."
                )
        
        return data


class MealPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a meal plan with food IDs"""
    meals = MealSerializer(many=True, required=False)
    
    class Meta:
        model = MealPlan
        fields = ['name', 'meals']
    
    def validate_meals(self, value):
        """Validate meals with user context."""
        # Pass the entire serializer context (which includes 'request')
        for meal_data in value:
            meal_serializer = MealSerializer(data=meal_data, context=self.context)
            meal_serializer.is_valid(raise_exception=True)
        return value
    
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
        from foods.serializers import FoodProposalSerializer
        
        meals_details = []
        for meal in obj.meals:
            food_id = meal.get('food_id')
            private_food_id = meal.get('private_food_id')
            
            food_source = None
            food_data = None
            is_private = False
            
            try:
                if food_id:
                    food_source = FoodEntry.objects.get(id=food_id)
                    food_data = FoodEntrySerializer(food_source, context=self.context).data
                elif private_food_id:
                    food_source = FoodProposal.objects.get(id=private_food_id)
                    food_data = FoodProposalSerializer(food_source).data
                    is_private = True
            except (FoodEntry.DoesNotExist, FoodProposal.DoesNotExist):
                continue
            
            if food_source:
                meal_detail = {
                    'food': food_data,
                    'is_private': is_private,
                    'serving_size': meal.get('serving_size', 1.0),
                    'meal_type': meal.get('meal_type', 'meal'),
                    'calculated_nutrition': {
                        'calories': food_source.caloriesPerServing * meal.get('serving_size', 1.0),
                        'protein': food_source.proteinContent * meal.get('serving_size', 1.0),
                        'fat': food_source.fatContent * meal.get('serving_size', 1.0),
                        'carbohydrates': food_source.carbohydrateContent * meal.get('serving_size', 1.0),
                    }
                }
                meals_details.append(meal_detail)
        
        return meals_details


class FoodLogEntrySerializer(serializers.ModelSerializer):
    """Serializer for individual food log entries."""
    food_name = serializers.SerializerMethodField()
    food_id = serializers.PrimaryKeyRelatedField(
        source='food',
        queryset=FoodEntry.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    private_food_id = serializers.PrimaryKeyRelatedField(
        source='private_food',
        queryset=FoodProposal.objects.filter(is_private=True),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        from .models import FoodLogEntry
        model = FoodLogEntry
        fields = [
            'id', 'food_id', 'private_food_id', 'food_name', 'serving_size',
            'serving_unit', 'meal_type', 'calories', 'protein',
            'carbohydrates', 'fat', 'micronutrients', 'logged_at'
        ]
        read_only_fields = ['id', 'calories', 'protein', 'carbohydrates', 
                           'fat', 'micronutrients', 'logged_at']
    
    def get_food_name(self, obj):
        """Get food name from either food or private_food."""
        if obj.food:
            return obj.food.name
        elif obj.private_food:
            return obj.private_food.name
        return None

    def validate_serving_size(self, value):
        """Validate serving size is positive."""
        if value <= 0:
            raise serializers.ValidationError("Serving size must be greater than 0.")
        return value
    
    def validate(self, data):
        """Validate that exactly one of food or private_food is set."""
        food = data.get('food')
        private_food = data.get('private_food')
        
        if not food and not private_food:
            raise serializers.ValidationError(
                "Either food_id or private_food_id must be provided."
            )
        if food and private_food:
            raise serializers.ValidationError(
                "Only one of food_id or private_food_id can be provided."
            )
        
        # Validate private food ownership
        if private_food:
            request = self.context.get('request')
            if request and private_food.proposedBy != request.user:
                raise serializers.ValidationError(
                    "You do not have access to this private food."
                )
        
        return data


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


from rest_framework import serializers
from .models import User, Recipe, Tag, Allergen, UserTag, Report
from .services import get_user_badges

"""
Serializers are used for converting complex data types, like querysets and model instances, into native Python datatypes.
This is done so that they can be easily rendered into JSON, XML or other content types, for API responses.
Serializers also handle deserialization, which is the process of converting parsed data back into complex types.
This is useful for validating incoming data and saving it to the database.
"""


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class ContactInfoSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    address = serializers.CharField(required=True)


class TagInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField(max_length=64, required=False)
    verified = serializers.BooleanField(default=False, required=False, read_only=True)

    def validate_name(self, value):
        """Validate tag name"""
        if value is not None:
            # Strip whitespace
            value = value.strip()
            # Check if empty after stripping
            if not value:
                raise serializers.ValidationError(
                    "Tag name cannot be empty or whitespace only."
                )
        return value


class TagOutputSerializer(serializers.ModelSerializer):
    verified = serializers.SerializerMethodField()
    certificate = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "verified", "certificate"]

    def get_verified(self, tag_obj):
        """Get verification status from UserTag relationship"""
        user = self.context.get("user")
        if not user:
            return False
        try:
            user_tag = UserTag.objects.get(user=user, tag=tag_obj)
            return user_tag.verified
        except UserTag.DoesNotExist:
            return False

    def get_certificate(self, tag_obj):
        """Get certificate URL from UserTag relationship"""
        user = self.context.get("user")
        if not user:
            return None
        try:
            user_tag = UserTag.objects.get(user=user, tag=tag_obj)
            if user_tag.certificate:
                # Return relative URL - works in all environments
                return f"/api/users/certificate/{user_tag.certificate_token}/"
            return None
        except UserTag.DoesNotExist:
            return None


# Serializer for creating/updating allergens (input)
class AllergenInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    common = serializers.BooleanField(default=False, required=False)


# Serializer for returning allergens (output)
class AllergenOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergen
        fields = ["id", "name", "common"]


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ["id", "name", "ingredients"]


# In Model-API interactions we need to convert our Python objects into JSON data.
class UserSerializer(serializers.ModelSerializer):
    recipes = RecipeSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField(read_only=True)
    allergens = AllergenInputSerializer(many=True, required=False)
    profile_image = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

    class Meta:
        """
        model : the model to be serialized
        fields : the fields to be serialized. If you want to serialize all fields, you can use '__all__'.
        extra_kwargs : additional options for the fields. For example, you can set a field to be read-only or required.
        """

        model = User
        fields = [
            "id",
            "username",
            "password",
            "email",
            "name",
            "surname",
            "address",
            "tags",
            "allergens",
            "recipes",
            "profile_image",
            "is_staff",
            "is_superuser",
            "badges",
        ]
        extra_kwargs = {
            "address": {"required": False},
            "password": {"write_only": True},
        }

    def get_profile_image(self, obj):
        """Return the secure endpoint URL for profile image"""
        if obj.profile_image:
            # Return relative URL - works in all environments
            return f"/api/users/profile-image/{obj.profile_image_token}/"
        return None

    def get_badges(self, obj):
        return get_user_badges(obj)

    def get_tags(self, user_obj):
        """Serialize tags with user context for per-user verification"""
        tags = user_obj.tags.all()
        return TagOutputSerializer(tags, many=True, context={"user": user_obj}).data

    def create(self, validated_data):
        allergens_data = validated_data.pop("allergens", [])

        # Create the user (tags are read-only now, handled separately)
        user = User.objects.create_user(**validated_data)

        # Create or attach allergens
        for allergen_data in allergens_data:
            allergen, _ = Allergen.objects.get_or_create(**allergen_data)
            user.allergens.add(allergen)

        return user


class PhotoUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading profile images"""

    class Meta:
        model = User
        fields = ["profile_image"]
        extra_kwargs = {"profile_image": {"required": True}}


class PhotoSerializer(serializers.ModelSerializer):
    """Serializer for retrieving profile image URLs"""

    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["profile_image"]

    def get_profile_image(self, obj):
        """Return the secure endpoint URL for profile image"""
        if obj.profile_image:
            # Return relative URL - works in all environments
            return f"/api/users/profile-image/{obj.profile_image_token}/"
        return None


class ReportSerializer(serializers.ModelSerializer):
    reporter = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Report
        fields = ["id", "reporter", "reportee", "reason"]
        read_only_fields = ["id"]


class UserMetricsSerializer(serializers.ModelSerializer):
    """Serializer for user physical metrics with BMR/TDEE calculation."""
    bmr = serializers.SerializerMethodField(read_only=True)
    tdee = serializers.SerializerMethodField(read_only=True)

    class Meta:
        from .models import UserMetrics
        model = UserMetrics
        fields = ['height', 'weight', 'age', 'gender', 'activity_level', 
                  'bmr', 'tdee', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate_age(self, value):
        """Validate age is reasonable."""
        if value < 1 or value > 150:
            raise serializers.ValidationError("Age must be between 1 and 150.")
        return value

    def validate_height(self, value):
        """Validate height in centimeters."""
        if value < 50 or value > 300:
            raise serializers.ValidationError("Height must be between 50 and 300 cm.")
        return value

    def validate_weight(self, value):
        """Validate weight in kilograms."""
        if value < 20 or value > 500:
            raise serializers.ValidationError("Weight must be between 20 and 500 kg.")
        return value

    def get_bmr(self, obj):
        """Calculate and return BMR."""
        return obj.calculate_bmr()

    def get_tdee(self, obj):
        """Calculate and return TDEE."""
        return obj.calculate_tdee()


class NutritionTargetsSerializer(serializers.ModelSerializer):
    """Serializer for nutrition targets with validation."""
    bmr = serializers.SerializerMethodField(read_only=True)
    tdee = serializers.SerializerMethodField(read_only=True)

    class Meta:
        from .models import NutritionTargets
        model = NutritionTargets
        fields = ['calories', 'protein', 'carbohydrates', 'fat', 'micronutrients',
                  'is_custom', 'bmr', 'tdee', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        """Validate that macro calories don't significantly exceed total calories."""
        from project.utils.nutrition_calculator import calculate_macro_calories
        
        protein = float(data.get('protein', 0))
        carbs = float(data.get('carbohydrates', 0))
        fat = float(data.get('fat', 0))
        calories = float(data.get('calories', 0))
        
        # Calculate calories from macros
        macro_calories = calculate_macro_calories(protein, carbs, fat)
        
        # Allow 5% margin for rounding
        if macro_calories > calories * 1.05:
            raise serializers.ValidationError(
                f"Macronutrients exceed calorie target. "
                f"Macros account for {macro_calories:.0f} kcal but target is {calories:.0f} kcal."
            )
        
        return data

    def get_bmr(self, obj):
        """Get BMR from user metrics if available."""
        try:
            return obj.user.metrics.calculate_bmr()
        except:
            return None

    def get_tdee(self, obj):
        """Get TDEE from user metrics if available."""
        try:
            return obj.user.metrics.calculate_tdee()
        except:
            return None


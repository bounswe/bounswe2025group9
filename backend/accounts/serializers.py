from rest_framework import serializers
from .models import User, Recipe, Tag, Allergen, UserTag

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
    name = serializers.CharField(max_length=255, required=False)
    verified = serializers.BooleanField(default=False, required=False, read_only=True)


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
            return user_tag.certificate.url if user_tag.certificate else None
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
        ]
        extra_kwargs = {
            "address": {"required": False},
            "password": {"write_only": True},
            "profile_image": {"required": False},
        }

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


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["profile_image"]
        extra_kwargs = {"profile_image": {"required": True}}


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["certificate"]
        extra_kwargs = {"certificate": {"required": True}}

from rest_framework import serializers
from .models import User, Recipe, Tag, Allergen

"""
Serializers are used for converting complex data types, like querysets and model instances, into native Python datatypes.
This is done so that they can be easily rendered into JSON, XML or other content types, for API responses.
Serializers also handle deserialization, which is the process of converting parsed data back into complex types.
This is useful for validating incoming data and saving it to the database.
"""


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class AllergenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergen
        fields = ["id", "name"]


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ["id", "name", "ingredients"]


# In Model-API interactions we need to convert our Python objects into JSON data.
class UserSerializer(serializers.ModelSerializer):
    recipes = RecipeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    allergens = AllergenSerializer(many=True, read_only=True)

    class Meta:
        """
        model : the model to be serialized
        fields : the fields to be serialized. If you want to serialize all fields, you can use '__all__'.
        extra_kwargs : additional options for the fields. For example, you can set a field to be read-only or required.
        """

        model = User
        fields = [
            "id",
            "name",
            "surname",
            "email",
            "address",
            "tags",
            "allergens",
            "recipes",
        ]
        extra_kwargs = {"address": {"required": False}}

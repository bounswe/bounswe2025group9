from rest_framework import serializers
from .models import Post, Tag, Comment, Recipe, RecipeIngredient
from foods.models import FoodEntry


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, source="tags"
    )
    like_count = serializers.SerializerMethodField(read_only=True)
    has_recipe = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "author",
            "tags",
            "tag_ids",
            "like_count",
            "has_recipe",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "tags",
            "like_count",
            "has_recipe",
            "created_at",
            "updated_at",
        ]

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_has_recipe(self, obj):
        return hasattr(obj, "recipe")

    def get_author(self, obj):
        author_data = {
            'id': obj.author.id,
            'username': obj.author.username
        }
        
        # Include profile image URL if available
        if obj.author.profile_image:
            # Use relative URL instead of absolute URL to work with nginx
            author_data['profile_image'] = obj.author.profile_image.url
        else:
            author_data['profile_image'] = None
            
        return author_data


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "body", "created_at"]
        read_only_fields = ["id", "author", "created_at"]

    def get_author(self, obj):
        author_data = {
            'id': obj.author.id,
            'username': obj.author.username
        }
        
        # Include profile image URL if available
        if obj.author.profile_image:
            # Use relative URL instead of absolute URL to work with nginx
            author_data['profile_image'] = obj.author.profile_image.url
        else:
            author_data['profile_image'] = None
            
        return author_data


class RecipeIngredientSerializer(serializers.ModelSerializer):
    food_id = serializers.PrimaryKeyRelatedField(
        queryset=FoodEntry.objects.all(), source="food", write_only=True
    )
    food_name = serializers.StringRelatedField(source="food.name", read_only=True)
    protein = serializers.FloatField(source="protein_content", read_only=True)
    fat = serializers.FloatField(source="fat_content", read_only=True)
    carbs = serializers.FloatField(source="carbohydrate_content", read_only=True)
    calories = serializers.FloatField(source="calorie_content", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = [
            "id",
            "food_id",
            "food_name",
            "amount",
            "protein",
            "fat",
            "carbs",
            "calories",
        ]
        read_only_fields = ["id", "food_name", "protein", "fat", "carbs", "calories"]


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=False)
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(), source="post", write_only=True
    )
    post_title = serializers.StringRelatedField(source="post.title", read_only=True)
    author = serializers.SerializerMethodField(read_only=True)
    total_protein = serializers.FloatField(read_only=True)
    total_fat = serializers.FloatField(read_only=True)
    total_carbohydrates = serializers.FloatField(read_only=True)
    total_calories = serializers.FloatField(read_only=True)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "post_id",
            "post_title",
            "author",
            "instructions",
            "ingredients",
            "total_protein",
            "total_fat",
            "total_carbohydrates",
            "total_calories",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "post_title",
            "author",
            "total_protein",
            "total_fat",
            "total_carbohydrates",
            "total_calories",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **ingredient_data)

        return recipe

    def get_author(self, obj):
        author_data = {
            'id': obj.post.author.id,
            'username': obj.post.author.username
        }
        
        # Include profile image URL if available
        if obj.post.author.profile_image:
            request = self.context.get('request')
            if request:
                author_data['profile_image'] = request.build_absolute_uri(obj.post.author.profile_image.url)
            else:
                author_data['profile_image'] = obj.post.author.profile_image.url
        else:
            author_data['profile_image'] = None
            
        return author_data

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])

        # Update recipe instance
        instance.instructions = validated_data.get(
            "instructions", instance.instructions
        )
        instance.save()

        # Delete existing ingredients
        instance.ingredients.all().delete()

        # Create new ingredients
        for ingredient_data in ingredients_data:
            RecipeIngredient.objects.create(recipe=instance, **ingredient_data)

        return instance

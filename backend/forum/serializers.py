from decimal import Decimal

from rest_framework import serializers
from .models import Post, Tag, Comment, Recipe, RecipeIngredient
from foods.models import FoodEntry
from foods.services import recalculate_recipes_for_food, FoodAccessService


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
        queryset=FoodEntry.objects.none(),  # Will be set in __init__
        source="food",
        write_only=True
    )
    food_name = serializers.StringRelatedField(source="food.name", read_only=True)
    protein = serializers.FloatField(source="protein_content", read_only=True)
    fat = serializers.FloatField(source="fat_content", read_only=True)
    carbs = serializers.FloatField(source="carbohydrate_content", read_only=True)
    calories = serializers.FloatField(source="calorie_content", read_only=True)
    cost = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        """Initialize and set accessible foods queryset based on user context"""
        super().__init__(*args, **kwargs)
        # Get user from context
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Set queryset to only accessible foods for this user
        self.fields['food_id'].queryset = FoodAccessService.get_accessible_foods(user=user)

    class Meta:
        model = RecipeIngredient
        fields = [
            "id",
            "food_id",
            "food_name",
            "amount",
            "customUnit",
            "customAmount",
            "protein",
            "fat",
            "carbs",
            "calories",
            "cost",
        ]
        read_only_fields = [
            "id",
            "food_name",
            "protein",
            "fat",
            "carbs",
            "calories",
            "cost",
        ]

    def get_cost(self, obj):
        return float(obj.estimated_cost.quantize(Decimal("0.01")))


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
    total_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, allow_null=True
    )
    currency = serializers.CharField(read_only=True)
    price_category = serializers.CharField(read_only=True, allow_null=True)
    nutrition_score = serializers.FloatField(read_only=True)
    cost_to_nutrition_ratio = serializers.SerializerMethodField()

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
            "total_cost",
            "currency",
            "price_category",
            "nutrition_score",
            "cost_to_nutrition_ratio",
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
            "total_cost",
            "currency",
            "price_category",
            "nutrition_score",
            "cost_to_nutrition_ratio",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def get_fields(self):
        fields = super().get_fields()
        fields["ingredients"] = RecipeIngredientSerializer(
            many=True,
            context=self.context
        )
        return fields

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **ingredient_data)

        self._refresh_recipe_cost(recipe)
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

        self._refresh_recipe_cost(instance)
        return instance

    def _refresh_recipe_cost(self, recipe):
        foods = [ingredient.food for ingredient in recipe.ingredients.all()]
        user = None
        request = self.context.get("request")
        if request:
            user = getattr(request, "user", None)
        for food in set(foods):
            recalculate_recipes_for_food(food, changed_by=user)

    def get_cost_to_nutrition_ratio(self, obj):
        """Return cost-to-nutrition ratio or None if unavailable"""
        ratio = obj.cost_to_nutrition_ratio
        if ratio is None:
            return None
        return round(ratio, 2)

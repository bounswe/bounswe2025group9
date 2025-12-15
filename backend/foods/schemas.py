"""
OpenAPI schema examples and serializers for Foods app endpoints.
These are used to enhance Swagger documentation with request/response examples.
"""

from rest_framework import serializers
from drf_spectacular.utils import OpenApiExample


# Request serializers for documentation
class FoodSearchRequestSerializer(serializers.Serializer):
    """Request body for POST /api/foods/ - Advanced food search and filtering"""
    
    search = serializers.CharField(
        required=False,
        help_text="Search term to filter foods by name (case-insensitive)",
        allow_blank=True
    )
    category = serializers.CharField(
        required=False,
        help_text="Comma-separated list of categories (e.g., 'Vegetables,Fruits')",
        allow_blank=True
    )
    sort_by = serializers.CharField(
        required=False,
        help_text="Field to sort by: nutrition-score, protein, carbohydrate, fat, price, cost-nutrition-ratio, name",
        allow_blank=True
    )
    order = serializers.ChoiceField(
        choices=['asc', 'desc'],
        required=False,
        help_text="Sort order: asc or desc (default: desc)"
    )
    micronutrients = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="List of micronutrient filters with min/max values"
    )


class MicronutrientFilterSerializer(serializers.Serializer):
    """Micronutrient filter specification"""
    
    Micronutrient = serializers.CharField(
        help_text="Micronutrient name (e.g., 'Iron', 'Vitamin C')"
    )
    MinValue = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="Minimum value (per specified grams)"
    )
    MaxValue = serializers.ListField(
        child=serializers.FloatField(),
        required=False,
        help_text="Maximum value (per specified grams)"
    )
    PerHowmanyGrams = serializers.CharField(
        default="100 gr",
        help_text="Amount in grams (e.g., '100 gr', '150 gr')"
    )


# OpenAPI Examples
FOOD_SEARCH_EXAMPLES = [
    OpenApiExample(
        "Basic Search",
        summary="Simple search by name",
        description="Search for foods containing 'apple' in their name",
        value={
            "search": "apple",
            "sort_by": "nutrition-score",
            "order": "desc"
        },
        request_only=True,
    ),
    OpenApiExample(
        "Category Filter",
        summary="Filter by categories",
        description="Get all fruits and vegetables",
        value={
            "category": "Fruits,Vegetables",
            "sort_by": "name",
            "order": "asc"
        },
        request_only=True,
    ),
    OpenApiExample(
        "Micronutrient Filter",
        summary="Filter by micronutrients",
        description="Find foods high in iron and vitamin C",
        value={
            "search": "",
            "micronutrients": [
                {
                    "Micronutrient": "Iron",
                    "MinValue": [3.0],
                    "MaxValue": [],
                    "PerHowmanyGrams": "100 gr"
                },
                {
                    "Micronutrient": "Vitamin C",
                    "MinValue": [20.0],
                    "MaxValue": [],
                    "PerHowmanyGrams": "100 gr"
                }
            ],
            "sort_by": "nutrition-score",
            "order": "desc"
        },
        request_only=True,
    ),
    OpenApiExample(
        "Cost Optimization",
        summary="Find best cost-nutrition ratio",
        description="Sort foods by cost efficiency (price per nutrition score)",
        value={
            "category": "Vegetables,Grains",
            "sort_by": "cost-nutrition-ratio",
            "order": "asc"
        },
        request_only=True,
    ),
]


PRIVATE_FOOD_CREATE_EXAMPLE = OpenApiExample(
    "Create Private Food",
    summary="Create a new private food entry",
    description="Create a custom food item visible only to you",
    value={
        "name": "My Custom Protein Shake",
        "category": "Beverages",
        "servingSize": "250 ml",
        "calories": 200,
        "proteinContent": 25.0,
        "carbohydrateContent": 15.0,
        "fatContent": 3.0,
        "nutritionScore": 85,
        "description": "Homemade protein shake recipe"
    },
    request_only=True,
)


FOOD_PROPOSAL_EXAMPLE = OpenApiExample(
    "Submit Food Proposal",
    summary="Submit private food for validation",
    description="Request moderator approval for a private food to make it public",
    value={
        "food_entry_id": 123
    },
    request_only=True,
)

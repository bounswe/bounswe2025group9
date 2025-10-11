from django.urls import path

from .views import (
    FoodCatalog,
    GetOrFetchFoodEntry,
    FoodProposalSubmitView,
    suggest_recipe,
    get_random_meal,
    food_nutrition_info,
)

urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
    path(
        "manual-proposal/",
        FoodProposalSubmitView.as_view(),
        name="submit_food_proposal",
    ),
    path("get-or-fetch/", GetOrFetchFoodEntry.as_view(), name="get_or_fetch_food"),
    path("suggest_recipe/", suggest_recipe, name="suggest_recipe"),
    path("random-meal/", get_random_meal, name="random-meal"),
    path("", FoodCatalog.as_view(), name="get_foods"),
    path("catalog/", FoodCatalog.as_view(), name="food-catalog"),
    path("food/nutrition-info/", food_nutrition_info, name="food_nutrition_info"),
]

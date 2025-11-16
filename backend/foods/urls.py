from django.urls import path
from django.urls import include

from rest_framework.routers import DefaultRouter

from .views import (
    FoodCatalog,
    GetOrFetchFoodEntry,
    FoodProposalSubmitView,
    suggest_recipe,
    get_random_meal,
    food_nutrition_info,
    image_proxy,
)
from .admin import FoodProposalModerationViewSet

moderation_router = DefaultRouter()
moderation_router.register(
    r"food-proposals",
    FoodProposalModerationViewSet,
    basename="moderation-food-proposals",
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
    path("image-proxy/", image_proxy, name="image_proxy"),
    path("moderation/", include(moderation_router.urls), name="moderation"),
]

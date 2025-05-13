from django.urls import path
from .views import FoodCatalog
from foods.views import suggest_recipe

urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
    path("suggest_recipe/", suggest_recipe, name="suggest_recipe"),
]

from django.urls import path
from .views import FoodCatalog, suggest_recipe, get_random_meal

urlpatterns = [
    path('catalog/', FoodCatalog.as_view(), name='food-catalog'),
    path('suggest-recipe/', suggest_recipe, name='suggest-recipe'),
    path('random-meal/', get_random_meal, name='random-meal'),
]

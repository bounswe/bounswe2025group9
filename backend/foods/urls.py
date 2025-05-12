from django.urls import path
from .views import FoodCatalog, GetOrFetchFoodEntry

urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
    path("get-or-fetch/", GetOrFetchFoodEntry.as_view(), name="get_or_fetch_food"),
]
from django.urls import path
from .views import FoodCatalog

urlpatterns = [
    path("get_foods", FoodCatalog.as_view(), name="get_foods"),
]

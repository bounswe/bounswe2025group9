from django.urls import path
from .views import FoodCatalog

urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
]

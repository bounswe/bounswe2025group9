from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MealPlanListCreateView,
    MealPlanDetailView,
    set_current_meal_plan,
    get_current_meal_plan,
    DailyNutritionLogView,
    DailyNutritionHistoryView,
    FoodLogEntryViewSet,
    NutritionStatisticsView,
)

# Router for FoodLogEntryViewSet
router = DefaultRouter()
router.register(r'daily-log/entries', FoodLogEntryViewSet, basename='food-log-entry')

urlpatterns = [
    # Meal plan endpoints
    path('', MealPlanListCreateView.as_view(), name='meal-plan-list-create'),
    path('current/', get_current_meal_plan, name='get-current-meal-plan'),
    path('<int:pk>/', MealPlanDetailView.as_view(), name='meal-plan-detail'),
    path('<int:meal_plan_id>/set-current/', set_current_meal_plan, name='set-current-meal-plan'),
    
    # Daily nutrition logging endpoints
    path('daily-log/', DailyNutritionLogView.as_view(), name='daily-nutrition-log'),
    path('daily-log/history/', DailyNutritionHistoryView.as_view(), name='daily-nutrition-history'),
    path('nutrition-statistics/', NutritionStatisticsView.as_view(), name='nutrition-statistics'),
    
    # Include router URLs for food log entries
    path('', include(router.urls)),
]


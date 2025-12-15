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
    PlannedFoodEntryViewSet,
    convert_planned_to_log,
    NutritionStatisticsView,
)

# Router for FoodLogEntryViewSet and PlannedFoodEntryViewSet
router = DefaultRouter()
router.register(r'daily-log/entries', FoodLogEntryViewSet, basename='food-log-entry')
router.register(r'daily-log/planned', PlannedFoodEntryViewSet, basename='planned-food-entry')

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
    
    # Convert planned entry to log entry
    path('daily-log/planned/<int:pk>/convert/', convert_planned_to_log, name='convert-planned-to-log'),
    
    # Include router URLs for food log entries and planned entries
    path('', include(router.urls)),
]


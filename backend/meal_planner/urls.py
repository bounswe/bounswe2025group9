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
    SavedMealPlanListCreateView,
    SavedMealPlanDetailView,
    SavedMealPlanEntryViewSet,
    log_saved_meal_plan,
    plan_saved_meal_plan,
    create_saved_meal_plan_from_log,
)

# Router for FoodLogEntryViewSet and PlannedFoodEntryViewSet
router = DefaultRouter()
router.register(r'daily-log/entries', FoodLogEntryViewSet, basename='food-log-entry')
router.register(r'daily-log/planned', PlannedFoodEntryViewSet, basename='planned-food-entry')

urlpatterns = [
    # Meal plan endpoints (legacy)
    path('', MealPlanListCreateView.as_view(), name='meal-plan-list-create'),
    path('current/', get_current_meal_plan, name='get-current-meal-plan'),
    path('<int:pk>/', MealPlanDetailView.as_view(), name='meal-plan-detail'),
    path('<int:meal_plan_id>/set-current/', set_current_meal_plan, name='set-current-meal-plan'),
    
    # Saved meal plan endpoints (new reusable templates)
    path('saved-plans/', SavedMealPlanListCreateView.as_view(), name='saved-meal-plan-list-create'),
    path('saved-plans/from-log/', create_saved_meal_plan_from_log, name='create-saved-meal-plan-from-log'),
    path('saved-plans/<int:pk>/', SavedMealPlanDetailView.as_view(), name='saved-meal-plan-detail'),
    path('saved-plans/<int:pk>/log/', log_saved_meal_plan, name='log-saved-meal-plan'),
    path('saved-plans/<int:pk>/plan/', plan_saved_meal_plan, name='plan-saved-meal-plan'),
    path('saved-plans/<int:plan_id>/entries/', SavedMealPlanEntryViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='saved-meal-plan-entry-list'),
    path('saved-plans/<int:plan_id>/entries/<int:pk>/', SavedMealPlanEntryViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='saved-meal-plan-entry-detail'),
    
    # Daily nutrition logging endpoints
    path('daily-log/', DailyNutritionLogView.as_view(), name='daily-nutrition-log'),
    path('daily-log/history/', DailyNutritionHistoryView.as_view(), name='daily-nutrition-history'),
    path('nutrition-statistics/', NutritionStatisticsView.as_view(), name='nutrition-statistics'),
    
    # Convert planned entry to log entry
    path('daily-log/planned/<int:pk>/convert/', convert_planned_to_log, name='convert-planned-to-log'),
    
    # Include router URLs for food log entries and planned entries
    path('', include(router.urls)),
]


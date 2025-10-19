from django.urls import path
from .views import (
    MealPlanListCreateView,
    MealPlanDetailView,
    set_current_meal_plan,
    get_current_meal_plan,
)

urlpatterns = [
    # Meal plan endpoints
    path('', MealPlanListCreateView.as_view(), name='meal-plan-list-create'),
    path('current/', get_current_meal_plan, name='get-current-meal-plan'),
    path('<int:pk>/', MealPlanDetailView.as_view(), name='meal-plan-detail'),
    path('<int:meal_plan_id>/set-current/', set_current_meal_plan, name='set-current-meal-plan'),
]

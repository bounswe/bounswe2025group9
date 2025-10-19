from django.contrib import admin
from .models import MealPlan


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'is_active', 'total_calories', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email', 'name']
    readonly_fields = ['created_at', 'updated_at', 'total_calories', 'total_protein', 'total_fat', 'total_carbohydrates']
    
    def save_model(self, request, obj, form, change):
        """Override save to recalculate nutrition when meals are updated"""
        super().save_model(request, obj, form, change)
        if obj.meals:  # Only recalculate if meals exist
            obj.calculate_total_nutrition()

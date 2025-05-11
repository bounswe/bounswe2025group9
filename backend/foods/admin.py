from django.contrib import admin
from .models import FoodEntry, FoodProposal, Allergen


@admin.register(FoodEntry)
class AdminFoodEntry(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "imageUrl",
        "caloriesPerServing",
        "proteinContent",
        "fatContent",
        "carbohydrateContent",
        "nutritionScore",
    )
    search_fields = ("name", "category")
    list_filter = ("category",)
    ordering = ("-caloriesPerServing",)


@admin.register(FoodProposal)
class AdminFoodProposal(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "imageUrl",
        "caloriesPerServing",
        "proteinContent",
        "fatContent",
        "carbohydrateContent",
        "nutritionScore",
        "isApproved",
        "createdAt",
        "proposedBy",
    )
    list_editable = ("isApproved",)
    search_fields = ("name",)
    list_filter = ("isApproved",)
    readonly_fields = ("createdAt", "proposedBy")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return True

    def has_view_permission(self, request, obj=None):
        return True

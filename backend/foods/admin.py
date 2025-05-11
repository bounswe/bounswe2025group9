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
    actions = ["approve_proposals", "reject_proposals"]

    def approve_proposals(self, request, queryset):
        queryset.update(isApproved=True)

    def reject_proposals(self, request, queryset):
        queryset.update(isApproved=False)

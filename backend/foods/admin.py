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

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = FoodProposal.objects.get(pk=obj.pk)
            was_approved = old_obj.isApproved
        else:
            was_approved = False

        # Save the model first
        super().save_model(request, obj, form, change)

        # If just approved, create a FoodEntry (only once)
        if obj.isApproved and not was_approved:
            entry = FoodEntry.objects.create(
                name=obj.name,
                category=obj.category,
                servingSize=obj.servingSize,
                caloriesPerServing=obj.caloriesPerServing,
                proteinContent=obj.proteinContent,
                fatContent=obj.fatContent,
                carbohydrateContent=obj.carbohydrateContent,
                dietaryOptions=obj.dietaryOptions,
                nutritionScore=obj.nutritionScore,
                imageUrl=obj.imageUrl,
            )
            entry.allergens.set(obj.allergens.all())

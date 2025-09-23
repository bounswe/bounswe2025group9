from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

from .models import Tag, Allergen, Recipe

User = get_user_model()


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    model = User
    list_display = ("username", "email", "name", "surname", "is_staff", "is_active")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("username", "email", "name", "surname")
    ordering = ("username",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("name", "surname", "email", "address")}),
        ("Preferences", {"fields": ("tags", "allergens")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    filter_horizontal = ("tags", "allergens", "groups", "user_permissions")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")
    search_fields = ("name",)
    autocomplete_fields = ("owner",)

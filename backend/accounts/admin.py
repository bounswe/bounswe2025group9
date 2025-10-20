from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

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
    list_display = (
        "name",
        "verified",
        "has_certificate",
        "certificate_link",
        "user_count",
    )
    list_filter = ("verified", "certificate")
    search_fields = ("name",)
    list_editable = ("verified",)
    actions = ["approve_certificates", "reject_certificates"]

    def has_certificate(self, obj):
        return bool(obj.certificate)

    has_certificate.boolean = True
    has_certificate.short_description = "Certificate Uploaded"

    def certificate_link(self, obj):
        if obj.certificate:
            return format_html(
                '<a href="{}" target="_blank">View Certificate</a>', obj.certificate.url
            )
        return "-"

    certificate_link.short_description = "Certificate"

    def user_count(self, obj):
        return obj.user_set.count()

    user_count.short_description = "Users"

    def approve_certificates(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f"{updated} tag(s) approved successfully.")

    approve_certificates.short_description = "Approve selected tags"

    def reject_certificates(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f"{updated} tag(s) rejected.")

    reject_certificates.short_description = "Reject selected tags"


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")
    search_fields = ("name",)
    autocomplete_fields = ("owner",)

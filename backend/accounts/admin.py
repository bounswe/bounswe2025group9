from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

from .models import Tag, Allergen, Recipe, UserTag

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
        ("Preferences", {"fields": ("allergens",)}),
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
    filter_horizontal = ("allergens", "groups", "user_permissions")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "user_count")
    search_fields = ("name",)

    def user_count(self, obj):
        return UserTag.objects.filter(tag=obj).count()

    user_count.short_description = "Users with Tag"


@admin.register(UserTag)
class UserTagAdmin(admin.ModelAdmin):
    """Admin interface for reviewing and approving user profession certificates"""

    list_display = (
        "user_username",
        "tag_name",
        "verified",
        "has_certificate",
        "certificate_link",
    )
    list_filter = ("verified", "tag__name")
    search_fields = ("user__username", "user__email", "tag__name")
    list_editable = ("verified",)
    actions = ["approve_certificates", "reject_certificates"]
    raw_id_fields = ("user", "tag")

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "User"
    user_username.admin_order_field = "user__username"

    def tag_name(self, obj):
        return obj.tag.name

    tag_name.short_description = "Profession Tag"
    tag_name.admin_order_field = "tag__name"

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

    def approve_certificates(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(
            request, f"{updated} user-tag certificate(s) approved successfully."
        )

    approve_certificates.short_description = "Approve selected certificates"

    def reject_certificates(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f"{updated} user-tag certificate(s) rejected.")

    reject_certificates.short_description = "Reject selected certificates"


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")
    search_fields = ("name",)
    autocomplete_fields = ("owner",)

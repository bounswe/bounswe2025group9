from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from rest_framework import serializers, viewsets
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action

from .models import Tag, Allergen, Recipe, UserTag
from .services import approve_user_tag_certificate, reject_user_tag_certificate


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
            # Use the new secure token-based endpoint
            certificate_url = f"/api/users/certificate/{obj.certificate_token}/"
            return format_html(
                '<a href="{}" target="_blank">View Certificate</a>', certificate_url
            )
        return "-"

    certificate_link.short_description = "Certificate"

    def approve_certificates(self, request, queryset):
        count = 0
        for user_tag in queryset:
            approve_user_tag_certificate(user_tag)
            count += 1
        self.message_user(
            request, f"{count} user-tag certificate(s) approved successfully."
        )

    approve_certificates.short_description = "Approve selected certificates"

    def reject_certificates(self, request, queryset):
        count = 0
        for user_tag in queryset:
            reject_user_tag_certificate(user_tag)
            count += 1
        self.message_user(request, f"{count} user-tag certificate(s) rejected.")

    reject_certificates.short_description = "Reject selected certificates"


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("name", "owner")
    search_fields = ("name",)
    autocomplete_fields = ("owner",)


class UserModerationSerializer(serializers.ModelSerializer):
    """Serializer for listing users in moderation panel."""

    isActive = serializers.BooleanField(source="is_active")
    isStaff = serializers.BooleanField(source="is_staff")
    isSuperuser = serializers.BooleanField(source="is_superuser")
    dateJoined = serializers.DateTimeField(source="date_joined")
    tags = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "surname",
            "isActive",
            "isStaff",
            "isSuperuser",
            "dateJoined",
            "tags",
        ]

    def get_tags(self, obj):
        """Get user's tags with verification status."""
        user_tags = UserTag.objects.filter(user=obj).select_related("tag")
        return [
            {"id": ut.tag.id, "name": ut.tag.name, "verified": ut.verified}
            for ut in user_tags
        ]


class UserTagModerationSerializer(serializers.ModelSerializer):
    """Serializer for listing user tags with certificate information."""

    user = serializers.SerializerMethodField()
    tag = serializers.SerializerMethodField()
    certificate = serializers.SerializerMethodField()

    class Meta:
        model = UserTag
        fields = ["id", "user", "tag", "verified", "certificate"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email,
        }

    def get_tag(self, obj):
        return {"id": obj.tag.id, "name": obj.tag.name}

    def get_certificate(self, obj):
        if obj.certificate:
            return f"/api/users/certificate/{obj.certificate_token}/"
        return None


class CertificateVerificationSerializer(serializers.Serializer):
    """Serializer for certificate verification action."""

    approved = serializers.BooleanField(required=True)


class IsAdminUser(BasePermission):
    """
    Permission class that allows only staff members and superusers to access.
    Used for all moderation endpoints to ensure only authorized users can
    perform moderation actions.
    """

    def has_permission(self, request, view):  # type: ignore
        """
        Check if user is authenticated and is either staff or superuser.
        """
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class UserModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user management in moderation panel.
    Allows admins to list and search users.
    """

    queryset = User.objects.all().prefetch_related("tags")
    serializer_class = UserModerationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filter and search users based on query parameters."""
        queryset = super().get_queryset()

        # Filter by role
        role = self.request.query_params.get("role")
        if role == "staff":
            queryset = queryset.filter(is_staff=True)
        elif role == "users":
            queryset = queryset.filter(is_staff=False)

        # Search by username, email, or name
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(name__icontains=search)
                | Q(surname__icontains=search)
            )

        return queryset.order_by("-date_joined")


class UserTagModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for certificate verification.
    Allows admins to list and verify user profession certificates.
    """

    queryset = UserTag.objects.all().select_related("user", "tag")
    serializer_class = UserTagModerationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by certificate presence
        has_certificate = self.request.query_params.get("has_certificate")
        if has_certificate == "true":
            queryset = queryset.exclude(certificate="").exclude(
                certificate__isnull=True
            )

        # Filter by verification status
        verified = self.request.query_params.get("verified")
        if verified == "true":
            queryset = queryset.filter(verified=True)
        elif verified == "false":
            queryset = queryset.filter(verified=False)

        return queryset.order_by(
            "-id"
        )  # Order by ID as UserTag doesn't have created_at

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """
        Approve or reject a certificate.
        POST /api/moderation/user-tags/{id}/verify/
        Body: {"approved": true/false}
        """
        user_tag = self.get_object()
        serializer = CertificateVerificationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        approved = serializer.validated_data["approved"]

        if approved:
            approve_user_tag_certificate(user_tag)
            message = f"Certificate for {user_tag.user.username}'s {user_tag.tag.name} tag approved."
        else:
            reject_user_tag_certificate(user_tag)
            message = f"Certificate for {user_tag.user.username}'s {user_tag.tag.name} tag rejected."

        return Response({"message": message}, status=status.HTTP_200_OK)

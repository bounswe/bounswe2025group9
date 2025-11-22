from rest_framework.permissions import BasePermission

PRICE_MODERATOR_GROUPS = ("content_manager", "community_moderator")


class IsPriceModerator(BasePermission):
    """
    Allows access to staff, superusers, or members of moderator groups.
    """

    def has_permission(self, request, view):  # type: ignore[override]
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        return user.groups.filter(name__in=PRICE_MODERATOR_GROUPS).exists()


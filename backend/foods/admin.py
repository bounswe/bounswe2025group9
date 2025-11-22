from django.contrib import admin
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action
from .models import (
    FoodEntry,
    FoodProposal,
    PriceAudit,
    PriceCategoryThreshold,
    PriceReport,
)
from .services import approve_food_proposal, reject_food_proposal


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
        "base_price",
        "price_unit",
        "price_category",
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
            old_status = old_obj.isApproved
        else:
            old_status = None

        # Handle status changes using services
        if obj.isApproved is True and old_status != True:
            # Approving (from None or False to True)
            approve_food_proposal(obj, changed_by=request.user)
        elif obj.isApproved is False and old_status != False:
            # Rejecting (from None or True to False)
            reject_food_proposal(obj)
        else:
            # No status change, just save normally
            super().save_model(request, obj, form, change)


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


class FoodProposalModerationSerializer(serializers.ModelSerializer):
    """Serializer for listing food proposals."""

    proposedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(read_only=True)
    allergens = serializers.SerializerMethodField()

    class Meta:
        model = FoodProposal
        fields = [
            "id",
            "name",
            "category",
            "servingSize",
            "caloriesPerServing",
            "proteinContent",
            "fatContent",
            "carbohydrateContent",
            "nutritionScore",
            "imageUrl",
            "isApproved",
            "proposedBy",
            "createdAt",
            "allergens",
            "dietaryOptions",
            "base_price",
            "price_unit",
            "currency",
        ]

    def get_proposedBy(self, obj):
        return {"id": obj.proposedBy.id, "username": obj.proposedBy.username}

    def get_allergens(self, obj):
        return [allergen.name for allergen in obj.allergens.all()]


class FoodProposalActionSerializer(serializers.Serializer):
    """Serializer for food proposal approval/rejection action."""

    approved = serializers.BooleanField(required=True)


class FoodProposalModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for food proposal moderation.
    Allows admins to list and approve/reject food proposals.
    """

    queryset = (
        FoodProposal.objects.all()
        .select_related("proposedBy")
        .prefetch_related("allergens")
    )
    serializer_class = FoodProposalModerationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filter queryset based on approval status."""
        queryset = super().get_queryset()

        is_approved = self.request.query_params.get("isApproved")
        # isApproved is now a NullBooleanField:
        # null = pending (not yet reviewed)
        # True = approved
        # False = rejected
        if is_approved == "null":
            queryset = queryset.filter(isApproved__isnull=True)
        elif is_approved == "true":
            queryset = queryset.filter(isApproved=True)
        elif is_approved == "false":
            queryset = queryset.filter(isApproved=False)
        # If is_approved not specified, return all

        return queryset.order_by("-createdAt")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Approve or reject a food proposal.
        POST /api/moderation/food-proposals/{id}/approve/
        Body: {"approved": true/false}
        """
        proposal = self.get_object()
        serializer = FoodProposalActionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        approved = serializer.validated_data["approved"]

        if approved:
            proposal, entry = approve_food_proposal(
                proposal, changed_by=request.user
            )
            message = f"Food proposal '{proposal.name}' approved and added to catalog."
        else:
            reject_food_proposal(proposal)
            message = f"Food proposal '{proposal.name}' rejected."

        return Response({"message": message}, status=status.HTTP_200_OK)


@admin.register(PriceCategoryThreshold)
class PriceCategoryThresholdAdmin(admin.ModelAdmin):
    list_display = (
        "price_unit",
        "currency",
        "lower_threshold",
        "upper_threshold",
        "updates_since_recalculation",
        "last_recalculated_at",
    )
    list_filter = ("price_unit", "currency")


@admin.register(PriceAudit)
class PriceAuditAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "food",
        "price_unit",
        "currency",
        "change_type",
        "old_base_price",
        "new_base_price",
        "old_price_category",
        "new_price_category",
        "changed_by",
        "created_at",
    )
    list_filter = ("change_type", "price_unit", "currency")
    search_fields = ("food__name", "changed_by__username")
    readonly_fields = ("metadata",)


@admin.register(PriceReport)
class PriceReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "food",
        "reported_by",
        "status",
        "created_at",
        "resolved_by",
        "resolved_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("food__name", "reported_by__username")

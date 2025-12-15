from django.contrib import admin
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action
from .models import (
    FoodEntry,
    FoodProposal,
    FoodEntryMicronutrient,
    Micronutrient,
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
        "get_food_name",
        "get_food_category",
        "isApproved",
        "createdAt",
        "proposedBy",
    )
    list_editable = ("isApproved",)
    search_fields = ("food_entry__name",)
    list_filter = ("isApproved",)
    readonly_fields = ("createdAt", "proposedBy", "food_entry")

    def get_food_name(self, obj):
        return obj.food_entry.name if obj.food_entry else "N/A"
    get_food_name.short_description = "Food Name"

    def get_food_category(self, obj):
        return obj.food_entry.category if obj.food_entry else "N/A"
    get_food_category.short_description = "Category"

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
    # ---- FoodEntry fields (flat, read-only) ----
    name = serializers.CharField(source="food_entry.name", read_only=True)
    category = serializers.CharField(source="food_entry.category", read_only=True)
    servingSize = serializers.FloatField(source="food_entry.servingSize", read_only=True)
    caloriesPerServing = serializers.FloatField(
        source="food_entry.caloriesPerServing", read_only=True
    )
    proteinContent = serializers.FloatField(
        source="food_entry.proteinContent", read_only=True
    )
    fatContent = serializers.FloatField(
        source="food_entry.fatContent", read_only=True
    )
    carbohydrateContent = serializers.FloatField(
        source="food_entry.carbohydrateContent", read_only=True
    )
    dietaryOptions = serializers.ListField(
        source="food_entry.dietaryOptions",
        child=serializers.CharField(),
        read_only=True,
    )
    nutritionScore = serializers.FloatField(
        source="food_entry.nutritionScore", read_only=True
    )
    imageUrl = serializers.SerializerMethodField()
    micronutrients = serializers.SerializerMethodField()

    proposedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(read_only=True)

    class Meta:
        model = FoodProposal
        fields = [
            "id",

            # flat food fields
            "name",
            "category",
            "servingSize",
            "caloriesPerServing",
            "proteinContent",
            "fatContent",
            "carbohydrateContent",
            "dietaryOptions",
            "nutritionScore",
            "imageUrl",
            "micronutrients",

            # proposal fields
            "isApproved",
            "proposedBy",
            "createdAt",
        ]

    def get_imageUrl(self, obj):
        """Return the food entry's image URL, or empty string if not set."""
        if obj.food_entry and obj.food_entry.imageUrl:
            return obj.food_entry.imageUrl
        return ""

    def get_proposedBy(self, obj):
        return {
            "id": obj.proposedBy.id,
            "username": obj.proposedBy.username,
        }

    def get_micronutrients(self, obj):
        """Return the food entry's micronutrients as a dictionary."""
        if not obj.food_entry:
            return {}
        return {
            link.micronutrient.name: {
                'value': round(link.value, 2),
                'unit': link.micronutrient.unit
            }
            for link in obj.food_entry.micronutrient_values.all()
        }


class FoodProposalEditSerializer(serializers.Serializer):
    """Serializer for editing food proposal's food entry by moderators."""
    name = serializers.CharField(required=False)
    category = serializers.CharField(required=False)
    servingSize = serializers.FloatField(required=False)
    caloriesPerServing = serializers.FloatField(required=False)
    proteinContent = serializers.FloatField(required=False)
    fatContent = serializers.FloatField(required=False)
    carbohydrateContent = serializers.FloatField(required=False)
    dietaryOptions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )
    imageUrl = serializers.URLField(required=False, allow_blank=True)
    micronutrients = serializers.DictField(
        child=serializers.FloatField(),
        required=False,
        help_text="Dictionary mapping micronutrient names to values"
    )



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
        .select_related("proposedBy", "food_entry")
        .prefetch_related("food_entry__allergens")
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
            proposal, entry = approve_food_proposal(proposal, changed_by=request.user)
            message = f"Food proposal '{proposal.food_entry.name}' approved and added to catalog."
        else:
            reject_food_proposal(proposal)
            message = f"Food proposal '{proposal.food_entry.name}' rejected."

        return Response({"message": message}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def edit(self, request, pk=None):
        """
        Edit a food proposal's food entry.
        PATCH /api/foods/moderation/food-proposals/{id}/edit/
        Body: { name?, category?, servingSize?, caloriesPerServing?, proteinContent?, fatContent?, carbohydrateContent?, dietaryOptions?, imageUrl? }
        """
        proposal = self.get_object()
        serializer = FoodProposalEditSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        food_entry = proposal.food_entry
        data = serializer.validated_data

        # Update food entry fields
        if "name" in data:
            food_entry.name = data["name"]
        if "category" in data:
            food_entry.category = data["category"]
        if "servingSize" in data:
            food_entry.servingSize = data["servingSize"]
        if "caloriesPerServing" in data:
            food_entry.caloriesPerServing = data["caloriesPerServing"]
        if "proteinContent" in data:
            food_entry.proteinContent = data["proteinContent"]
        if "fatContent" in data:
            food_entry.fatContent = data["fatContent"]
        if "carbohydrateContent" in data:
            food_entry.carbohydrateContent = data["carbohydrateContent"]
        if "dietaryOptions" in data:
            food_entry.dietaryOptions = data["dietaryOptions"]
        if "imageUrl" in data:
            food_entry.imageUrl = data["imageUrl"]

        # Update micronutrients
        if "micronutrients" in data:
            micronutrients_data = data["micronutrients"]
            for nutrient_name, value in micronutrients_data.items():
                # Get or create the micronutrient
                micronutrient, _ = Micronutrient.objects.get_or_create(
                    name=nutrient_name,
                    defaults={"unit": "g"}  # Default unit, can be adjusted
                )
                # Update or create the link
                FoodEntryMicronutrient.objects.update_or_create(
                    food_entry=food_entry,
                    micronutrient=micronutrient,
                    defaults={"value": value}
                )

        food_entry.save()

        # Refresh proposal from database
        proposal.refresh_from_db()

        # Return updated proposal
        response_serializer = FoodProposalModerationSerializer(proposal)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


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

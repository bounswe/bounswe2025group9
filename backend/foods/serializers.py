from urllib.parse import quote

from rest_framework import serializers

from foods.constants import DEFAULT_CURRENCY, PriceCategory, PriceUnit
from foods.models import (
    FoodEntry,
    FoodProposal,
    PriceAudit,
    PriceCategoryThreshold,
    PriceReport,
)


# Serializer for FoodEntry model
class FoodEntrySerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = FoodEntry
        fields = "__all__"
        read_only_fields = (
            "price_category",
            "category_overridden_by",
            "category_overridden_at",
            "category_override_reason",
        )

    def get_imageUrl(self, obj):
        """
        Transform external image URLs to use the caching proxy.
        Local URLs are returned as-is.
        """
        if not obj.imageUrl:
            return ""

        # Skip proxy for local media URLs
        if obj.imageUrl.startswith("/media/"):
            return obj.imageUrl

        # Skip proxy for localhost/127.0.0.1
        if "localhost" in obj.imageUrl or "127.0.0.1" in obj.imageUrl:
            return obj.imageUrl

        # Use proxy for external URLs
        # Always return relative URLs - the browser will resolve them against
        # the current page origin (e.g., http://localhost:8080)
        # This fixes issues in Docker where build_absolute_uri() creates URLs
        # without the correct port (http://localhost instead of http://localhost:8080)
        encoded_url = quote(obj.imageUrl, safe="")
        return f"/api/foods/image-proxy/?url={encoded_url}"


class FoodProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodProposal
        fields = "__all__"
        read_only_fields = ("proposedBy", "nutritionScore", "is_private")


class FoodPriceUpdateSerializer(serializers.Serializer):
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    price_unit = serializers.ChoiceField(choices=PriceUnit.choices)
    currency = serializers.CharField(max_length=3, default=DEFAULT_CURRENCY)
    reason = serializers.CharField(required=False, allow_blank=True)
    override_category = serializers.ChoiceField(
        choices=PriceCategory.choices, required=False, allow_null=True
    )
    override_reason = serializers.CharField(required=False, allow_blank=True)
    clear_override = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        override = attrs.get("override_category")
        override_reason = attrs.get("override_reason")
        clear_override = attrs.get("clear_override")

        if override and not override_reason:
            raise serializers.ValidationError(
                {"override_reason": "A reason is required when overriding categories."}
            )
        if override and clear_override:
            raise serializers.ValidationError(
                "You cannot override and clear the override at the same time."
            )
        return attrs


class PriceCategoryThresholdSerializer(serializers.ModelSerializer):
    price_unit_display = serializers.SerializerMethodField()

    class Meta:
        model = PriceCategoryThreshold
        fields = [
            "id",
            "price_unit",
            "price_unit_display",
            "currency",
            "lower_threshold",
            "upper_threshold",
            "updates_since_recalculation",
            "last_recalculated_at",
        ]

    def get_price_unit_display(self, obj):
        return obj.get_price_unit_display()


class PriceThresholdRecalculateSerializer(serializers.Serializer):
    price_unit = serializers.ChoiceField(choices=PriceUnit.choices)
    currency = serializers.CharField(max_length=3, default=DEFAULT_CURRENCY)


class PriceAuditSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="food.name", read_only=True)
    changed_by_username = serializers.CharField(
        source="changed_by.username", read_only=True
    )

    class Meta:
        model = PriceAudit
        fields = [
            "id",
            "food",
            "food_name",
            "price_unit",
            "currency",
            "old_base_price",
            "new_base_price",
            "old_price_category",
            "new_price_category",
            "change_type",
            "changed_by",
            "changed_by_username",
            "reason",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class PriceReportSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="food.name", read_only=True)
    reported_by_username = serializers.CharField(
        source="reported_by.username", read_only=True
    )
    resolved_by_username = serializers.CharField(
        source="resolved_by.username", read_only=True
    )

    class Meta:
        model = PriceReport
        fields = [
            "id",
            "food",
            "food_name",
            "reported_by",
            "reported_by_username",
            "description",
            "status",
            "resolution_notes",
            "resolved_by",
            "resolved_by_username",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "reported_by",
            "reported_by_username",
            "resolved_by_username",
            "resolved_at",
            "created_at",
            "updated_at",
        )


class PriceReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceReport
        fields = ["food", "description"]


class PriceReportUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceReport
        fields = ["status", "resolution_notes"]

    def validate(self, attrs):
        status = attrs.get("status")
        notes = attrs.get("resolution_notes")
        if status == PriceReport.Status.RESOLVED and not notes:
            raise serializers.ValidationError(
                {"resolution_notes": "Resolution notes are required when resolving"}
            )
        return attrs

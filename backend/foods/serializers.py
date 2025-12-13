from urllib.parse import quote

from rest_framework import serializers

from api.db_initialization.nutrition_score import calculate_nutrition_score
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
    micronutrients = serializers.SerializerMethodField()

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

    def get_micronutrients(self, obj):
        return {
            link.micronutrient.name: {
                'value': round(link.value,2),
                'unit': link.micronutrient.unit
            }
            for link in obj.micronutrient_values.all()
        }


class FoodProposalSerializer(serializers.ModelSerializer):
    food_entry_id = serializers.PrimaryKeyRelatedField(
        queryset=FoodEntry.objects.all(),
        source="food_entry",
        write_only=True,
        required=False,
    )

    # Flat FoodEntry fields (optional)
    name = serializers.CharField(source="food_entry.name", required=False)
    category = serializers.CharField(source="food_entry.category", required=False)
    servingSize = serializers.FloatField(source="food_entry.servingSize", required=False)
    caloriesPerServing = serializers.FloatField(
        source="food_entry.caloriesPerServing", required=False
    )
    proteinContent = serializers.FloatField(
        source="food_entry.proteinContent", required=False
    )
    fatContent = serializers.FloatField(
        source="food_entry.fatContent", required=False
    )
    carbohydrateContent = serializers.FloatField(
        source="food_entry.carbohydrateContent", required=False
    )
    dietaryOptions = serializers.ListField(
        child=serializers.CharField(),
        source="food_entry.dietaryOptions",
        required=False,
    )
    nutritionScore = serializers.FloatField(
        source="food_entry.nutritionScore", required=False
    )

    class Meta:
        model = FoodProposal
        fields = [
            "id",
            "food_entry_id",
            "name",
            "category",
            "servingSize",
            "caloriesPerServing",
            "proteinContent",
            "fatContent",
            "carbohydrateContent",
            "dietaryOptions",
            "nutritionScore",
            "isApproved",
            "createdAt",
            "proposedBy",
        ]
        read_only_fields = [
            "id",
            "isApproved",
            "createdAt",
            "proposedBy",
        ]

    def validate(self, attrs):
        data = self.initial_data

        # FK provided → accept, ignore flat fields
        if "food_entry_id" in data:
            return attrs

        # No FK → require enough flat data to build FoodEntry
        if "food_entry" not in attrs or not isinstance(attrs["food_entry"], dict):
            raise serializers.ValidationError(
                "food_entry_id is required when food entry fields are not provided."
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]

        food_entry = validated_data.get("food_entry")

        # FK path (wins)
        if isinstance(food_entry, FoodEntry):
            return FoodProposal.objects.create(
                food_entry=food_entry,
                proposedBy=request.user,
            )

        # Flat fields path
        food_entry_data = validated_data.pop("food_entry")

        food_entry_data['nutritionScore']= calculate_nutrition_score(food_entry_data)
        food_entry = FoodEntry.objects.create(
            **food_entry_data,
            validated=False,
            createdBy=request.user,
        )
        return FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=request.user,
        )

class FoodProposalStatusSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="food_entry.name", read_only=True)
    category = serializers.CharField(source="food_entry.category", read_only=True)
    servingSize = serializers.FloatField(source="food_entry.servingSize", read_only=True)
    imageUrl = serializers.URLField(source="food_entry.imageUrl", read_only=True)

    class Meta:
        model = FoodProposal
        fields = (
            "id",
            "name",
            "category",
            "servingSize",
            "imageUrl",
            "createdAt",
            "isApproved",
        )
        read_only_fields = fields
        
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

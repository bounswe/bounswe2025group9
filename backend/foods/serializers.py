import logging
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

logger = logging.getLogger(__name__)


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
    imageUrl = serializers.URLField(
        source="food_entry.imageUrl",
        required=False,
        allow_blank=True,
        help_text="Optional image URL. If not provided, an AI-generated image will be created."
    )

    micronutrients = serializers.SerializerMethodField()

    def get_micronutrients(self, obj):
        """
        Return micronutrients in frontend format: {"Vitamin C (mg)": 28.1}
        """
        if not obj.food_entry:
            return {}

        result = {}
        for link in obj.food_entry.micronutrient_values.all():
            # Combine name and unit into key: "Vitamin C (mg)"
            key = f"{link.micronutrient.name} ({link.micronutrient.unit})"
            result[key] = round(link.value, 2)
        return result

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
            "imageUrl",
            "micronutrients",
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

        # Handle micronutrients input (SerializerMethodField is read-only, so we manually process it)
        if "micronutrients" in data:
            attrs["food_entry"]["micronutrients"] = data["micronutrients"]

        return attrs

    def _trigger_background_image_generation(self, food_entry_id: int, food_name: str) -> None:
        """
        Trigger background AI image generation for the food entry.
        This is non-blocking - the image will be generated and saved asynchronously.
        """
        try:
            print(f"[Serializer] Triggering background image generation for: {food_name} (ID: {food_entry_id})")
            from foods.image_generation import generate_food_image_async, is_image_generation_enabled
            
            if not is_image_generation_enabled():
                print("[Serializer] AI image generation is NOT enabled (missing credentials)")
                logger.info("AI image generation is not configured, skipping")
                return
            
            print(f"[Serializer] Calling generate_food_image_async...")
            logger.info(f"Triggering background image generation for food proposal: {food_name} (ID: {food_entry_id})")
            generate_food_image_async(food_entry_id, food_name)
            print(f"[Serializer] Background generation triggered successfully")
            
        except Exception as e:
            print(f"[Serializer] ERROR: {e}")
            logger.error(f"Error triggering background image generation for {food_name}: {e}")

    def create(self, validated_data):
        from foods.models import Micronutrient, FoodEntryMicronutrient

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

        # Extract micronutrients data before creating FoodEntry
        micronutrients_data = food_entry_data.pop("micronutrients", {})

        food_entry_data['nutritionScore'] = calculate_nutrition_score(food_entry_data)

        # Check if we need to generate an image (no imageUrl provided)
        needs_image_generation = not food_entry_data.get('imageUrl')
        food_name = food_entry_data.get('name', '')

        # Create the FoodEntry first (without image if we need to generate one)
        food_entry = FoodEntry.objects.create(
            **food_entry_data,
            validated=False,
            createdBy=request.user,
        )

        # Create micronutrient relationships
        # micronutrients_data format: {"Vitamin C (mg)": 28.1, "Iron, Fe (mg)": 2.7}
        for micro_name_with_unit, value in micronutrients_data.items():
            # Parse micronutrient name and unit from format "Name (unit)"
            if "(" in micro_name_with_unit and ")" in micro_name_with_unit:
                name_part = micro_name_with_unit.split("(")[0].strip()
                unit_part = micro_name_with_unit.split("(")[1].split(")")[0].strip()
            else:
                name_part = micro_name_with_unit
                unit_part = "g"

            if value is not None:
                # Get or create the Micronutrient
                micronutrient, _ = Micronutrient.objects.get_or_create(
                    name=name_part,
                    defaults={'unit': unit_part}
                )

                # Create the relationship
                FoodEntryMicronutrient.objects.create(
                    food_entry=food_entry,
                    micronutrient=micronutrient,
                    value=float(value)
                )

        # Create the proposal
        proposal = FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=request.user,
        )
        
        # Trigger background image generation AFTER creating the entry
        # This allows the API to return immediately while image generates in background
        if needs_image_generation and food_name:
            self._trigger_background_image_generation(food_entry.id, food_name)

        return proposal

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

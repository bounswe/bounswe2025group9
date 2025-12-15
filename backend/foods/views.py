from django.shortcuts import render, get_object_or_404
from django.db.models.deletion import ProtectedError
from rest_framework.response import Response
from rest_framework.views import APIView
from foods.models import (
    FoodEntry,
    FoodProposal,
    ImageCache,
    PriceAudit,
    PriceCategoryThreshold,
    PriceReport,
    Micronutrient,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from foods.serializers import (
    FoodEntrySerializer,
    FoodProposalSerializer,
    FoodPriceUpdateSerializer,
    PriceCategoryThresholdSerializer,
    PriceAuditSerializer,
    PriceReportSerializer,
    PriceReportCreateSerializer,
    PriceReportUpdateSerializer,
    PriceThresholdRecalculateSerializer,
    FoodProposalStatusSerializer,
)
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework import status, generics
from django.db import transaction
from django.db.models import Q, F, Case, When, FloatField, Value, ExpressionWrapper, IntegerField, OuterRef, Subquery, Max
from django.db.models.functions import Cast, Length, Coalesce
import requests
import sys
import os
import traceback
from rest_framework.decorators import api_view, permission_classes
from django.http import HttpResponse, FileResponse, HttpResponseRedirect
from django.core.files.base import ContentFile
from django.utils.http import urlencode
import hashlib
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
import re

sys.path.append(
    os.path.join(os.path.dirname(__file__), "..", "api", "db_initialization")
)

from scraper import make_request, extract_food_info, get_fatsecret_image_url
from api.db_initialization.nutrition_score import calculate_nutrition_score
from foods.permissions import IsPriceModerator
from foods.services import (
    update_food_price,
    override_food_price_category,
    clear_food_price_override,
    recalculate_price_thresholds,
    FoodAccessService,
)

# Global thread pool for background image caching (max 5 concurrent downloads)
_image_cache_executor = ThreadPoolExecutor(
    max_workers=5, thread_name_prefix="image_cache"
)


class FoodCatalog(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = FoodEntrySerializer

    def get_queryset(self):
        # Get accessible foods for the current user (validated + their own private foods)
        user = self.request.user if self.request.user.is_authenticated else None
        queryset = FoodAccessService.get_accessible_foods(user=user)
        queryset = queryset.prefetch_related("micronutrient_values__micronutrient")

        # Get available categories from accessible foods
        available_categories = list(
            FoodAccessService.get_accessible_foods(user=user).values_list("category", flat=True).distinct()
        )
        available_categories_lc = [cat.lower() for cat in available_categories]

        self.warning = None  # Store warning for use in list()

        # --- Search term support ---
        search_term = self.request.query_params.get("search", "").strip()
        if search_term:
            # Filter by name containing the search term (case-insensitive)
            queryset = queryset.filter(Q(name__icontains=search_term))
            
            # Annotate with relevance score for ranking
            # 1 = exact match (highest priority)
            # 2 = starts with search term
            # 3 = contains search term (lowest priority)
            queryset = queryset.annotate(
                relevance=Case(
                    When(name__iexact=search_term, then=Value(1)),
                    When(name__istartswith=search_term, then=Value(2)),
                    default=Value(3),
                    output_field=IntegerField(),
                )
            )
            
            if queryset.count() == 0:
                self.warning = f'No records found for search term: "{search_term}"'

        # --- Category filtering ---
        categories_param = self.request.query_params.get("category", None)
        if categories_param is None:
            categories_param = self.request.query_params.get("categories", "")

        if categories_param == "":
            categories = available_categories
        else:
            requested_categories = [
                category.strip().lower()
                for category in categories_param.split(",")
                if category.strip()
            ]
            categories = [
                available_categories[i]
                for i, cat in enumerate(available_categories_lc)
                if cat in requested_categories
            ]
            invalid_categories = [
                cat
                for cat in requested_categories
                if cat not in available_categories_lc
            ]
            if invalid_categories:
                self.warning = f"Some categories are not available: {', '.join(invalid_categories)}"
            if not categories:
                self.empty = True
                return FoodEntry.objects.none()
        
        # Apply category filter
        queryset = queryset.filter(category__in=categories)

        # --- MICRONUTRIENT RANGE FILTERING (NEW) ---
        #
        # Query parameter: `micronutrient`
        #
        # Syntax (comma-separated list):
        #
        #     micronutrient=<name>:<low>-<high>,<name>:<low>-,<name>:-<high>,...
        #
        # Rules:
        #   • <name> is case-insensitive and matched with `icontains`
        #   • <low> and <high> are numeric (float); invalid values are ignored
        #   • Ranges support:
        #         low-high   → bounded range
        #         low-       → lower-bounded (>= low)
        #         -high      → upper-bounded (<= high)
        #   • Each item creates an AND constraint:
        #         iron:3-10,zinc:1-5  → must satisfy both
        #
        # Examples:
        #     micronutrient=iron:3-10
        #     micronutrient=vit c:20-
        #     micronutrient=-potassium:0.5
        #     micronutrient=iron:3-10,zinc:1-,vitamin c:-40
        #
        # Invalid components (e.g. missing numbers) are skipped.
        micronutrient_param = self.request.query_params.get("micronutrient", "")
        if micronutrient_param.strip():
            parts = [p.strip() for p in micronutrient_param.split(",") if p.strip()]

            for part in parts:
                if ":" not in part or "-" not in part:
                    continue

                name, rng = part.split(":", 1)
                low_str, high_str = rng.split("-", 1)

                name = name.strip()

                # Parse numbers only if they exist
                low = None
                high = None

                if low_str.strip():
                    try:
                        low = float(low_str)
                    except ValueError:
                        continue

                if high_str.strip():
                    try:
                        high = float(high_str)
                    except ValueError:
                        continue

                # Build filter that treats missing micronutrients as having value 0
                # This ensures foods without a micronutrient entry are included when appropriate

                # Base condition: has the micronutrient with matching name
                has_micronutrient = Q(micronutrient_values__micronutrient__name__icontains=name)

                # Build value range conditions
                value_conditions = Q()
                if low is not None:
                    value_conditions &= Q(micronutrient_values__value__gte=low)
                if high is not None:
                    value_conditions &= Q(micronutrient_values__value__lte=high)

                # Condition for foods that have the micronutrient within range
                has_nutrient_in_range = has_micronutrient & value_conditions

                # Condition for foods without this micronutrient (treated as 0)
                # Include them only if the range allows 0
                # Note: We can't use ~Q(...) on related fields because it checks if ANY related object
                # doesn't match, not if NO related objects match. Use a subquery instead.
                foods_with_nutrient = FoodEntry.objects.filter(
                    micronutrient_values__micronutrient__name__icontains=name
                ).values_list('id', flat=True)
                lacks_micronutrient = ~Q(id__in=foods_with_nutrient)

                # Determine if 0 falls within the specified range
                zero_in_range = True
                if low is not None and low > 0:
                    zero_in_range = False
                if high is not None and high < 0:
                    zero_in_range = False

                # Combine conditions
                if zero_in_range:
                    # Include foods with nutrient in range OR without the nutrient
                    filter_condition = has_nutrient_in_range | lacks_micronutrient
                else:
                    # Only include foods with nutrient in range
                    filter_condition = has_nutrient_in_range

                queryset = queryset.filter(filter_condition)

            # Use distinct() to avoid duplicate results from join
            queryset = queryset.distinct()

        # --- Sorting support ---
        # Support both separate parameters (sort_by + order) and combined format (sort_by="name-asc")
        sort_by = self.request.query_params.get("sort_by", "").strip()
        order = self.request.query_params.get("order", "").strip().lower()
        
        # Check if sort_by contains combined format (e.g., "name-asc", "price-desc")
        if "-" in sort_by and not order:
            parts = sort_by.split("-", 1)
            if len(parts) == 2:
                sort_by = parts[0].strip()
                order = parts[1].strip().lower()
        
        # If no order specified, default to desc
        if not order:
            order = "desc"
        
        # Normalize order value
        order = order.lower()
        if order not in ["asc", "desc"]:
            order = "desc"

        valid_sort_fields = {
            "nutritionscore": "nutritionScore",
            "nutrition-score": "nutritionScore",  # Alternative format for mobile
            "nutrition": "nutritionScore",  # Shorthand
            "carbohydratecontent": "carbohydrateContent",
            "carbohydrate": "carbohydrateContent",  # Shorthand
            "proteincontent": "proteinContent",
            "protein": "proteinContent",  # Shorthand
            "fatcontent": "fatContent",
            "fat": "fatContent",  # Shorthand
            "name": "name",
            "price": "base_price",  # Price sorting by base_price field
            "cost-nutrition-ratio": "cost_nutrition_ratio",  # Special calculated field
            "costnutritionratio": "cost_nutrition_ratio",  # Alternative format
        }

        sort_by_lower = sort_by.lower() if sort_by else ""
        
        # Handle cost-nutrition-ratio as a special calculated field
        if sort_by_lower in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by_lower]
            
            if sort_field == "cost_nutrition_ratio":
                # Calculate price / nutritionScore ratio
                # Handle None and zero cases properly
                # Use ExpressionWrapper for proper type handling
                queryset = queryset.annotate(
                    cost_nutrition_ratio=Case(
                        When(
                            base_price__isnull=False,
                            nutritionScore__gt=0,
                            then=ExpressionWrapper(
                                Cast(F('base_price'), FloatField()) / Cast(F('nutritionScore'), FloatField()),
                                output_field=FloatField()
                            )
                        ),
                        When(
                            base_price__isnull=False,
                            nutritionScore__lte=0,
                            then=Value(999999.0, output_field=FloatField())  # Use large number instead of inf
                        ),
                        default=Value(999999.0, output_field=FloatField()),  # Use large number instead of inf
                        output_field=FloatField()
                    )
                )
                sort_field = "cost_nutrition_ratio"
        
        # If search term is present, prioritize relevance in ordering
        if search_term:
            if sort_by_lower in valid_sort_fields:
                if order == "asc":
                    # Order by relevance first, then custom field, then name length
                    queryset = queryset.order_by("relevance", sort_field, Length("name"))
                else:
                    # Order by relevance first, then custom field desc, then name length
                    queryset = queryset.order_by("relevance", f"-{sort_field}", Length("name"))
            else:
                # Order by relevance first, then name length (shorter names first), then alphabetically
                queryset = queryset.order_by("relevance", Length("name"), "name")
        else:
            # No search term - use normal sorting
            if sort_by_lower in valid_sort_fields:
                if order == "asc":
                    queryset = queryset.order_by(sort_field)
                else:
                    queryset = queryset.order_by(f"-{sort_field}")
            else:
                # Default sort by id
                queryset = queryset.order_by("id")

        return queryset

    def list(self, request, *args, **kwargs):
        self.empty = False
        queryset = self.filter_queryset(self.get_queryset())
        search_term = request.query_params.get("search", "").strip()

        page = self.paginate_queryset(queryset)
        if hasattr(self, "empty") and self.empty:
            # No valid categories, return warning and empty results
            warning = getattr(self, "warning", None)
            if warning:
                return Response({"warning": warning, "results": [], "status": 206})
            return Response({"results": [], "status": 206})

        # If no results after filtering (including search), return 204 No Content
        if queryset.count() == 0:
            warning = getattr(self, "warning", None)
            if warning:
                return Response({"warning": warning, "results": [], "status": 204})
            return Response({"results": [], "status": 204})

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = self.get_paginated_response(serializer.data).data
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

        warning = getattr(self, "warning", None)
        if warning:
            # Add warning to paginated response
            if isinstance(data, dict):
                data["warning"] = warning
                data["status"] = 206
            else:
                data = {"warning": warning, "results": data, "status": 206}
            return Response(data)
        # Always add status to response
        if isinstance(data, dict):
            data["status"] = 200
        else:
            data = {"results": data, "status": 200}
        return Response(data)
    
    def post(self, request, *args, **kwargs):
        # Get accessible foods for the current user (validated + their own private foods)
        user = request.user if request.user.is_authenticated else None
        queryset = FoodAccessService.get_accessible_foods(user=user)

        # Get available categories from accessible foods
        available_categories = list(
            FoodAccessService.get_accessible_foods(user=user).values_list("category", flat=True).distinct()
        )
        available_categories_lc = [cat.lower() for cat in available_categories]

        self.warning = None
        self.empty = False

        # ==========================
        # 🔍 Search Filtering (POST)
        # ==========================
        search_term = request.data.get("search", "").strip()
        if search_term:
            queryset = queryset.filter(Q(name__icontains=search_term))
            queryset = queryset.annotate(
                relevance=Case(
                    When(name__iexact=search_term, then=Value(1)),
                    When(name__istartswith=search_term, then=Value(2)),
                    default=Value(3),
                    output_field=IntegerField(),
                )
            )
            if queryset.count() == 0:
                self.warning = f'No records found for search term: "{search_term}"'

        # ==========================
        # 🧂 Category Filtering (POST)
        # ==========================
        categories_param = request.data.get("category", None)
        if categories_param is None:
            categories_param = request.data.get("categories", "")

        if categories_param == "":
            categories = available_categories
        else:
            requested_categories = [
                cat.strip().lower()
                for cat in categories_param.split(",")
                if cat.strip()
            ]
            categories = [
                available_categories[i]
                for i, cat in enumerate(available_categories_lc)
                if cat in requested_categories
            ]
            invalid_categories = [
                cat for cat in requested_categories
                if cat not in available_categories_lc
            ]
            if invalid_categories:
                self.warning = f"Some categories are not available: {', '.join(invalid_categories)}"

            if not categories:
                self.empty = True
                return Response({"warning": self.warning, "results": [], "status": 206})

        queryset = queryset.filter(category__in=categories)

        # ==========================
        # 🔽 Sorting / Ordering (POST)
        # ==========================
        sort_by = request.data.get("sort_by", "").strip()
        order = request.data.get("order", "").strip().lower()

        # Combined format: "name-asc"
        if "-" in sort_by and not order:
            parts = sort_by.split("-", 1)
            if len(parts) == 2:
                sort_by = parts[0].strip()
                order = parts[1].strip().lower()

        if not order:
            order = "desc"
        if order not in ["asc", "desc"]:
            order = "desc"

        valid_sort_fields = {
            "nutritionscore": "nutritionScore",
            "nutrition-score": "nutritionScore",
            "nutrition": "nutritionScore",
            "carbohydratecontent": "carbohydrateContent",
            "carbohydrate": "carbohydrateContent",
            "proteincontent": "proteinContent",
            "protein": "proteinContent",
            "fatcontent": "fatContent",
            "fat": "fatContent",
            "name": "name",
            "price": "base_price",
            "cost-nutrition-ratio": "cost_nutrition_ratio",
            "costnutritionratio": "cost_nutrition_ratio",
        }

        sort_by_lower = sort_by.lower() if sort_by else ""

        if sort_by_lower in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by_lower]

            if sort_field == "cost_nutrition_ratio":
                queryset = queryset.annotate(
                    cost_nutrition_ratio=Case(
                        When(
                            base_price__isnull=False,
                            nutritionScore__gt=0,
                            then=ExpressionWrapper(
                                Cast(F("base_price"), FloatField())
                                / Cast(F("nutritionScore"), FloatField()),
                                output_field=FloatField(),
                            ),
                        ),
                        When(
                            base_price__isnull=False,
                            nutritionScore__lte=0,
                            then=Value(999999.0, output_field=FloatField()),
                        ),
                        default=Value(999999.0, output_field=FloatField()),
                        output_field=FloatField(),
                    )
                )
                sort_field = "cost_nutrition_ratio"
        else:
            sort_field = None

        # Apply ordering (before micronutrient filtering so ordering is preserved)
        if search_term:
            if sort_field:
                if order == "asc":
                    queryset = queryset.order_by("relevance", sort_field, Length("name"))
                else:
                    queryset = queryset.order_by("relevance", f"-{sort_field}", Length("name"))
            else:
                queryset = queryset.order_by("relevance", Length("name"), "name")
        else:
            if sort_field:
                queryset = queryset.order_by(sort_field if order == "asc" else f"-{sort_field}")
            else:
                queryset = queryset.order_by("id")

        # ==========================
        # 🧪 Micronutrient Filtering (Python)
        # ==========================
        micronutrient_filters = request.data.get("micronutrients", [])

        if micronutrient_filters:
            objs = list(queryset)  # evaluate queryset once

            def match_micronutrients(obj):
                micro = getattr(obj, "micronutrients", {}) or {}
                # micro is something like:
                # {"Water (g)": 8.2, "Vitamin C, total ascorbic acid (mg)": 7.2, ...}

                for mf in micronutrient_filters:
                    name = (mf.get("Micronutrient") or "").strip()
                    if not name:
                        continue

                    max_val = mf.get("MaxValue") or []
                    min_val = mf.get("MinValue") or []
                    per_grams = mf.get("PerHowmanyGrams") or "100 gr"

                    # Parse "150 gr" → 150.0 (default 100.0)
                    try:
                        grams = float(re.findall(r"\d+\.?\d*", str(per_grams))[0])
                    except (IndexError, ValueError):
                        grams = 100.0

                    # Parse numeric bounds
                    max_num = None
                    if max_val:
                        try:
                            max_num = float(max_val[0])
                        except (TypeError, ValueError):
                            pass

                    min_num = None
                    if min_val:
                        try:
                            min_num = float(min_val[0])
                        except (TypeError, ValueError):
                            pass

                    # Find matching key in JSON (case-insensitive substring)
                    key_match = None
                    name_lc = name.lower()
                    for k in micro.keys():
                        try:
                            if name_lc in k.lower():
                                key_match = k
                                break
                        except AttributeError:
                            continue

                    # If the requested micronutrient is not present, fail this food
                    if key_match is None:
                        return False

                    # DB values are per 100 g
                    try:
                        base_val = float(micro[key_match])
                    except (TypeError, ValueError):
                        return False

                    # Scale from per 100g to per requested grams
                    scaled = base_val * (grams / 100.0)

                    if max_num is not None and scaled > max_num:
                        return False
                    if min_num is not None and scaled < min_num:
                        return False

                # All micronutrient filters passed
                return True

            filtered_objs = [obj for obj in objs if match_micronutrients(obj)]
            queryset = filtered_objs  # now a list, not a QuerySet

        # ==========================
        # 📤 Response Handling
        # ==========================
        if isinstance(queryset, list):
            total_count = len(queryset)
        else:
            total_count = queryset.count()

        if total_count == 0:
            warning = getattr(self, "warning", None)
            if warning:
                return Response({"warning": warning, "results": [], "status": 204})
            return Response({"results": [], "status": 204})

        # Pagination works on lists too
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = self.get_paginated_response(serializer.data).data
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

        warning = getattr(self, "warning", None)
        if warning:
            if isinstance(data, dict):
                data["warning"] = warning
                data["status"] = 206
            else:
                data = {"warning": warning, "results": data, "status": 206}
            return Response(data)

        if isinstance(data, dict):
            data["status"] = 200
        else:
            data = {"results": data, "status": 200}
        return Response(data)


class PrivateFoodView(APIView):
    """
    CRUD for user's private foods.

    - LIST   /api/foods/private/
    - CREATE /api/foods/private/
    - GET    /api/foods/private/<id>/
    - UPDATE /api/foods/private/<id>/
    - DELETE /api/foods/private/<id>/
    """

    permission_classes = [IsAuthenticated]

    # ------------------------
    # GET (LIST / RETRIEVE)
    # ------------------------
    def get(self, request, pk=None):
        user = request.user

        if pk:
            food = get_object_or_404(
                FoodEntry.objects.prefetch_related("micronutrient_values__micronutrient"),
                id=pk,
                createdBy=user,
                validated=False,
            )
            serializer = FoodEntrySerializer(food, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        foods = FoodEntry.objects.filter(
            createdBy=user,
            validated=False,
        ).prefetch_related("micronutrient_values__micronutrient")

        serializer = FoodEntrySerializer(
            foods, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ------------------------
    # POST (CREATE)
    # ------------------------
    def post(self, request):
        serializer = FoodEntrySerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save(
                createdBy=request.user,
                validated=False,  # 🔒 private by default
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ------------------------
    # PUT / PATCH (UPDATE)
    # ------------------------
    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial=False):
        food = get_object_or_404(
            FoodEntry,
            id=pk,
            createdBy=request.user,
            validated=False,
        )

        serializer = FoodEntrySerializer(
            food,
            data=request.data,
            partial=partial,
            context={'request': request},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ------------------------
    # DELETE
    # ------------------------
    def delete(self, request, pk):
        food = get_object_or_404(
            FoodEntry,
            id=pk,
            createdBy=request.user,
            validated=False,
        )
        try:
            food.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This food cannot be deleted because it is currently "
                        "used in your nutrition tracker or another record."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
    

class AvailableMicronutrientsView(APIView):
    """
    Returns a list of all available micronutrients that have at least one entry in accessible foods.
    Each micronutrient includes its name and unit.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Get accessible food IDs for the current user
        user = request.user if request.user.is_authenticated else None
        accessible_food_ids = FoodAccessService.get_accessible_foods(user=user).values_list('id', flat=True)

        # Get all micronutrients that have at least one entry in accessible foods
        micronutrients = Micronutrient.objects.filter(
            entries__food_entry_id__in=accessible_food_ids
        ).distinct().values('name', 'unit').order_by('name')

        return Response({
            'micronutrients': list(micronutrients),
            'count': len(micronutrients)
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class FoodProposalSubmitView(APIView):
    """
    Submit a private FoodEntry for approval/validation.

    POST /api/foods/proposals/submit/
    Body: {"food_entry_id": 123}

    The food_entry must be:
    - Created by the requesting user (createdBy=request.user)
    - Private (validated=False)
    - Not already proposed
    """
    def post(self, request):
        serializer = FoodProposalSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(proposedBy=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        proposals = FoodProposal.objects.filter(proposedBy=request.user).order_by('-createdAt')
        serializer = FoodProposalStatusSerializer(proposals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserFoodProposalListView(ListAPIView):
    """
    List all food proposals created by the authenticated user.
    This includes pending, approved, and rejected proposals.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FoodProposalSerializer

    def get_queryset(self):
        # Return all proposals by the user, ordered by creation date (newest first)
        return FoodProposal.objects.filter(proposedBy=self.request.user).select_related('food_entry').order_by('-createdAt')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

def _download_and_cache_image(image_url, url_hash):
    """
    Background task to download and cache an image.
    Runs in thread pool to avoid blocking the main request.
    """
    try:
        # Check if already cached (might have been cached by another task)
        if ImageCache.objects.filter(url_hash=url_hash).exists():
            return

        # Download the image
        img_response = requests.get(image_url, timeout=10, stream=True)
        img_response.raise_for_status()

        # Get content type
        content_type = img_response.headers.get("Content-Type", "image/jpeg")

        # Read image content
        image_content = b""
        for chunk in img_response.iter_content(chunk_size=8192):
            image_content += chunk

        # Determine file extension
        ext_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }
        ext = ext_map.get(content_type, ".jpg")

        # Create unique filename using hash
        filename = f"{url_hash}{ext}"

        # Save to cache
        cache_entry = ImageCache.objects.create(
            url_hash=url_hash,
            original_url=image_url,
            content_type=content_type,
            file_size=len(image_content),
            access_count=0,
        )
        cache_entry.cached_file.save(filename, ContentFile(image_content))

        print(f"Successfully cached image: {image_url[:50]}...")

    except Exception as e:
        print(f"Failed to cache image {image_url[:50]}...: {str(e)}")


@api_view(["GET"])
@permission_classes([AllowAny])
def image_proxy(request):
    """
    GET /api/foods/image-proxy/?url={external_url}
    Proxies external food images with local caching for improved performance.
    - If image is cached: serves from local storage
    - If not cached: redirects to original URL and submits caching task to thread pool
    """
    image_url = request.query_params.get("url")

    if not image_url:
        return Response(
            {"error": "url parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Decode URL if it's encoded
    image_url = unquote(image_url)

    # Skip caching for local URLs (already served locally)
    if (
        image_url.startswith("/media/")
        or "localhost" in image_url
        or "127.0.0.1" in image_url
    ):
        return HttpResponseRedirect(image_url)

    # Compute hash of URL for uniqueness
    url_hash = hashlib.sha256(image_url.encode("utf-8")).hexdigest()

    try:
        # Check if image is already cached using hash
        cache_entry = ImageCache.objects.filter(url_hash=url_hash).first()

        if cache_entry and cache_entry.cached_file:
            # Update access statistics
            cache_entry.access_count += 1
            cache_entry.save(update_fields=["access_count", "last_accessed"])

            # Serve cached image
            response = FileResponse(
                cache_entry.cached_file.open("rb"),
                content_type=cache_entry.content_type,
            )
            response["Cache-Control"] = "public, max-age=86400"  # Cache for 24 hours
            return response

        # Image not cached - submit caching task to thread pool and redirect immediately
        _image_cache_executor.submit(_download_and_cache_image, image_url, url_hash)

        # Redirect to original URL for immediate response
        return HttpResponseRedirect(image_url)

    except Exception as e:
        # Any error, redirect to original URL as fallback
        print(f"Error in image proxy for {image_url}: {str(e)}")
        traceback.print_exc()
        return HttpResponseRedirect(image_url)


class FoodPriceUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsPriceModerator]

    def post(self, request, pk):
        entry = get_object_or_404(FoodEntry, pk=pk)
        serializer = FoodPriceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        entry = update_food_price(
            entry,
            base_price=data["base_price"],
            price_unit=data["price_unit"],
            currency=data["currency"],
            changed_by=request.user,
            reason=data.get("reason", ""),
        )

        override_category = data.get("override_category")
        if override_category:
            entry = override_food_price_category(
                entry,
                category=override_category,
                changed_by=request.user,
                reason=data["override_reason"],
            )
        elif data.get("clear_override"):
            entry = clear_food_price_override(entry, changed_by=request.user)

        response_data = FoodEntrySerializer(
            entry, context={"request": request}
        ).data
        return Response(response_data, status=status.HTTP_200_OK)


class PriceThresholdListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsPriceModerator]
    serializer_class = PriceCategoryThresholdSerializer
    queryset = PriceCategoryThreshold.objects.all().order_by("price_unit")

    def get_queryset(self):
        qs = super().get_queryset()
        currency = self.request.query_params.get("currency")
        if currency:
            qs = qs.filter(currency__iexact=currency)
        return qs


class PriceThresholdRecalculateView(APIView):
    permission_classes = [IsAuthenticated, IsPriceModerator]

    def post(self, request):
        serializer = PriceThresholdRecalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        threshold = recalculate_price_thresholds(
            data["price_unit"],
            currency=data["currency"],
            changed_by=request.user,
            reason="Manual recalculation",
        )
        response = PriceCategoryThresholdSerializer(threshold).data
        return Response(response, status=status.HTTP_200_OK)


class PriceAuditListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsPriceModerator]
    serializer_class = PriceAuditSerializer
    queryset = PriceAudit.objects.select_related("food", "changed_by").all()

    def get_queryset(self):
        qs = super().get_queryset()
        food_id = self.request.query_params.get("food")
        change_type = self.request.query_params.get("change_type")
        price_unit = self.request.query_params.get("price_unit")
        if food_id:
            qs = qs.filter(food_id=food_id)
        if change_type:
            qs = qs.filter(change_type=change_type)
        if price_unit:
            qs = qs.filter(price_unit=price_unit)
        return qs


class PriceReportListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = PriceReport.objects.select_related(
        "food", "reported_by", "resolved_by"
    ).all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PriceReportCreateSerializer
        return PriceReportSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        moderator = IsPriceModerator().has_permission(self.request, self)
        if not moderator:
            qs = qs.filter(reported_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


class PriceReportDetailView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = PriceReport.objects.select_related(
        "food", "reported_by", "resolved_by"
    ).all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return PriceReportUpdateSerializer
        return PriceReportSerializer

    def get_object(self):
        obj = super().get_object()
        moderator = IsPriceModerator().has_permission(self.request, self)
        if not moderator and obj.reported_by != self.request.user:
            raise PermissionDenied("You can only view your own reports.")
        return obj

    def perform_update(self, serializer):
        if not IsPriceModerator().has_permission(self.request, self):
            raise PermissionDenied("Only moderators can update reports.")
        status_value = serializer.validated_data.get("status")
        resolved_at = None
        if status_value == PriceReport.Status.RESOLVED:
            resolved_at = timezone.now()
        serializer.save(resolved_by=self.request.user, resolved_at=resolved_at)

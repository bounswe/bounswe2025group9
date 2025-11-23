from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from foods.models import (
    FoodEntry,
    FoodProposal,
    ImageCache,
    PriceAudit,
    PriceCategoryThreshold,
    PriceReport,
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
)
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework import status, generics
from django.db import transaction
from django.db.models import Q
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
)

# Global thread pool for background image caching (max 5 concurrent downloads)
_image_cache_executor = ThreadPoolExecutor(
    max_workers=5, thread_name_prefix="image_cache"
)


class FoodCatalog(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = FoodEntrySerializer

    def get_queryset(self):
        queryset = FoodEntry.objects.all()
        available_categories = list(
            FoodEntry.objects.values_list("category", flat=True).distinct()
        )
        available_categories_lc = [cat.lower() for cat in available_categories]

        self.warning = None  # Store warning for use in list()

        # --- Search term support ---
        search_term = self.request.query_params.get("search", "").strip()
        if search_term:
            # Filter by name or description containing the search term (case-insensitive)
            queryset = queryset.filter(Q(name__icontains=search_term))
            if queryset.count() == 0:
                self.warning = f'No records found for search term: "{search_term}"'

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
        # --- Sorting support ---
        sort_by = self.request.query_params.get("sort_by", "").strip()
        order = self.request.query_params.get("order", "desc").strip().lower()

        valid_sort_fields = {
            "nutritionscore": "nutritionScore",
            "carbohydratecontent": "carbohydrateContent",
            "proteincontent": "proteinContent",
            "fatcontent": "fatContent",
        }

        if sort_by.lower() in valid_sort_fields:
            sort_field = valid_sort_fields[sort_by.lower()]
            if order == "asc":
                queryset = queryset.filter(category__in=categories).order_by(sort_field)
            else:
                queryset = queryset.filter(category__in=categories).order_by(
                    f"-{sort_field}"
                )
        else:
            # Default sort by id
            queryset = queryset.filter(category__in=categories).order_by("id")

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


class GetOrFetchFoodEntry(APIView):
    def get(self, request):
        food_name = request.query_params.get("name")
        if not food_name:
            return Response(
                {"error": "Missing 'name' parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            food = FoodEntry.objects.get(name__iexact=food_name)
            serializer = FoodEntrySerializer(food)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except FoodEntry.DoesNotExist:
            pass

        try:
            search = make_request("foods.search", {"search_expression": food_name})
            foods = search.get("foods", {}).get("food", [])
            if not foods:
                return Response(
                    {"error": "Food not found in FatSecret API"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            food_id = foods[0]["food_id"]
            details = make_request("food.get", {"food_id": food_id})
            parsed = extract_food_info(details)

            if not parsed:
                return Response(
                    {"error": "Could not parse FatSecret response"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            image_url = get_fatsecret_image_url(details["food"]["food_url"])

            with transaction.atomic():
                food = FoodProposal.objects.create(
                    name=parsed["food_name"],
                    category="Unknown",
                    servingSize=parsed.get("serving_amount", 100.0),
                    caloriesPerServing=parsed.get("calories", 0.0),
                    proteinContent=parsed.get("protein", 0.0),
                    fatContent=parsed.get("fat", 0.0),
                    carbohydrateContent=parsed.get("carbohydrates", 0.0),
                    dietaryOptions=[],
                    nutritionScore=0.0,
                    imageUrl=image_url,
                    proposedBy=request.user,
                )

            serializer = FoodProposalSerializer(food)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# get food_name as parameter
# make api call to https://www.themealdb.com/api/json/v1/1/search.php?s={food_name}
# check if the response is not empty
# return meals/strMeal and
@api_view(["GET"])
@permission_classes([AllowAny])
def suggest_recipe(request):
    food_name = request.query_params.get("food_name", "")
    if not food_name:
        return Response({"error": "food_name parameter is required."}, status=400)

    url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={food_name}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        meals = data.get("meals")
        if not meals:
            return Response(
                {"warning": "No recipe found for the given food name.", "results": []},
                status=404,
            )
        meal = meals[0]
        return Response(
            {
                "Meal": meal.get("strMeal"),
                "Instructions": meal.get("strInstructions"),
            }
        )
    except requests.RequestException as e:
        return Response({"error": f"Failed to fetch recipe: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_random_meal(request):
    url = "https://www.themealdb.com/api/json/v1/1/random.php"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        meals = data.get("meals")
        if not meals:
            return Response(
                {"warning": "No random meal found.", "results": []},
                status=404,
            )
        meal = meals[0]
        return Response(
            {
                "id": meal.get("idMeal"),
                "name": meal.get("strMeal"),
                "category": meal.get("strCategory"),
                "area": meal.get("strArea"),
                "instructions": meal.get("strInstructions"),
                "image": meal.get("strMealThumb"),
                "tags": meal.get("strTags"),
                "youtube": meal.get("strYoutube"),
                "ingredients": [
                    {
                        "ingredient": meal.get(f"strIngredient{i}"),
                        "measure": meal.get(f"strMeasure{i}"),
                    }
                    for i in range(1, 21)
                    if meal.get(f"strIngredient{i}")
                ],
            }
        )
    except requests.RequestException as e:
        return Response(
            {"error": f"Failed to fetch random meal: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    except Exception as e:
        return Response(
            {"error": f"An unexpected error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@permission_classes([IsAuthenticated])
class FoodProposalSubmitView(APIView):
    def post(self, request):
        serializer = FoodProposalSerializer(data=request.data)
        if serializer.is_valid():
            nutrition_score = calculate_nutrition_score(serializer.validated_data)
            serializer.save(proposedBy=request.user, nutritionScore=nutrition_score)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserFoodProposalListView(ListAPIView):
    """
    List all food proposals created by the authenticated user.
    This includes pending, approved, and rejected (private) proposals.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FoodProposalSerializer
    
    def get_queryset(self):
        # Return all proposals by the user, ordered by creation date (newest first)
        return FoodProposal.objects.filter(proposedBy=self.request.user).order_by('-createdAt')


@api_view(["GET"])
def food_nutrition_info(request):
    """
    GET /food/nutrition-info/?name={food_name}
    Fetches nutrition facts for a food using the Open Food Facts API (free to use).
    Returns calories, protein, fat, carbs, etc. if available.
    """
    food_name = request.query_params.get("name")
    if not food_name:
        return Response(
            {"error": "name parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        api_url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            "search_terms": food_name,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": 1,
        }
        resp = requests.get(api_url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        products = data.get("products", [])
        if not products:
            return Response(
                {"warning": f"No nutrition info found for '{food_name}'."}, status=404
            )
        product = products[0]
        nutriments = product.get("nutriments", {})
        result = {
            "food": food_name,
            "calories": nutriments.get("energy-kcal_100g"),
            "protein": nutriments.get("proteins_100g"),
            "fat": nutriments.get("fat_100g"),
            "carbs": nutriments.get("carbohydrates_100g"),
            "fiber": nutriments.get("fiber_100g"),
        }
        return Response(result)
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch nutrition info: {str(e)}"}, status=500
        )


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

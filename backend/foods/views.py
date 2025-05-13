from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from foods.models import FoodEntry
from rest_framework.permissions import IsAuthenticated, AllowAny
from foods.serializers import FoodEntrySerializer, FoodProposalSerializer
from rest_framework.generics import ListAPIView
from rest_framework import status
from django.db.models import Q
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status


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
        return queryset.filter(category__in=categories).order_by("id")

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
            serializer.save(proposedBy=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

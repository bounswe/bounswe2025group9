from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from foods.models import FoodEntry
from rest_framework.permissions import IsAuthenticated, AllowAny
from foods.serializers import FoodEntrySerializer


class FoodCatalog(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        GET /foods/get_foods
        Fetch and return a list of food entries in the system.
        Query parameters:
        - limit: The maximum number of food entries to return. Default is 10.
        - categories: List of categories to filter the food entries. If not provided, all available categories are used.
        """
        limit = request.query_params.get("limit", 10)
        try:
            limit = int(limit)
        except ValueError:
            return Response(
                {"error": "Invalid limit parameter. Must be an integer."}, status=400
            )

        # FILTER BY CATEGORIES
        available_categories = list(
            FoodEntry.objects.values_list("category", flat=True).distinct()
        )
        available_categories = [cat.lower() for cat in available_categories]

        categories_param = request.query_params.get("categories", "")

        warning = None
        if categories_param == "":
            categories = available_categories
        else:
            requested_categories = [
                category.strip().lower()
                for category in categories_param.split(",")
                if category.strip()
            ]
            invalid_categories = [
                cat for cat in requested_categories if cat not in available_categories
            ]
            categories = [
                cat for cat in requested_categories if cat in available_categories
            ]
            if invalid_categories:
                warning = f"Some categories are not available: {', '.join(invalid_categories)}"

        print("final Categories:", categories)
        queryset = FoodEntry.objects.filter(category__in=categories)[:limit]
        serializer = FoodEntrySerializer(queryset, many=True)
        response_data = serializer.data
        if warning:
            # return 206 status code (Partial Content) with warning message
            return Response({"warning": warning, "results": response_data}, status=206)
        return Response(response_data, status=200)

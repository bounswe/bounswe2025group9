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
        The number of rows can be specified using the 'limit' query parameter.
        """
        limit = request.query_params.get(
            "limit", 10
        )  # Default to 10 rows if 'limit' is not provided
        try:
            limit = int(limit)
        except ValueError:
            return Response(
                {"error": "Invalid limit parameter. Must be an integer."}, status=400
            )

        objects = FoodEntry.objects.all()[:limit]
        serializer = FoodEntrySerializer(objects, many=True)
        return Response(serializer.data)

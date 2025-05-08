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
        GET /foods
        Fetch and return a list of the first 10 food entries in the system.
        """
        objects = FoodEntry.objects.all()[:10]
        serializer = FoodEntrySerializer(objects, many=True)
        return Response(serializer.data)

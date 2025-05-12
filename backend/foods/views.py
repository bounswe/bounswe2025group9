from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from foods.models import FoodEntry
from rest_framework.permissions import IsAuthenticated, AllowAny
from foods.serializers import FoodEntrySerializer, FoodProposalSerializer
from rest_framework.generics import ListAPIView
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

        categories_param = self.request.query_params.get("categories", None)
        if categories_param is None:
            categories_param = self.request.query_params.get("category", "")

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

        page = self.paginate_queryset(queryset)
        if hasattr(self, "empty") and self.empty:
            # No valid categories, return warning and empty results
            warning = getattr(self, "warning", None)
            if warning:
                return Response({"warning": warning, "results": []}, status=206)
            return Response({"results": []}, status=200)

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
            else:
                data = {"warning": warning, "results": data}
            return Response(data, status=206)
        return Response(data)


class FoodProposalSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FoodProposalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(proposedBy=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

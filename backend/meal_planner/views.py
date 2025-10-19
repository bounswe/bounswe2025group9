from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import MealPlan
from .serializers import MealPlanSerializer, MealPlanCreateSerializer


class MealPlanListCreateView(generics.ListCreateAPIView):
    """List user's meal plans or create a new one"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MealPlanCreateSerializer
        return MealPlanSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MealPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific meal plan"""
    permission_classes = [IsAuthenticated]
    serializer_class = MealPlanSerializer
    
    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MealPlanCreateSerializer
        return MealPlanSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_current_meal_plan(request, meal_plan_id):
    """Set a meal plan as the user's current meal plan"""
    try:
        meal_plan = get_object_or_404(
            MealPlan, 
            id=meal_plan_id, 
            user=request.user
        )
        
        # Deactivate other meal plans for this user
        MealPlan.objects.filter(user=request.user, is_active=True).update(is_active=False)
        
        # Set the selected meal plan as active and current
        meal_plan.is_active = True
        meal_plan.save()
        
        # Set as current meal plan in user model
        request.user.current_meal_plan = meal_plan
        request.user.save()
        
        return Response({
            'message': 'Meal plan set as current successfully',
            'meal_plan': MealPlanSerializer(meal_plan).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_meal_plan(request):
    """Get user's current meal plan"""
    if not request.user.current_meal_plan:
        return Response({
            'message': 'No current meal plan set'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = MealPlanSerializer(request.user.current_meal_plan)
    return Response(serializer.data, status=status.HTTP_200_OK)

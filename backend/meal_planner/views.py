from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta, date
from django.db.models import Avg, Count

from .models import MealPlan, DailyNutritionLog, FoodLogEntry, PlannedFoodEntry
from .serializers import (
    MealPlanSerializer, 
    MealPlanCreateSerializer,
    DailyNutritionLogSerializer,
    DailyNutritionLogListSerializer,
    FoodLogEntrySerializer,
    PlannedFoodEntrySerializer,
)


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


class DailyNutritionLogView(APIView):
    """
    GET /api/meal-planner/daily-log/?date=YYYY-MM-DD
    Get nutrition log for a specific date (defaults to today).
    Creates empty log if it doesn't exist.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get date from query params or default to today
        date_str = request.query_params.get('date')
        if date_str:
            try:
                log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            log_date = date.today()
        
        # Get or create daily log
        daily_log, created = DailyNutritionLog.objects.get_or_create(
            user=request.user,
            date=log_date
        )
        
        serializer = DailyNutritionLogSerializer(daily_log)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyNutritionHistoryView(generics.ListAPIView):
    """
    GET /api/meal-planner/daily-log/history/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    Get nutrition logs for a date range (max 90 days).
    Defaults: start_date = 7 days ago, end_date = today
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DailyNutritionLogListSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Parse dates from query params
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        
        # Default to last 7 days if not specified
        if not end_date_str:
            end_date = date.today()
        else:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                end_date = date.today()
        
        if not start_date_str:
            start_date = end_date - timedelta(days=7)
        else:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                start_date = end_date - timedelta(days=7)
        
        # Validate date range (max 90 days)
        if (end_date - start_date).days > 90:
            start_date = end_date - timedelta(days=90)
        
        return DailyNutritionLog.objects.filter(
            user=user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('-date')


class FoodLogEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing food log entries.
    
    POST /api/meal-planner/daily-log/entries/
    PUT /api/meal-planner/daily-log/entries/{id}/
    DELETE /api/meal-planner/daily-log/entries/{id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FoodLogEntrySerializer

    def get_queryset(self):
        # Only return entries for the authenticated user's logs
        return FoodLogEntry.objects.filter(daily_log__user=self.request.user)

    def create(self, request):
        """Create a new food log entry."""
        # Get or default the date
        entry_date_str = request.data.get('date')
        if entry_date_str:
            try:
                entry_date = datetime.strptime(entry_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            entry_date = date.today()
        
        # Get or create daily log for the date
        daily_log, _ = DailyNutritionLog.objects.get_or_create(
            user=request.user,
            date=entry_date
        )
        
        # Create the entry
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(daily_log=daily_log)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update an existing food log entry."""
        try:
            entry = self.get_queryset().get(pk=pk)
        except FoodLogEntry.DoesNotExist:
            return Response(
                {'error': 'Food log entry not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify ownership
        if entry.daily_log.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this entry.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Delete a food log entry."""
        try:
            entry = self.get_queryset().get(pk=pk)
        except FoodLogEntry.DoesNotExist:
            return Response(
                {'error': 'Food log entry not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify ownership
        if entry.daily_log.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this entry.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlannedFoodEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing planned food entries.
    
    POST /api/meal-planner/daily-log/planned/
    PUT /api/meal-planner/daily-log/planned/{id}/
    DELETE /api/meal-planner/daily-log/planned/{id}/
    POST /api/meal-planner/daily-log/planned/{id}/convert/ - Convert to actual log entry
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PlannedFoodEntrySerializer

    def get_queryset(self):
        # Only return planned entries for the authenticated user's logs
        return PlannedFoodEntry.objects.filter(daily_log__user=self.request.user)

    def create(self, request):
        """Create a new planned food entry."""
        # Get or default the date
        entry_date_str = request.data.get('date')
        if entry_date_str:
            try:
                entry_date = datetime.strptime(entry_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            entry_date = date.today()
        
        # Get or create daily log for the date
        daily_log, _ = DailyNutritionLog.objects.get_or_create(
            user=request.user,
            date=entry_date
        )
        
        # Create the planned entry
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(daily_log=daily_log)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update an existing planned food entry."""
        try:
            entry = self.get_queryset().get(pk=pk)
        except PlannedFoodEntry.DoesNotExist:
            return Response(
                {'error': 'Planned food entry not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify ownership
        if entry.daily_log.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this entry.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Delete a planned food entry."""
        try:
            entry = self.get_queryset().get(pk=pk)
        except PlannedFoodEntry.DoesNotExist:
            return Response(
                {'error': 'Planned food entry not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify ownership
        if entry.daily_log.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this entry.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_planned_to_log(request, pk):
    """
    Convert a planned food entry to an actual food log entry.
    POST /api/meal-planner/daily-log/planned/{id}/convert/
    """
    try:
        planned_entry = PlannedFoodEntry.objects.get(pk=pk, daily_log__user=request.user)
    except PlannedFoodEntry.DoesNotExist:
        return Response(
            {'error': 'Planned food entry not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Convert to log entry (this also deletes the planned entry)
    log_entry = planned_entry.convert_to_log_entry()
    
    serializer = FoodLogEntrySerializer(log_entry, context={'request': request})
    return Response({
        'message': 'Planned entry converted to log entry successfully.',
        'entry': serializer.data
    }, status=status.HTTP_201_CREATED)


class NutritionStatisticsView(APIView):
    """
    GET /api/meal-planner/nutrition-statistics/?period=week|month
    Get nutrition statistics for a period.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'week')
        
        # Determine date range
        end_date = date.today()
        if period == 'month':
            start_date = end_date - timedelta(days=30)
        else:  # default to week
            start_date = end_date - timedelta(days=7)
        
        # Get logs for the period
        logs = DailyNutritionLog.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Calculate statistics
        stats = logs.aggregate(
            avg_calories=Avg('total_calories'),
            avg_protein=Avg('total_protein'),
            avg_carbohydrates=Avg('total_carbohydrates'),
            avg_fat=Avg('total_fat'),
            days_logged=Count('id')
        )
        
        # Calculate streak (consecutive days logged)
        streak = 0
        check_date = end_date
        while True:
            if DailyNutritionLog.objects.filter(user=request.user, date=check_date).exists():
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        # Calculate adherence if user has targets
        adherence = None
        try:
            targets = request.user.nutrition_targets
            if stats['avg_calories']:
                adherence = {
                    'calories': round((stats['avg_calories'] / float(targets.calories)) * 100, 1),
                    'protein': round((stats['avg_protein'] / float(targets.protein)) * 100, 1) if stats['avg_protein'] else 0,
                    'carbohydrates': round((stats['avg_carbohydrates'] / float(targets.carbohydrates)) * 100, 1) if stats['avg_carbohydrates'] else 0,
                    'fat': round((stats['avg_fat'] / float(targets.fat)) * 100, 1) if stats['avg_fat'] else 0,
                }
        except:
            pass
        
        return Response({
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'statistics': {
                'avg_calories': round(stats['avg_calories'], 1) if stats['avg_calories'] else 0,
                'avg_protein': round(stats['avg_protein'], 1) if stats['avg_protein'] else 0,
                'avg_carbohydrates': round(stats['avg_carbohydrates'], 1) if stats['avg_carbohydrates'] else 0,
                'avg_fat': round(stats['avg_fat'], 1) if stats['avg_fat'] else 0,
                'days_logged': stats['days_logged'],
                'streak_days': streak,
                'adherence': adherence,
            }
        }, status=status.HTTP_200_OK)

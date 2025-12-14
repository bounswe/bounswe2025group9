import django_filters
from .models import Recipe


class RecipeFilter(django_filters.FilterSet):
    """Custom filter for Recipe model supporting cost and nutrition filtering"""
    
    min_cost = django_filters.NumberFilter(
        field_name='total_cost',
        lookup_expr='gte',
        label='Minimum cost'
    )
    max_cost = django_filters.NumberFilter(
        field_name='total_cost',
        lookup_expr='lte',
        label='Maximum cost'
    )
    min_nutrition_score = django_filters.NumberFilter(
        method='filter_min_nutrition_score',
        label='Minimum nutrition score'
    )
    
    class Meta:
        model = Recipe
        fields = []
    
    def filter_min_nutrition_score(self, queryset, name, value):
        """
        Filter recipes by minimum nutrition score.
        Since nutrition_score is a property, we need to filter in Python.
        """
        filtered_ids = []
        for recipe in queryset:
            if recipe.nutrition_score >= float(value):
                filtered_ids.append(recipe.id)
        return queryset.filter(id__in=filtered_ids)

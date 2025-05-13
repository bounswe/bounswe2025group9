from django.urls import path
from .views import FoodCatalog, FoodProposalSubmitView, suggest_recipe
urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
    path(
        "manual-proposal/",
        FoodProposalSubmitView.as_view(),
        name="submit_food_proposal",
    ),
    path("suggest_recipe/", suggest_recipe, name="suggest_recipe"),
]
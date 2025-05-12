from django.urls import path
from .views import FoodCatalog, FoodProposalSubmitView

urlpatterns = [
    path("", FoodCatalog.as_view(), name="get_foods"),
    path(
        "manual-proposal/",
        FoodProposalSubmitView.as_view(),
        name="submit_food_proposal",
    ),
]

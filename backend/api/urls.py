from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeView, WikidataEntityView, random_food_image, TranslationView
from .moderation_views import (
    FoodProposalModerationViewSet,
    UserTagModerationViewSet,
    ContentModerationViewSet,
    UserModerationViewSet,
    ModerationStatsView,
)

# Router for moderation endpoints
moderation_router = DefaultRouter()
moderation_router.register(r'food-proposals', FoodProposalModerationViewSet, basename='moderation-food-proposals')
moderation_router.register(r'user-tags', UserTagModerationViewSet, basename='moderation-user-tags')
moderation_router.register(r'content', ContentModerationViewSet, basename='moderation-content')
moderation_router.register(r'users', UserModerationViewSet, basename='moderation-users')

urlpatterns = [
    path("time", TimeView.as_view(), name="get-time"),
    path("translate/", TranslationView.as_view(), name="translate"),
    path(
        "wiki-data/<str:entity_id>",
        WikidataEntityView.as_view(),
        name="get-wikidata-entity",
    ),
    path("random-food-image/", random_food_image, name="random_food_image"),
    
    # Moderation endpoints
    path("moderation/", include(moderation_router.urls)),
    path("moderation/stats/", ModerationStatsView.as_view(), name="moderation-stats"),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, PostViewSet, TagViewSet, RecipeViewSet
from .admin import PostModerationViewSet, CommentModerationViewSet

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("tags", TagViewSet, basename="tag")
router.register("comments", CommentViewSet, basename="comment")
router.register("recipes", RecipeViewSet, basename="recipe")


moderation_router = DefaultRouter()
moderation_router.register(r"posts", PostModerationViewSet, basename="moderation-posts")
moderation_router.register(
    r"comments", CommentModerationViewSet, basename="moderation-comments"
)


urlpatterns = [
    path("", include(router.urls)),
    path("moderation/", include(moderation_router.urls), name="moderation"),
]

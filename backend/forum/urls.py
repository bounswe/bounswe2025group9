from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, PostViewSet, TagViewSet

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("tags", TagViewSet, basename="tag")
router.register("comments", CommentViewSet, basename="comment")
urlpatterns = [
    path("", include(router.urls)),
]

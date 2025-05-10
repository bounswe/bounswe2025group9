from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, TagViewSet

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("tags", TagViewSet, basename="tag")

urlpatterns = [
    path("", include(router.urls)),
]

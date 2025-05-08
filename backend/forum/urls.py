from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, health_check

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")

urlpatterns = [
    path("", health_check),
    path("", include(router.urls)),
]

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path

from .views import (
    UserListView,
    CreateUserView,
    ChangePasswordView,
    LogoutView,
    UserProfileView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("create/", CreateUserView.as_view(), name="create-user"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/logout/", LogoutView.as_view(), name="token_logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
]

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path


from .views import (
    UserListView,
    CreateUserView,
    UpdateUserView,
    ChangePasswordView,
    LogoutView,
    UserProfileView,
    PublicUserProfileView,
    AllergenAddView,
    AllergenSetView,
    GetCommonAllergensView,
    ProfileImageView,
    TagSetView,
    CertificateView,
    LikedPostsView,
    LikedRecipesView,
    ServeProfileImageView,
    ServeCertificateView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("create/", CreateUserView.as_view(), name="create-user"),
    path("update/", UpdateUserView.as_view(), name="update-user"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/logout/", LogoutView.as_view(), name="token_logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path(
        "@<str:username>/", PublicUserProfileView.as_view(), name="public-user-profile"
    ),
    path("profile/liked-posts/", LikedPostsView.as_view(), name="liked-posts"),
    path("profile/liked-recipes/", LikedRecipesView.as_view(), name="liked-recipes"),
    path("allergen/set/", AllergenSetView.as_view(), name="set-allergens"),
    path("tag/set/", TagSetView.as_view(), name="set-tags"),
    path("allergen/add/", AllergenAddView.as_view(), name="add-allergen"),
    path(
        "allergen/common-list/", GetCommonAllergensView.as_view(), name="list-allergens"
    ),
    path("image/", ProfileImageView.as_view(), name="image"),
    path("certificate/", CertificateView.as_view(), name="certificate"),
    # Secure file serving endpoints
    path(
        "profile-image/<uuid:token>/",
        ServeProfileImageView.as_view(),
        name="serve-profile-image",
    ),
    path(
        "certificate/<uuid:token>/",
        ServeCertificateView.as_view(),
        name="serve-certificate",
    ),
]

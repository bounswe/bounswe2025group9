from django.urls import path
from .views import get_users, create_user_view

urlpatterns = [
    path("", get_users),
    path("create/", create_user_view),
]

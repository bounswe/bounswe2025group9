# api/urls.py - Update your existing file
from django.urls import path

from .views import get_time, get_users, create_user_view, login_view

urlpatterns = [
    path("time", get_time, name="get_time"),
    path("login", login_view, name="login"),
    path("users/", get_users),
    path("users/create/", create_user_view),
]


from django.urls import path
from .views import get_time, get_users, create_user_view

urlpatterns = [
    path("time", get_time, name="get_time"),
    path("users/", get_users),
    path("users/create/", create_user_view),
]

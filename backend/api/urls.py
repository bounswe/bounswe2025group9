from django.urls import path
from .views import get_time, signup_view

urlpatterns = [
    path("time", get_time, name="get_time"),
    path("signup", signup_view, name="signup"),
]

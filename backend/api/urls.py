from django.urls import path
from .views import get_time

urlpatterns = [
    path('time', get_time, name='get_time'),
]

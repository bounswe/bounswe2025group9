from django.urls import path
from .views import TimeView

urlpatterns = [
    path("time", TimeView.as_view(), name="get-time"),
]

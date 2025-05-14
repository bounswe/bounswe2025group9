from django.urls import path
from .views import TimeView
from .views import TranslationView

urlpatterns = [
    path("time", TimeView.as_view(), name="get-time"),
    path('translate', TranslationView.as_view(), name='translate'),
]

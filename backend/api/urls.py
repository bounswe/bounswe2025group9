from django.urls import path
from .views import TimeView, WikidataEntityView

urlpatterns = [
    path("time", TimeView.as_view(), name="get-time"),
    path(
        "food/<str:entity_id>", WikidataEntityView.as_view(), name="get-wikidata-entity"
    ),
]

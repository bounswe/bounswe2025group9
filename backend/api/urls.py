from django.urls import path
from .views import TimeView, WikidataEntityView, random_food_image

urlpatterns = [
    path("time", TimeView.as_view(), name="get-time"),
    path(
        "wiki-data/<str:entity_id>",
        WikidataEntityView.as_view(),
        name="get-wikidata-entity",
    ),
    path("random-food-image/", random_food_image, name="random_food_image"),
]

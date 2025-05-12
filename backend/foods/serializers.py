from foods.models import FoodEntry
from rest_framework.serializers import ModelSerializer


# Serializer for FoodEntry model
class FoodEntrySerializer(ModelSerializer):
    class Meta:
        model = FoodEntry
        fields = "__all__"

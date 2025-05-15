from foods.models import FoodEntry, FoodProposal
from rest_framework.serializers import ModelSerializer


# Serializer for FoodEntry model
class FoodEntrySerializer(ModelSerializer):
    class Meta:
        model = FoodEntry
        fields = "__all__"


class FoodProposalSerializer(ModelSerializer):
    class Meta:
        model = FoodProposal
        fields = "__all__"
        read_only_fields = ("proposedBy", "nutritionScore")

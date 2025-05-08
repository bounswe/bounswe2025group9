from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Post
        fields = ["id", "title", "body", "author", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

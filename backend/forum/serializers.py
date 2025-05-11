from rest_framework import serializers
from .models import Post, Tag, Comment


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, source="tags"
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "author",
            "tags",
            "tag_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "tags", "created_at", "updated_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "body", "created_at"]
        read_only_fields = ["id", "author", "created_at"]

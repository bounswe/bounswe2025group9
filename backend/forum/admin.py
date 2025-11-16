from django.contrib import admin
from rest_framework import viewsets, status, serializers
from rest_framework.permissions import BasePermission
from .models import Post, Tag, Comment, Like


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "like_count", "created_at")
    list_filter = ("created_at", "tags")
    search_fields = ("title", "body", "author__username")
    filter_horizontal = ("tags",)

    def like_count(self, obj):
        return obj.likes.count()

    # weird but Django admin uses short_description as the column header
    like_count.short_description = "Likes"  # type:ignore


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "created_at")
    search_fields = ("body", "author__username", "post__title")
    list_filter = ("created_at",)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "post__title")


class IsAdminUser(BasePermission):
    """
    Permission class that allows only staff members and superusers to access.
    Used for all moderation endpoints to ensure only authorized users can
    perform moderation actions.
    """

    def has_permission(self, request, view):  # type: ignore
        """
        Check if user is authenticated and is either staff or superuser.
        """
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class PostModerationSerializer(serializers.ModelSerializer):
    """Serializer for listing posts in moderation panel."""

    author = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")
    likesCount = serializers.SerializerMethodField()
    commentsCount = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "author",
            "createdAt",
            "likesCount",
            "commentsCount",
            "tags",
        ]

    def get_author(self, obj):
        return {"id": obj.author.id, "username": obj.author.username}

    def get_likesCount(self, obj):
        return obj.likes.count()

    def get_commentsCount(self, obj):
        return obj.comments.count()

    def get_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]


class CommentModerationSerializer(serializers.ModelSerializer):
    """Serializer for listing comments in moderation panel."""

    author = serializers.SerializerMethodField()
    post = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = Comment
        fields = ["id", "body", "author", "post", "createdAt"]

    def get_author(self, obj):
        return {"id": obj.author.id, "username": obj.author.username}

    def get_post(self, obj):
        return {"id": obj.post.id, "title": obj.post.title}


class PostModerationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for post moderation.
    Allows admins to list and delete posts.
    """

    queryset = (
        Post.objects.all()
        .select_related("author")
        .prefetch_related("tags", "likes", "comments")
    )
    serializer_class = PostModerationSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "delete"]  # Only allow GET and DELETE

    def get_queryset(self):
        """Order posts by creation date."""
        return super().get_queryset().order_by("-created_at")

    def destroy(self, request, *args, **kwargs):
        """Delete a post."""
        instance = self.get_object()
        post_title = instance.title
        self.perform_destroy(instance)
        return Response(
            {"message": f"Post '{post_title}' deleted successfully."},
            status=status.HTTP_200_OK,
        )


class CommentModerationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for comment moderation.
    Allows admins to list and delete comments.
    """

    queryset = Comment.objects.all().select_related("author", "post")
    serializer_class = CommentModerationSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "delete"]  # Only allow GET and DELETE

    def get_queryset(self):
        """Order comments by creation date."""
        return super().get_queryset().order_by("-created_at")

    def destroy(self, request, *args, **kwargs):
        """Delete a comment."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Comment deleted successfully."}, status=status.HTTP_200_OK
        )

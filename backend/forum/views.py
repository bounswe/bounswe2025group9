from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets, permissions, mixins
from rest_framework.filters import OrderingFilter
from rest_framework.decorators import action

from .models import Post, Tag, Comment, Like
from .serializers import PostSerializer, TagSerializer, CommentSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to everyone, but only allow object owner to edit or delete.
    """

    def has_object_permission(self, request, _, obj) -> bool:  # type:ignore
        # SAFE_METHODS = GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "author") and obj.author == request.user


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["tags", "author"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return Post.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(
        detail=True,
        methods=["post"],
        url_path="like",
        permission_classes=[permissions.IsAuthenticated],
    )
    def toggle_like(self, request, pk=None):
        post = self.get_object()
        user = request.user

        like, created = Like.objects.get_or_create(post=post, user=user)
        if not created:
            like.delete()
            return Response({"liked": False}, status=status.HTTP_200_OK)

        return Response({"liked": True}, status=status.HTTP_201_CREATED)


class TagViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TagSerializer
    permission_classes = []  # authentication is not a big deal for this

    def get_queryset(self):
        return Tag.objects.all().order_by("name")


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ["author"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        queryset = Comment.objects.all().order_by("created_at")
        post_id = self.request.query_params.get("post")
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

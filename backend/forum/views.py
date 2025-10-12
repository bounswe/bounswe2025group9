from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets, permissions, mixins
from rest_framework.filters import OrderingFilter
from rest_framework.decorators import action
from fuzzywuzzy import fuzz
import logging

from .models import Post, Tag, Comment, Like, Recipe, RecipeIngredient
from .serializers import (
    PostSerializer,
    TagSerializer,
    CommentSerializer,
    RecipeSerializer,
    RecipeIngredientSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to everyone, but only allow object owner to edit or delete.
    """

    def has_object_permission(self, request, _, obj) -> bool:  # type:ignore
        # SAFE_METHODS = GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(obj, "author") and obj.author == request.user


class IsPostOwnerOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to everyone, but only allow post owner to edit or delete.
    For models connected to posts like recipes.
    """

    def has_object_permission(self, request, _, obj) -> bool:  # type:ignore
        # SAFE_METHODS = GET, HEAD, OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.post.author == request.user


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
        detail=False,
        methods=["get"],
        url_path="search",
        permission_classes=[permissions.IsAuthenticated],
    )
    def search_posts(self, request):
        query = request.query_params.get("q", "").lower()
        if not query:
            return Response(
                {"error": "Query parameter 'q' is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all posts
        posts = self.get_queryset()

        # Apply fuzzy search on titles
        results = []
        for post in posts:
            # Calculate multiple similarity ratios
            title = post.title.lower()
            ratio = fuzz.ratio(query, title)
            partial_ratio = fuzz.partial_ratio(query, title)
            token_sort_ratio = fuzz.token_sort_ratio(query, title)

            # Use the highest ratio among different matching methods
            max_ratio = max(ratio, partial_ratio, token_sort_ratio)

            # Log the matching details for debugging
            logging.info(f"Post: {title}")
            logging.info(f"Query: {query}")
            logging.info(
                f"Ratios - Full: {ratio}, Partial: {partial_ratio}, Token Sort: {token_sort_ratio}"
            )
            logging.info(f"Max Ratio: {max_ratio}")

            # Only include posts with similarity ratio >= 60 (we may configure it to get the best results)
            if max_ratio >= 75:
                results.append(
                    {"post": PostSerializer(post).data, "similarity": max_ratio}
                )

        # Sort results by similarity score (highest first)
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return Response(
            {"results": [item["post"] for item in results], "count": len(results)}
        )

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


class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated, IsPostOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        queryset = Recipe.objects.all().order_by("-created_at")
        post_id = self.request.query_params.get("post")
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        return queryset

    def perform_create(self, serializer):
        # Ensure the post belongs to the current user
        post = serializer.validated_data.get("post")
        if post.author != self.request.user:
            raise permissions.PermissionDenied(
                "You can only add recipes to your own posts."
            )
        serializer.save()

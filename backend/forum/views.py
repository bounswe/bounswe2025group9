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
from .pagination import ForumPostPagination


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
    pagination_class = ForumPostPagination
    SIMILARITY_THRESHOLD = 75

    def get_queryset(self):
        queryset = Post.objects.all()
        
        # Apply ordering if specified in query params, otherwise default to -created_at
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("-created_at")
        
        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure pagination is properly applied.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If no pagination, return all results (should not happen with pagination_class set)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def _calculate_similarity(self, query: str, target: str) -> int:
        """
        Apply the same fuzzy matching logic to any text target.
        Returns the max similarity score derived from different ratio checks.
        """
        target_text = (target or "").lower()
        if not target_text:
            return 0

        ratio = fuzz.ratio(query, target_text)
        partial_ratio = fuzz.partial_ratio(query, target_text)
        token_sort_ratio = fuzz.token_sort_ratio(query, target_text)
        return max(ratio, partial_ratio, token_sort_ratio)

    def _best_ingredient_similarity(self, query: str, post: Post) -> int:
        """
        Iterate through the post's ingredients (if any) and return the
        best fuzzy similarity score among them.
        """
        recipe = getattr(post, "recipe", None)
        if not recipe:
            return 0

        best_score = 0
        for ingredient in recipe.ingredients.all():
            food_name = getattr(ingredient.food, "name", "") or ""
            best_score = max(best_score, self._calculate_similarity(query, food_name))
            if best_score == 100:
                break
        return best_score

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

        # Prefetch recipe data so ingredient lookup stays efficient
        posts = self.get_queryset().prefetch_related("recipe__ingredients__food")
        serializer_cls = self.get_serializer_class()
        serializer_context = self.get_serializer_context()

        # Apply fuzzy search on titles and ingredient names
        results = []
        for post in posts:
            title_similarity = self._calculate_similarity(query, post.title)
            ingredient_similarity = self._best_ingredient_similarity(query, post)

            max_ratio = max(title_similarity, ingredient_similarity)

            # Log the matching details for debugging
            logging.info(f"Post: {post.title.lower()}")
            logging.info(f"Query: {query}")
            logging.info(
                f"Title ratio: {title_similarity}, Ingredient ratio: {ingredient_similarity}"
            )
            logging.info(f"Max Ratio: {max_ratio}")

            if max_ratio >= self.SIMILARITY_THRESHOLD:
                serialized_post = serializer_cls(
                    post, context=serializer_context
                ).data
                results.append({"post": serialized_post, "similarity": max_ratio})

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
            return Response({"liked": False, "like_count": post.likes.count()}, status=status.HTTP_200_OK)

        return Response({"liked": True, "like_count": post.likes.count()}, status=status.HTTP_201_CREATED)


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        # Ensure the post belongs to the current user
        post = serializer.validated_data.get("post")
        if post.author != self.request.user:
            raise permissions.PermissionDenied(
                "You can only add recipes to your own posts."
            )
        serializer.save()

from django.contrib import admin
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

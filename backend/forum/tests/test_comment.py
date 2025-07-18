from typing import cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.views import Response
from forum.models import Post, Comment

User = get_user_model()


class CommentTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="alice", password="pass123", email="alice@example.com"
        )
        self.user2 = User.objects.create_user(
            username="bob", password="pass456", email="bob@example.com"
        )
        self.post = Post.objects.create(
            title="Test Post", body="Post content", author=self.user1
        )

        self.client = APIClient()

    def test_create_comment(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("comment-list")
        response = cast(
            Response,
            self.client.post(
                url,
                {"post": self.post.id, "body": "Nice post!"},
                format="json",
            ),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Comment.objects.count(), 1)
        comment = Comment.objects.first()
        self.assertEqual(comment.body, "Nice post!")
        self.assertEqual(comment.author, self.user1)

    def test_list_comments_for_post(self):
        Comment.objects.create(post=self.post, author=self.user1, body="First")
        Comment.objects.create(post=self.post, author=self.user2, body="Second")

        self.client.force_authenticate(user=self.user2)
        url = reverse("comment-list") + f"?post={self.post.id}"
        response = cast(Response, self.client.get(url))
        self.assertEqual(response.status_code, 200)

        if results := response.data.get("results"):
            self.assertEqual(len(results), 2)
            self.assertEqual(results[0]["body"], "First")
            self.assertEqual(results[1]["body"], "Second")

    def test_user_can_delete_own_comment(self):
        comment = Comment.objects.create(
            post=self.post, author=self.user1, body="To be deleted"
        )

        self.client.force_authenticate(user=self.user1)
        url = reverse("comment-detail", args=[comment.id])
        response = cast(Response, self.client.delete(url))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Comment.objects.count(), 0)

    def test_user_cannot_delete_others_comment(self):
        comment = Comment.objects.create(
            post=self.post, author=self.user1, body="Don't touch this"
        )

        self.client.force_authenticate(user=self.user2)
        url = reverse("comment-detail", args=[comment.id])
        response = cast(Response, self.client.delete(url))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Comment.objects.count(), 1)

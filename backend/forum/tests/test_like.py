from typing import cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.views import Response
from forum.models import Post, Like

User = get_user_model()


class LikeTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="liker", password="pass123", email="liker@example.com"
        )
        self.user2 = User.objects.create_user(
            username="other", password="pass456", email="other@example.com"
        )

        self.post = Post.objects.create(
            title="Likeable Post", body="...", author=self.user2
        )

        self.client = APIClient()

    def test_user_can_like_post(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("post-toggle-like", args=[self.post.id])
        response = cast(Response, self.client.post(url, {"like": True}, format="json"))
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Like.objects.count(), 1)
        self.assertEqual(Like.objects.first().user, self.user1)

    def test_user_can_unlike_post(self):
        Like.objects.create(post=self.post, user=self.user1)

        self.client.force_authenticate(user=self.user1)
        url = reverse("post-toggle-like", args=[self.post.id])
        response = cast(Response, self.client.post(url, {"like": False}, format="json"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Like.objects.count(), 0)

    def test_user_cannot_like_twice(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("post-toggle-like", args=[self.post.id])
        self.client.post(url, {"like": True}, format="json")
        self.client.post(url, {"like": True}, format="json")

        # Like again
        url = reverse("post-toggle-like", args=[self.post.id])
        response = cast(Response, self.client.post(url, {"like": True}, format="json"))
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Like.objects.count(), 1)

    def test_unauthenticated_user_cannot_like(self):
        url = reverse("post-toggle-like", args=[self.post.id])
        response = cast(Response, self.client.post(url, {"like": True}, format="json"))
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Like.objects.count(), 0)

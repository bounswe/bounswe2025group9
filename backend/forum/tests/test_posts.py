from typing import cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.views import Response

from forum.models import Post

User = get_user_model()


class PostTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="pass123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_post(self):
        response = cast(
            Response,
            self.client.post(
                "/forum/posts/", {"title": "First Post", "body": "This is a test post"}
            ),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.count(), 1)
        self.assertEqual(Post.objects.first().title, "First Post")

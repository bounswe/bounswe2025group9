from typing import cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.views import Response

from forum.models import Post

User = get_user_model()


class PostTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="alice", password="pass123", email="alice@example.com"
        )
        self.user2 = User.objects.create_user(
            username="bob", password="pass456", email="bob@example.com"
        )

        self.client = APIClient()

    def test_create_post(self):
        self.client.force_authenticate(user=self.user1)
        response = cast(
            Response,
            self.client.post(
                "/forum/posts/", {"title": "First Post", "body": "This is a test post"}
            ),
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.count(), 1)
        self.assertEqual(Post.objects.first().title, "First Post")

    def test_author_can_delete_own_post(self):
        post = Post.objects.create(title="Delete Me", body="...", author=self.user1)
        self.client.force_authenticate(user=self.user1)
        response = cast(Response, self.client.delete(f"/forum/posts/{post.id}/"))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Post.objects.count(), 0)

    def test_author_can_edit_own_post(self):
        post = Post.objects.create(title="Original", body="Body", author=self.user1)
        self.client.force_authenticate(user=self.user1)
        response = cast(
            Response,
            self.client.patch(
                f"/forum/posts/{post.id}/", {"title": "Updated Title"}, format="json"
            ),
        )
        self.assertEqual(response.status_code, 200)
        post.refresh_from_db()
        self.assertEqual(post.title, "Updated Title")

    def test_non_author_cannot_delete_post(self):
        post = Post.objects.create(title="Protected", body="Body", author=self.user1)
        self.client.force_authenticate(user=self.user2)
        response = cast(Response, self.client.delete(f"/forum/posts/{post.id}/"))
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Post.objects.count(), 1)

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

from forum.models import Post, Like
from accounts.models import Follow

User = get_user_model()


class FeedViewTests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            username="alice", email="alice@example.com", password="password123"
        )
        self.user_b = User.objects.create_user(
            username="bob", email="bob@example.com", password="password123"
        )
        self.user_c = User.objects.create_user(
            username="carol", email="carol@example.com", password="password123"
        )

        # Posts from Bob & Carol
        self.post_b1 = Post.objects.create(
            author=self.user_b, title="Bob Post 1", body="post body"
        )
        self.post_b2 = Post.objects.create(
            author=self.user_b, title="Bob Post 2", body="post body"
        )
        self.post_c1 = Post.objects.create(
            author=self.user_c, title="Carol Post 1", body="post body"
        )

        # URLs
        self.feed_url = reverse("forum-feed")
        self.token_url = reverse("token_obtain_pair")

        # Authenticate Alice
        token_res = self.client.post(
            self.token_url, {"username": "alice", "password": "password123"}
        )
        self.access = token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    # ---------------------------------------------------
    # AUTH TESTS
    # ---------------------------------------------------
    def test_feed_requires_authentication(self):
        self.client.credentials()  # remove token
        response = self.client.get(self.feed_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------------------------------------------------
    # FEED LOGIC TESTS
    # ---------------------------------------------------
    def test_feed_shows_posts_from_followed_users(self):
        Follow.objects.create(follower=self.user, following=self.user_b)
        response = self.client.get(self.feed_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [post["id"] for post in response.data["results"]]

        self.assertIn(self.post_b1.id, returned_ids)
        self.assertIn(self.post_b2.id, returned_ids)

    def test_feed_shows_liked_posts(self):
        Like.objects.create(user=self.user, post=self.post_c1)
        response = self.client.get(self.feed_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [post["id"] for post in response.data["results"]]
        self.assertIn(self.post_c1.id, returned_ids)

    def test_feed_shows_combined_followed_and_liked_posts(self):
        Follow.objects.create(follower=self.user, following=self.user_b)
        Like.objects.create(user=self.user, post=self.post_c1)

        response = self.client.get(self.feed_url)
        returned_ids = [post["id"] for post in response.data["results"]]

        self.assertIn(self.post_b1.id, returned_ids)
        self.assertIn(self.post_b2.id, returned_ids)
        self.assertIn(self.post_c1.id, returned_ids)

    def test_feed_empty_when_no_follows_and_no_likes(self):
        response = self.client.get(self.feed_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    # ---------------------------------------------------
    # PAGINATION TEST
    # ---------------------------------------------------
    def test_feed_pagination(self):
        Follow.objects.create(follower=self.user, following=self.user_b)

        for i in range(20):
            Post.objects.create(
                author=self.user_b,
                title=f"Extra Post {i}",
                body="test body"
            )

        response = self.client.get(self.feed_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Page size is 10
        self.assertEqual(len(response.data["results"]), 10)

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from accounts.models import Follow

User = get_user_model()


class FollowUserViewTests(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="password123",
            name="Alice",
            surname="Test",
        )
        self.user2 = User.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="password123",
            name="Bob",
            surname="Test",
        )

        # URLs
        self.follow_url = reverse("follow-user")
        self.followers_url = lambda username: reverse(
            "user-followers", kwargs={"username": username}
        )
        self.following_url = lambda username: reverse(
            "user-following", kwargs={"username": username}
        )
        self.token_url = reverse("token_obtain_pair")

        # Authenticate as user1
        token_res = self.client.post(
            self.token_url, {"username": "alice", "password": "password123"}
        )
        self.access = token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    # ------------------------------------
    # FOLLOW / UNFOLLOW TESTS
    # ------------------------------------

    def test_follow_user(self):
        response = self.client.post(self.follow_url, {"username": "bob"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("now following", response.data["message"])
        self.assertTrue(Follow.objects.filter(follower=self.user1, following=self.user2).exists())

    def test_unfollow_user(self):
        # Follow first
        Follow.objects.create(follower=self.user1, following=self.user2)

        response = self.client.post(self.follow_url, {"username": "bob"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("unfollowed", response.data["message"])
        self.assertFalse(Follow.objects.filter(follower=self.user1, following=self.user2).exists())

    def test_cannot_follow_self(self):
        response = self.client.post(self.follow_url, {"username": "alice"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot follow yourself", response.data["detail"].lower())

    def test_cannot_follow_nonexistent_user(self):
        response = self.client.post(self.follow_url, {"username": "not_real"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found", response.data["detail"].lower())

    def test_follow_requires_authentication(self):
        # Remove auth header
        self.client.credentials()

        response = self.client.post(self.follow_url, {"username": "bob"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------
    # FOLLOWERS / FOLLOWING LIST TESTS
    # ------------------------------------

    def test_list_followers(self):
        # bob is followed by alice
        Follow.objects.create(follower=self.user1, following=self.user2)

        response = self.client.get(self.followers_url("bob"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], "alice")

    def test_list_following(self):
        # alice follows bob
        Follow.objects.create(follower=self.user1, following=self.user2)

        response = self.client.get(self.following_url("alice"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], "bob")

    def test_list_followers_of_nonexistent_user(self):
        response = self.client.get(self.followers_url("ghost_user"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_following_of_nonexistent_user(self):
        response = self.client.get(self.following_url("ghost_user"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

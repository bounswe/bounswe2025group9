from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfileViewTests(APITestCase):
    def setUp(self):
        # create test user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User",
            address="123 Test Street",
        )
        # url for profile endpoint
        self.profile_url = reverse("user-profile")
        # url for token
        self.token_url = reverse("token_obtain_pair")

    def test_get_user_name_with_token(self):
        # get token for authentication
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        access = token_res.data["access"]
        # set token in header
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        # get profile
        response = self.client.get(self.profile_url)

        # check name is returned correctly
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test")

    def test_no_name_access_without_token(self):
        # try to get profile without token
        response = self.client.get(self.profile_url)

        # should be unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

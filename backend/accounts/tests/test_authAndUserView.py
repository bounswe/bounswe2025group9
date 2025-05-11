from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthAndUserViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.token_url = reverse("token_obtain_pair")
        self.token_refresh_url = reverse("token_refresh")
        self.user_list_url = reverse("user-list")
        self.create_user_url = reverse("create-user")

    def test_create_user_success(self):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "newpass123",
            "name": "New",
            "surname": "User",
            "address": "123 Test Street",
        }
        response = self.client.post(self.create_user_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "newuser")
        self.assertEqual(response.data["email"], "new@example.com")
        self.assertEqual(response.data["name"], "New")
        self.assertEqual(response.data["surname"], "User")
        self.assertEqual(response.data["address"], "123 Test Street")

    def test_create_user_invalid_data(self):
        data = {"username": "", "email": "not-an-email", "password": ""}
        response = self.client.post(self.create_user_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_success(self):
        data = {"username": "testuser", "password": "testpass123"}
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_obtain_token_invalid_credentials(self):
        data = {"username": "testuser", "password": "wrongpass"}
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_success(self):
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        refresh = token_res.data["refresh"]
        response = self.client.post(self.token_refresh_url, {"refresh": refresh})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_user_list_unauthenticated(self):
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_authenticated(self):
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        access = token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class ChangePasswordTests(APITestCase):
    def setUp(self):
        """
        Set up for test cases.
        Creates a test user and sets up the API client, and endpoint, with JWT authentication.

        """
        self.user = User.objects.create_user(
            username="testuser", password="OldPass123!"
        )
        self.client = APIClient()

        # JWT Auth: Generate token and set header
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}"
        )

        self.url = reverse("change-password")

    def test_change_password_success(self):
        """
        Test changing password successfully.
        """
        data = {"old_password": "OldPass123!", "new_password": "NewSecurePass456!"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check new password works
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePass456!"))

    def test_change_password_wrong_old_password(self):
        """
        Test changing password with wrong old password.
        """
        data = {"old_password": "WrongPassword", "new_password": "NewSecurePass456!"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data)

    def test_change_password_unauthenticated(self):
        """
        Test changing password without authentication.
        Remove the auth header and try to change password.
        """
        self.client.credentials()  # Remove auth header by setting credentials to empty
        # To create an attempt to change password without authentication
        data = {"old_password": "OldPass123!", "new_password": "NewSecurePass456!"}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_missing_fields(self):
        """
        Test changing password with missing fields.
        There should be a new and old password in the request body.
        """
        data = {}  # No data
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data)
        self.assertIn("new_password", response.data)

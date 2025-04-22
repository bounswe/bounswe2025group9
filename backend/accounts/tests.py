from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from .models import User
import json


class UserTest(TestCase):
    def test_get_all_users(self):
        response = cast(HttpResponse, self.client.get("/users/"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_create_user(self):
        request_data = {
            "username": "berkaybilen",
            "password": "securepassword123",
            "name": "Berkay",
            "surname": "Bilen",
            "email": "berkaybilen@example.com",
            "address": "Bogazici University",
            "tags": [],
            "allergens": [],
        }
        response = cast(
            HttpResponse, self.client.post("/users/create/", data=request_data)
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["username"], "berkaybilen")
        self.assertEqual(data["name"], "Berkay")
        self.assertEqual(data["surname"], "Bilen")
        self.assertEqual(data["email"], "berkaybilen@example.com")
        self.assertEqual(data["address"], "Bogazici University")
        self.assertEqual(data["tags"], [])
        self.assertEqual(data["allergens"], [])

    def test_create_user_invalid(self):
        response = self.client.post(
            "/users/create/",
            data={
                "name": "Berkay",
                "surname": "Bilen",
            },
        )
        self.assertEqual(response.status_code, 400)

        expected_fields = ["username", "password", "email"]
        response_data = response.json()

        for field in expected_fields:
            self.assertIn(field, response_data)
            self.assertEqual(response_data[field], ["This field is required."])


class LoginTest(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpassword123"
        )

    def test_login_success(self):
        """Test successful login with correct credentials"""
        response = self.client.post(
            "/users/login/jwt/",
            json.dumps({"username": "testuser", "password": "testpassword123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["username"], "testuser")

    def test_login_invalid_credentials(self):
        """Test login with incorrect password"""
        response = self.client.post(
            "/users/login/jwt/",
            json.dumps({"username": "testuser", "password": "wrongpassword"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertIn("error", response.json())

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = self.client.post(
            "/users/login/jwt/",
            json.dumps(
                {
                    "username": "testuser"
                    # Missing password
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        # Check for the specific missing field error in the response
        response_data = response.json()
        self.assertIn("password", response_data)
        self.assertIn("This field is required.", response_data["password"])

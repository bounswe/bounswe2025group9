from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from django.contrib.auth.models import User


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        response = cast(HttpResponse, self.client.get("/api/time?name=Arda"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.json())  # type: ignore
        self.assertEqual(response.json()["name"], "Arda")  # type:ignore


class SignupViewTests(TestCase):
    def setUp(self):
        self.url = (
            "/api/signup"  # Replace with reverse('signup') if using named URL patterns
        )

    def test_valid_signup(self):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password1": "password123",
            "password2": "password123",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("success", response.json())
        self.assertTrue(User.objects.filter(username="testuser").exists())

    def test_missing_fields(self):
        data = {"username": "", "email": "", "password1": "", "password2": ""}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_password_mismatch(self):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password1": "pass1",
            "password2": "pass2",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Passwords do not match", response.json()["error"])

    def test_duplicate_username(self):
        User.objects.create_user(username="testuser", email="a@a.com", password="pass")
        data = {
            "username": "testuser",
            "email": "b@b.com",
            "password1": "password",
            "password2": "password",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Username already taken", response.json()["error"])

    def test_duplicate_email(self):
        User.objects.create_user(
            username="user1", email="dup@example.com", password="pass"
        )
        data = {
            "username": "user2",
            "email": "dup@example.com",
            "password1": "password",
            "password2": "password",
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Email already in use", response.json()["error"])

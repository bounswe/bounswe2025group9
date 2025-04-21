from typing import cast
from django.http import HttpResponse
from django.test import TestCase


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        response = cast(HttpResponse, self.client.get("/api/time?name=Arda"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.json())  # type: ignore
        self.assertEqual(response.json()["name"], "Arda")  # type:ignore


class UserTest(TestCase):
    def test_get_all_users(self):
        response = cast(HttpResponse, self.client.get("/api/users/"))
        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.json(), [])

    def test_create_user(self):
        request_data = {
            "name": "Berkay",
            "surname": "Bilen",
            "email": "berkaybilen@example.com",
            "address": "Bogazici University",
            "tags": [],
            "allergens": [],
            "recipes": [],
        }
        response = cast(
            HttpResponse, self.client.post("/api/users/create/", data=request_data)
        )
        # Assuming there aer no previous users in the database, the first user will have id=1
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["id"], 1),
        self.assertEqual(response.json()["name"], "Berkay")
        self.assertEqual(response.json()["surname"], "Bilen")
        self.assertEqual(response.json()["email"], "berkaybilen@example.com")
        self.assertEqual(response.json()["address"], "Bogazici University")
        self.assertEqual(response.json()["tags"], [])
        self.assertEqual(response.json()["allergens"], [])
        self.assertEqual(response.json()["recipes"], [])

    def test_create_user_invalid(self):
        """
        Test creating a user with invalid data, assuming that the email and address fields are required.
        Unit tests are not written only for succesful cases.
        """
        request_data = {
            "name": "Berkay",
            "surname": "Bilen",
        }
        response = cast(
            HttpResponse, self.client.post("/api/users/create/", data=request_data)
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "email": ["This field is required."],
            },
        )

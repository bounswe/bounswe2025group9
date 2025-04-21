from typing import cast
from django.http import HttpResponse
from django.test import TestCase


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

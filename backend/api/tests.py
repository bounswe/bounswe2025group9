from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from django.urls import reverse


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        url = reverse("get-time") + "?name=Arda"
        response = cast(HttpResponse, self.client.get(url))
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.json())  # type: ignore
        self.assertEqual(response.json()["name"], "Arda")  # type:ignore

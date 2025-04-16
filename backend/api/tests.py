from typing import cast
from django.http import HttpResponse
from django.test import TestCase

class GetTimeTest(TestCase):
    def test_get_time_success(self):
        response = cast(HttpResponse, self.client.get('/api/time?name=Arda'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('time', response.json()) # type: ignore
        self.assertEqual(response.json()['name'], 'Arda') # type:ignore

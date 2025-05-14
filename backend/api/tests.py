from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.urls import reverse


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        response = cast(HttpResponse, self.client.get("/api/time?name=Arda"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("time", response.json())  # type: ignore
        self.assertEqual(response.json()["name"], "Arda")  # type:ignore


class TranslationViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('translate')  # Make sure this matches your URL name
        self.valid_payload = {
            'text': 'Hello, world!',
            'target_lang': 'TR',
            'source_lang': 'EN'
        }
        self.mock_response = {
            'translations': [{
                'text': 'Merhaba, dünya!',
                'detected_source_language': 'EN'
            }]
        }

    @patch('requests.post')
    def test_successful_translation(self, mock_post):
        # Mock the DeepL API response
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = self.mock_response

        response = self.client.post(
            self.url,
            self.valid_payload,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['translated_text'], 'Merhaba, dünya!')
        self.assertEqual(response.data['source_lang'], 'EN')
        self.assertEqual(response.data['target_lang'], 'TR')

    def test_missing_required_fields(self):
        # Test without text
        response = self.client.post(
            self.url,
            {'target_lang': 'TR'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test without target_lang
        response = self.client.post(
            self.url,
            {'text': 'Hello'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('requests.post')
    def test_translation_service_error(self, mock_post):
        # Mock a failed API response
        mock_post.return_value.status_code = 503
        mock_post.return_value.text = 'Service unavailable'

        response = self.client.post(
            self.url,
            self.valid_payload,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('error', response.data)

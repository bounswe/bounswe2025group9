from typing import cast
from django.http import HttpResponse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, Mock
from django.urls import reverse
from api.views import TranslationService  # Add this import
from django.urls import reverse


class GetTimeTest(TestCase):
    def test_get_time_success(self):
        url = reverse("get-time") + "?name=Arda"
        response = cast(HttpResponse, self.client.get(url))
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


class TranslationServiceTest(TestCase):
    def setUp(self):
        self.translation_service = TranslationService()
        self.test_text = 'Hello, world!'
        self.target_lang = 'TR'
        self.source_lang = 'EN'
        self.mock_deepl_response = {
            'translations': [{
                'text': 'Merhaba, dünya!',
                'detected_source_language': 'EN'
            }]
        }

    @patch('api.views.requests.post')  # Update this path to match your actual implementation
    def test_translate_text(self, mock_post):
        # Mock the DeepL API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_deepl_response
        mock_post.return_value = mock_response

        # Test the translation method directly
        result = self.translation_service.translate_text(
            text=self.test_text,
            target_lang=self.target_lang,
            source_lang=self.source_lang
        )

        # Assert the result
        self.assertEqual(result['translated_text'], 'Merhaba, dünya!')
        self.assertEqual(result['source_lang'], 'EN')
        self.assertEqual(result['target_lang'], 'TR')

    def test_validate_translation_params(self):
        # Test valid parameters
        result = self.translation_service.validate_params(
            text=self.test_text,
            target_lang=self.target_lang,
            source_lang=self.source_lang
        )
        self.assertTrue(result)

        # Test invalid parameters
        with self.assertRaises(ValueError):
            self.translation_service.validate_params(
                text='',
                target_lang=self.target_lang,
                source_lang=self.source_lang
            )

        with self.assertRaises(ValueError):
            self.translation_service.validate_params(
                text=self.test_text,
                target_lang='',
                source_lang=self.source_lang
            )

    @patch('api.views.requests.post')
    def test_translation_service_error(self, mock_post):
        # Mock a failed API response
        mock_response = Mock()
        mock_response.status_code = 503
        mock_response.text = 'Service unavailable'
        mock_post.return_value = mock_response

        # Test error handling
        with self.assertRaises(Exception) as context:
            self.translation_service.translate_text(
                text=self.test_text,
                target_lang=self.target_lang,
                source_lang=self.source_lang
            )
        
        self.assertIn('Translation service error', str(context.exception))

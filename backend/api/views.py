from django.http import JsonResponse, HttpRequest
from datetime import datetime
from rest_framework.decorators import api_view


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from datetime import datetime
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.request import Request

class TranslationService:
    def __init__(self):
        self.api_key = settings.DEEPL_API_KEY
        self.api_url = "https://api-free.deepl.com/v2/translate"

    def validate_params(self, text: str, target_lang: str, source_lang: str) -> bool:
        if not text:
            raise ValueError("Text cannot be empty")
        if not target_lang:
            raise ValueError("Target language cannot be empty")
        return True

    def translate_text(self, text: str, target_lang: str, source_lang: str = None) -> dict:
        self.validate_params(text, target_lang, source_lang)
        
        headers = {
            "Authorization": f"DeepL-Auth-Key {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": [text],
            "target_lang": target_lang,
        }
        if source_lang:
            payload["source_lang"] = source_lang

        response = requests.post(self.api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Translation service error: {response.text}")
            
        data = response.json()
        return {
            'translated_text': data['translations'][0]['text'],
            'source_lang': data['translations'][0]['detected_source_language'],
            'target_lang': target_lang
        }

class TranslationView(APIView):
    permission_classes = []

    def post(self, request: Request) -> Response:
        """
        POST /api/translate
        
        Translates text using DeepL API.
        
        Request body:
        {
            "text": "Text to translate",
            "target_lang": "TR",  # Language code (e.g., EN, TR, DE, FR)
            "source_lang": "EN"   # Optional: source language
        }
        
        Response:
        {
            "translated_text": "Translated content",
            "source_lang": "EN",
            "target_lang": "TR"
        }
        """
        try:
            # Get request data
            text = request.data.get('text')
            target_lang = request.data.get('target_lang')
            source_lang = request.data.get('source_lang')

            # Validate input
            if not text or not target_lang:
                return Response(
                    {"error": "text and target_lang are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # DeepL API configuration
            api_key = settings.DEEPL_API_KEY
            url = "https://api-free.deepl.com/v2/translate"

            # Prepare request data
            params = {
                "text": text,
                "target_lang": target_lang,
                "auth_key": api_key,
            }
            
            if source_lang:
                params["source_lang"] = source_lang

            # Make API request
            response = requests.post(url, data=params)
            
            if response.status_code == 200:
                result = response.json()
                return Response({
                    "translated_text": result["translations"][0]["text"],
                    "source_lang": result["translations"][0].get("detected_source_language", source_lang),
                    "target_lang": target_lang
                })
            else:
                return Response(
                    {"error": "Translation service error", "details": response.text},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TimeView(APIView):
    permission_classes = []

    def get(self, request: Request) -> Response:
        """
        GET /time?name={name}

        Returns the current time and the provided name.

        Example:
            {
                "time": "2023-10-01T12:00:00",
                "name": "Arda"
            }
        """
        name = request.query_params.get("name")
        if not name:
            return Response(
                {"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response({"time": datetime.now().isoformat(), "name": name})

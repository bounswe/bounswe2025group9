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

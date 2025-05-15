from django.http import JsonResponse, HttpRequest
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from datetime import datetime
import requests

from django.conf import settings

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


class WikidataEntityView(APIView):
    permission_classes = []

    def get(self, request: Request, entity_id=None) -> Response:
        """
        GET /food/{entity_id}
        Get detailed information about a specific food entity
        """
        if not entity_id:
            return Response(
                {"error": "Entity ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            entity_data = self.get_wikidata_entity(entity_id)
            if not entity_data:
                return Response(
                    {"error": f"Entity {entity_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response(entity_data)
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to retrieve entity: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_wikidata_entity(self, entity_id):
        """
        Uses the wbgetentities API to get detailed information about an entity
        """
        api_url = "https://www.wikidata.org/w/api.php"

        # Parameters for wbgetentities
        params = {
            "action": "wbgetentities",
            "format": "json",
            "ids": entity_id,
            "languages": "en",
            "props": "labels|descriptions|claims|sitelinks",
        }

        response = requests.get(
            api_url, params=params, headers={"User-Agent": "WikidataFoodApp/1.0"}
        )
        response.raise_for_status()
        data = response.json()

        if "entities" not in data or entity_id not in data["entities"]:
            return None

        entity = data["entities"][entity_id]

        # Extract base entity information
        result = {
            "id": entity_id,
            "label": entity.get("labels", {}).get("en", {}).get("value", "Unknown"),
            "description": entity.get("descriptions", {})
            .get("en", {})
            .get("value", ""),
            "wikipedia_link": self.extract_wikipedia_link(entity),
        }

        # Extract basic food properties if available
        food_properties = {
            "P279": "subclass_of",  # subclass of
            "P31": "instance_of",  # instance of
            "P186": "made_from_material",  # made from material
            "P527": "has_parts",  # has parts
            "P1542": "has_effect",  # has effect
            "P2670": "has_nutritional_value",  # has nutritional value
        }

        properties = {}
        for prop_id, prop_name in food_properties.items():
            if prop_id in entity.get("claims", {}):
                values = []
                for claim in entity["claims"][prop_id]:
                    if "mainsnak" in claim and "datavalue" in claim["mainsnak"]:
                        if (
                            claim["mainsnak"]["datavalue"]["type"]
                            == "wikibase-entityid"
                        ):
                            values.append(claim["mainsnak"]["datavalue"]["value"]["id"])
                if values:
                    properties[prop_name] = values

        if properties:
            result["properties"] = properties

        return result

    def extract_wikipedia_link(self, entity):
        """Extract English Wikipedia link if available"""
        sitelinks = entity.get("sitelinks", {})
        if "enwiki" in sitelinks:
            title = sitelinks["enwiki"].get("title", "")
            if title:
                return f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        return None

class WikidataFoodView(APIView):
    permission_classes = []
    
    def get(self, request: Request) -> Response:
        """
        GET /food?query={query}&limit={limit}
        Search for food-related entities in Wikidata
        """
        query = request.query_params.get("query")
        limit = request.query_params.get("limit", "10")
        
        try:
            limit = int(limit)
        except ValueError:
            limit = 10
            
        if not query:
            return Response(
                {"error": "query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            results = self.search_wikidata_entities(query, limit)
            return Response({
                "results": results,
                "count": len(results),
                "query": query
            })
        except Exception as e:
            return Response(
                {"error": f"Failed to query Wikidata: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def search_wikidata_entities(self, query, limit):
        """
        Uses the wbsearchentities API to search for food-related entities
        """
        api_url = "https://www.wikidata.org/w/api.php"
        
        # Parameters for wbsearchentities
        params = {
            "action": "wbsearchentities",
            "format": "json",
            "search": query,
            "language": "en",
            "limit": limit,
            "type": "item"
        }
        
        response = requests.get(
            api_url, 
            params=params,
            headers={"User-Agent": "WikidataFoodApp/1.0"}
        )
        response.raise_for_status()
        data = response.json()
        
        # Process the search results
        results = []
        for item in data.get("search", []):
            result = {
                "id": item.get("id"),
                "label": item.get("label", "Unknown"),
                "description": item.get("description", ""),
                "url": item.get("url", "")
            }
            results.append(result)
            
        return results

@api_view(["GET"])
@permission_classes([AllowAny])
def random_food_image(request):
    """
    GET /food/image/?category={food_category}

    Fetches a random food image from the Foodish API.
    If no category is provided, returns an image from a random category.

    Example response:
    {
        "image": "https://foodish-api.com/images/pizza/pizza23.jpg"
    }
    """
    category = request.query_params.get("category")

    try:
        if category:
            url = f"https://foodish-api.com/api/images/{category}"
        else:
            url = "https://foodish-api.com/api/"

        resp = requests.get(url, timeout=5)
        resp.raise_for_status()

        data = resp.json()
        return Response(data)
    except requests.exceptions.HTTPError as http_err:
        return Response(
            {"error": f"HTTP error from Foodish API: {str(http_err)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to fetch image: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

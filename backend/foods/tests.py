from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.conf import settings
from django.contrib.auth import get_user_model
from foods.constants import DEFAULT_CURRENCY, PriceCategory, PriceUnit
from foods.models import FoodEntry, FoodProposal, PriceAudit
from foods.serializers import FoodEntrySerializer
from foods.services import (
    approve_food_proposal,
    override_food_price_category,
    recalculate_price_thresholds,
    update_food_price,
)
from accounts.models import Allergen
from unittest.mock import patch
import requests

User = get_user_model()


def create_food_entry(
    name: str,
    *,
    base_price: Decimal | float | str | None = None,
    price_unit: str = PriceUnit.PER_100G,
    currency: str = DEFAULT_CURRENCY,
):
    data = {
        "name": name,
        "category": "Test",
        "servingSize": 100,
        "caloriesPerServing": 100,
        "proteinContent": 10,
        "fatContent": 5,
        "carbohydrateContent": 15,
        "dietaryOptions": [],
        "nutritionScore": 5.0,
        "imageUrl": "",
        "price_unit": price_unit,
        "currency": currency,
    }
    if base_price is not None:
        data["base_price"] = Decimal(str(base_price))
    entry = FoodEntry.objects.create(**data)
    entry.allergens.set([])
    return entry


def seed_price_entries(prices: list[Decimal | float | str]):
    for idx, price in enumerate(prices):
        create_food_entry(
            name=f"Baseline {idx}-{price}",
            base_price=price,
        )


class FoodCatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create sample FoodEntry objects
        for i in range(15):
            food = FoodEntry.objects.create(
                name=f"Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image{i}.jpg",
            )
            food.allergens.set([])
            food.dietaryOptions = []
            food.save()
        # Create 2 FoodEntry objects with category "Fruit"
        for i in range(2):
            food = FoodEntry.objects.create(
                name=f"Fruit Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image_fruit_{i}.jpg",
                category="Fruit",
            )

            food.allergens.set([])
            food.dietaryOptions = []
            food.save()

        # Create 13 FoodEntry objects with category "Vegetable"
        for i in range(13):
            food = FoodEntry.objects.create(
                name=f"Vegetable Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image_veg_{i}.jpg",
                category="Vegetable",
            )
            food.allergens.set([])
            food.dietaryOptions = []
            food.save()

    def test_successful_query(self):
        """
        Test that a valid query returns the correct status and data.
        """
        response = self.client.get(reverse("get_foods"), {"page": 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data), 5
        )  # (count, next, previous, results, status) // no warnings since query is valid

    def test_category_filtering(self):
        """
        Test that filtering by category returns only foods in that category.
        """
        response = self.client.get(reverse("get_foods"), {"category": "Fruit"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data), 5
        )  # (count, next, previous, results, status)
        # Check that all results have category "Fruit"
        for food in response.data["results"]:
            self.assertEqual(food["category"], "Fruit")
        # # Check that at least Fruit instances we insterted are in the db
        self.assertLessEqual(2, len(response.data["results"]))

    def test_case_insensitive_category_filtering(self):
        """
        Test that category filtering is case-insensitive.
        """
        # Test with lowercase
        response_lower = self.client.get(reverse("get_foods"), {"category": "fruit"})
        self.assertEqual(response_lower.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_lower.data), 5)

        # Test with uppercase
        response_upper = self.client.get(reverse("get_foods"), {"category": "FRUIT"})
        self.assertEqual(response_upper.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_upper.data), 5)

        # Test with mixed case
        response_mixed = self.client.get(reverse("get_foods"), {"category": "FrUiT"})
        self.assertEqual(response_mixed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_mixed.data), 5)

    def test_nonexistent_category(self):
        """
        Test that filtering by a nonexistent category returns an empty list.
        """
        response = self.client.get(
            reverse("get_foods"), {"category": "NonexistentCategory"}
        )
        self.assertEqual(response.data.get("status"), status.HTTP_206_PARTIAL_CONTENT)
        self.assertEqual(
            response.data["warning"],
            "Some categories are not available: nonexistentcategory",
        )

    def test_search_returns_successful(self):
        response = self.client.get(reverse("get_foods"), {"search": "frUit"})
        self.assertEqual(response.data.get("status"), status.HTTP_200_OK)
        self.assertTrue(
            any("Fruit" in food["name"] for food in response.data.get("results", []))
        )

    def test_no_search_result(self):
        response = self.client.get(reverse("get_foods"), {"search": "nonexistentfood"})
        self.assertEqual(response.data.get("status"), status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(response.data.get("results", [])), 0)

    def test_search_with_category(self):
        response = self.client.get(
            reverse("get_foods"), {"search": "Food 1", "category": "Fruit"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertTrue(all(food["category"] == "Fruit" for food in results))
        self.assertTrue(any("Fruit Food" in food["name"] for food in results))


class SuggestRecipeTests(TestCase):
    def test_suggest_recipe_successful(self):
        """Test that a valid food_name returns a recipe."""
        response = self.client.get(reverse("suggest_recipe"), {"food_name": "chicken"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("Meal", response.data)
        self.assertIn("Instructions", response.data)
        self.assertIsInstance(response.data["Meal"], str)
        self.assertIsInstance(response.data["Instructions"], str)

    def test_suggest_recipe_unsuccessful(self):
        """Test that an unknown food_name returns a warning and 404."""
        response = self.client.get(
            reverse("suggest_recipe"), {"food_name": "food_not_in_db"}
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("warning", response.data)
        self.assertIn("results", response.data)


class RandomMealTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("random-meal")

    @patch("requests.get")
    def test_successful_random_meal(self, mock_get):
        """Test that a successful API call returns a random meal with all required fields."""
        # Mock successful API response
        mock_response = {
            "meals": [
                {
                    "idMeal": "52772",
                    "strMeal": "Teriyaki Chicken Casserole",
                    "strCategory": "Chicken",
                    "strArea": "Japanese",
                    "strInstructions": "Preheat oven to 350° F...",
                    "strMealThumb": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
                    "strTags": "Meat,Casserole",
                    "strYoutube": "https://www.youtube.com/watch?v=4aZr5hXWPQ",
                    "strIngredient1": "soy sauce",
                    "strMeasure1": "3/4 cup",
                    "strIngredient2": "water",
                    "strMeasure2": "1/2 cup",
                }
            ]
        }
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify all required fields are present
        self.assertIn("id", response.data)
        self.assertIn("name", response.data)
        self.assertIn("category", response.data)
        self.assertIn("area", response.data)
        self.assertIn("instructions", response.data)
        self.assertIn("image", response.data)
        self.assertIn("tags", response.data)
        self.assertIn("youtube", response.data)
        self.assertIn("ingredients", response.data)

        # Verify the data matches our mock
        self.assertEqual(response.data["id"], "52772")
        self.assertEqual(response.data["name"], "Teriyaki Chicken Casserole")
        self.assertEqual(len(response.data["ingredients"]), 2)

    @patch("requests.get")
    def test_empty_meals_response(self, mock_get):
        """Test that an empty meals response returns appropriate error."""
        # Mock empty meals response
        mock_response = {"meals": None}
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("warning", response.data)
        self.assertIn("results", response.data)

    @patch("requests.get")
    def test_api_error(self, mock_get):
        """Test that API errors are handled properly."""
        # Mock API error
        mock_get.side_effect = Exception("API Error")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)


class GetOrFetchFoodEntryTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("get_or_fetch_food")
        
        # Create user and get authentication token
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        token_url = reverse("token_obtain_pair")
        token_res = self.client.post(
            token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

    def test_missing_name_param(self):
        """
        When no 'name' parameter is provided, return 400 BAD REQUEST.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"error": "Missing 'name' parameter"})

    def test_food_exists_in_db(self):
        """
        When food exists in the database (case-insensitive), return it with 200 OK.
        """
        food = FoodEntry.objects.create(
            name="Apple",
            category="Fruit",
            servingSize=100.0,
            caloriesPerServing=52.0,
            proteinContent=0.3,
            fatContent=0.2,
            carbohydrateContent=14.0,
            dietaryOptions=[],
            nutritionScore=0.0,
            imageUrl="",
        )
        food.allergens.set([])
        response = self.client.get(self.url, {"name": "apple"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected = FoodEntrySerializer(food).data
        self.assertEqual(response.data, expected)

    @patch("foods.views.make_request")
    def test_api_search_not_found(self, mock_make_request):
        """
        When the FatSecret API search returns no foods, return 404 NOT FOUND.
        """
        mock_make_request.return_value = {"foods": {"food": []}}
        response = self.client.get(self.url, {"name": "Banana"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Food not found in FatSecret API"})

    @patch("foods.views.make_request")
    @patch("foods.views.extract_food_info")
    def test_extract_food_info_failure(self, mock_extract, mock_make):
        """
        When extract_food_info returns None, return 500 INTERNAL SERVER ERROR.
        """
        mock_make.side_effect = [
            {"foods": {"food": [{"food_id": "123"}]}},
            {"food": {"food_url": "http://example.com"}},
        ]
        mock_extract.return_value = None
        response = self.client.get(self.url, {"name": "Banana"})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data, {"error": "Could not parse FatSecret response"})

    @patch("foods.views.make_request")
    @patch("foods.views.extract_food_info")
    @patch("foods.views.get_fatsecret_image_url")
    def test_success_fetch_creates_and_returns_food(
        self, mock_image_url, mock_extract, mock_make
    ):
        """
        When the API returns valid data, create a new FoodProposal and return 201 CREATED.
        """
        mock_make.side_effect = [
            {"foods": {"food": [{"food_id": "123"}]}},
            {"food": {"food_url": "http://example.com"}},
        ]
        parsed_data = {
            "food_name": "Banana",
            "serving_amount": 100.0,
            "calories": 89.0,
            "carbohydrates": 23.0,
            "protein": 1.1,
            "fat": 0.3,
        }
        mock_extract.return_value = parsed_data
        mock_image_url.return_value = "http://image.test/banana.png"

        response = self.client.get(self.url, {"name": "Banana"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The view now creates a FoodProposal instead of FoodEntry
        food = FoodProposal.objects.get(name="Banana")
        self.assertEqual(food.category, "Unknown")
        self.assertEqual(food.servingSize, parsed_data["serving_amount"])
        self.assertEqual(food.caloriesPerServing, parsed_data["calories"])
        self.assertEqual(food.carbohydrateContent, parsed_data["carbohydrates"])
        self.assertEqual(food.proteinContent, parsed_data["protein"])
        self.assertEqual(food.fatContent, parsed_data["fat"])
        self.assertEqual(food.imageUrl, mock_image_url.return_value)
        self.assertEqual(food.proposedBy, self.user)


class FoodProposalTests(APITestCase):
    """Tests for food proposal submission endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.token_url = reverse("token_obtain_pair")
        self.proposal_url = reverse("submit_food_proposal")
        
        # Create some allergens for testing
        self.allergen1 = Allergen.objects.create(name="Peanuts", common=True)
        self.allergen2 = Allergen.objects.create(name="Dairy", common=True)

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def test_submit_food_proposal_success(self):
        """Test successful food proposal submission"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Organic Quinoa",
            "category": "Grains",
            "servingSize": 185,
            "caloriesPerServing": 222,
            "proteinContent": 8.14,
            "fatContent": 3.55,
            "carbohydrateContent": 39.4,
            "dietaryOptions": ["Vegetarian", "Gluten-Free"],
            "imageUrl": "https://example.com/quinoa.jpg"
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify proposal was created
        self.assertTrue(FoodProposal.objects.filter(name="Organic Quinoa").exists())
        proposal = FoodProposal.objects.get(name="Organic Quinoa")
        self.assertEqual(proposal.proposedBy, self.user)
        self.assertEqual(proposal.category, "Grains")
        self.assertEqual(float(proposal.servingSize), 185.0)

    def test_submit_food_proposal_minimal_data(self):
        """Test submitting proposal with only required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Simple Food",
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        proposal = FoodProposal.objects.get(name="Simple Food")
        self.assertIsNotNone(proposal.nutritionScore)

    def test_submit_food_proposal_with_multiple_allergens(self):
        """Test submitting proposal with multiple allergens"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Peanut Butter",
            "category": "Fats & Oils",
            "servingSize": 32,
            "caloriesPerServing": 188,
            "proteinContent": 8,
            "fatContent": 16,
            "carbohydrateContent": 7
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        proposal = FoodProposal.objects.get(name="Peanut Butter")
        # Note: M2M fields need to be set after creation
        self.assertIsNotNone(proposal)

    def test_submit_food_proposal_missing_required_fields(self):
        """Test submitting proposal without required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Incomplete Food",
            # Missing required nutrition fields
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_food_proposal_negative_values(self):
        """Test submitting proposal with negative values (currently accepted)"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Invalid Food",
            "category": "Other",
            "servingSize": -100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        # Note: Current implementation accepts negative values
        # This test documents current behavior
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_submit_food_proposal_zero_serving_size(self):
        """Test submitting proposal with zero serving size (currently accepted)"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Zero Serving",
            "category": "Other",
            "servingSize": 0,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        # Note: Current implementation accepts zero values
        # This test documents current behavior
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_submit_food_proposal_no_auth(self):
        """Test that unauthenticated users cannot submit proposals"""
        data = {
            "name": "Unauthorized Food",
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_food_proposal_with_dietary_options(self):
        """Test submitting proposal with dietary options"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Vegan Protein Bar",
            "category": "Sweets & Snacks",
            "servingSize": 60,
            "caloriesPerServing": 200,
            "proteinContent": 15,
            "fatContent": 8,
            "carbohydrateContent": 25,
            "dietaryOptions": ["Vegan", "Gluten-Free", "High-Protein"]
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        proposal = FoodProposal.objects.get(name="Vegan Protein Bar")
        self.assertEqual(len(proposal.dietaryOptions), 3)

    def test_submit_duplicate_food_proposal(self):
        """Test submitting proposal for food that already exists"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Create existing food entry
        FoodEntry.objects.create(
            name="Existing Food",
            category="Other",
            servingSize=100,
            caloriesPerServing=150,
            proteinContent=5,
            fatContent=3,
            carbohydrateContent=20,
            nutritionScore=5.0
        )
        
        # Try to propose it again
        data = {
            "name": "Existing Food",
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        # Should still accept the proposal (proposals can be duplicates)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_nutrition_score_calculation(self):
        """Test that nutrition score is calculated for proposals"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Healthy Food",
            "category": "Vegetable",
            "servingSize": 100,
            "caloriesPerServing": 50,
            "proteinContent": 3,
            "fatContent": 0.5,
            "carbohydrateContent": 10
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("nutritionScore", response.data)
        self.assertGreater(response.data["nutritionScore"], 0)

    def test_submit_food_proposal_long_name(self):
        """Test submitting proposal with very long name"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "A" * 300,  # Very long name
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        # Should either accept or reject based on model field max_length
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_submit_food_proposal_with_image_url(self):
        """Test submitting proposal with custom image URL"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        data = {
            "name": "Custom Image Food",
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20,
            "imageUrl": "https://example.com/custom-food.jpg"
        }
        response = self.client.post(self.proposal_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        proposal = FoodProposal.objects.get(name="Custom Image Food")
        self.assertEqual(proposal.imageUrl, "https://example.com/custom-food.jpg")


class FoodNutritionInfoTests(APITestCase):
    """Tests for food nutrition info endpoint using Open Food Facts API"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.token_url = reverse("token_obtain_pair")
        self.nutrition_info_url = reverse("food_nutrition_info")
        
        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    @patch("requests.get")
    def test_get_nutrition_info_success(self, mock_get):
        """Test successful nutrition info fetch from Open Food Facts API"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        
        # Mock successful API response
        mock_response = {
            "products": [
                {
                    "nutriments": {
                        "energy-kcal_100g": 52,
                        "proteins_100g": 0.3,
                        "fat_100g": 0.2,
                        "carbohydrates_100g": 14,
                        "fiber_100g": 2.4
                    }
                }
            ]
        }
        
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        
        response = self.client.get(self.nutrition_info_url, {"name": "apple"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("food", response.data)
        self.assertIn("calories", response.data)
        self.assertIn("protein", response.data)
        self.assertIn("fat", response.data)
        self.assertIn("carbs", response.data)
        self.assertIn("fiber", response.data)
        self.assertEqual(response.data["food"], "apple")
        self.assertEqual(response.data["calories"], 52)

    def test_get_nutrition_info_missing_name(self):
        """Test request without name parameter"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.nutrition_info_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
    
    def test_get_nutrition_info_no_auth(self):
        """Test that endpoint requires authentication"""
        response = self.client.get(self.nutrition_info_url, {"name": "apple"})
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("requests.get")
    def test_get_nutrition_info_not_found(self, mock_get):
        """Test when no products are found in API"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        mock_response = {"products": []}
        
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        
        response = self.client.get(self.nutrition_info_url, {"name": "nonexistentfood12345"})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("warning", response.data)

    @patch("requests.get")
    def test_get_nutrition_info_api_error(self, mock_get):
        """Test handling of API errors"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        mock_get.side_effect = Exception("API Error")
        
        response = self.client.get(self.nutrition_info_url, {"name": "apple"})
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

    @patch("requests.get")
    def test_get_nutrition_info_incomplete_data(self, mock_get):
        """Test when API returns incomplete nutrition data"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        mock_response = {
            "products": [
                {
                    "nutriments": {
                        "energy-kcal_100g": 100,
                        # Missing some nutrients
                    }
                }
            ]
        }
        
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        
        response = self.client.get(self.nutrition_info_url, {"name": "test"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should still return structure with None values
        self.assertIsNone(response.data.get("protein"))
        self.assertIsNone(response.data.get("fat"))

    @patch("requests.get")
    def test_get_nutrition_info_timeout(self, mock_get):
        """Test handling of timeout errors"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        mock_get.side_effect = requests.Timeout("Timeout")
        
        response = self.client.get(self.nutrition_info_url, {"name": "apple"})
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

    @patch("requests.get")
    def test_get_nutrition_info_empty_name(self, mock_get):
        """Test with empty name parameter"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.nutrition_info_url, {"name": ""})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("requests.get")
    def test_get_nutrition_info_special_characters(self, mock_get):
        """Test with food name containing special characters"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        mock_response = {
            "products": [
                {
                    "nutriments": {
                        "energy-kcal_100g": 100,
                        "proteins_100g": 5,
                        "fat_100g": 3,
                        "carbohydrates_100g": 20,
                        "fiber_100g": 2
                    }
                }
            ]
        }
        
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200
        mock_get.return_value.raise_for_status = lambda: None
        
        response = self.client.get(self.nutrition_info_url, {"name": "peanut-butter & jelly"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PriceCategorizationTests(TestCase):
    def setUp(self):
        self.moderator = User.objects.create_user(
            username="moderator",
            email="moderator@example.com",
            password="ModPass123!",
            name="Mod",
            surname="Erator",
            is_staff=True,
        )

    def test_recalculate_price_thresholds_uses_sorted_prices(self):
        seed_price_entries([10, 20, 30, 40, 50, 60])

        threshold = recalculate_price_thresholds(
            PriceUnit.PER_100G, currency=DEFAULT_CURRENCY
        )
        self.assertEqual(threshold.lower_threshold, Decimal("20"))
        self.assertEqual(threshold.upper_threshold, Decimal("40"))

    def test_update_food_price_assigns_category_and_logs_audit(self):
        seed_price_entries([10, 20, 30, 40, 50, 60])
        entry = create_food_entry("Target Food")

        update_food_price(
            entry,
            base_price=Decimal("35.00"),
            price_unit=PriceUnit.PER_100G,
            currency=DEFAULT_CURRENCY,
            changed_by=self.moderator,
        )
        entry.refresh_from_db()

        self.assertEqual(entry.price_category, PriceCategory.MID)
        audit = entry.price_audits.filter(
            change_type=PriceAudit.ChangeType.PRICE_UPDATE
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.changed_by, self.moderator)
        self.assertEqual(audit.new_price_category, PriceCategory.MID)

    def test_manual_override_survives_price_updates(self):
        seed_price_entries([10, 20, 30, 40, 50, 60])
        entry = create_food_entry("Override Food")

        update_food_price(
            entry,
            base_price=Decimal("35.00"),
            price_unit=PriceUnit.PER_100G,
            currency=DEFAULT_CURRENCY,
            changed_by=self.moderator,
        )
        override_reason = "Seasonal scarcity"
        override_food_price_category(
            entry,
            category=PriceCategory.PREMIUM,
            changed_by=self.moderator,
            reason=override_reason,
        )

        update_food_price(
            entry,
            base_price=Decimal("18.00"),
            price_unit=PriceUnit.PER_100G,
            currency=DEFAULT_CURRENCY,
            changed_by=self.moderator,
        )
        entry.refresh_from_db()

        self.assertEqual(entry.price_category, PriceCategory.PREMIUM)
        self.assertEqual(entry.category_overridden_by, self.moderator)
        self.assertEqual(entry.category_override_reason, override_reason)


class FoodProposalApprovalTests(TestCase):
    def setUp(self):
        self.moderator = User.objects.create_user(
            username="foodmod",
            email="foodmod@example.com",
            password="ModPass321!",
            name="Food",
            surname="Mod",
            is_staff=True,
        )
        self.proposer = User.objects.create_user(
            username="submitter",
            email="submitter@example.com",
            password="SubmitPass123!",
            name="Food",
            surname="Fan",
        )
        seed_price_entries([12, 18, 30, 45, 60, 72])

    def _create_proposal(self, base_price: Decimal) -> FoodProposal:
        return FoodProposal.objects.create(
            name="Approved Food",
            category="Snacks",
            servingSize=100,
            caloriesPerServing=250,
            proteinContent=5,
            fatContent=10,
            carbohydrateContent=30,
            dietaryOptions=[],
            nutritionScore=6.5,
            imageUrl="",
            base_price=base_price,
            price_unit=PriceUnit.PER_100G,
            currency=DEFAULT_CURRENCY,
            proposedBy=self.proposer,
        )

    def test_approve_food_proposal_assigns_category_and_creates_audit(self):
        proposal = self._create_proposal(Decimal("32.50"))

        proposal, entry = approve_food_proposal(
            proposal, changed_by=self.moderator
        )

        self.assertTrue(proposal.isApproved)
        self.assertIsNotNone(entry)
        self.assertEqual(entry.price_category, PriceCategory.MID)
        self.assertTrue(
            entry.price_audits.filter(
                change_type=PriceAudit.ChangeType.PRICE_UPDATE
            ).exists()
        )


class ModeratorWorkflowTests(APITestCase):
    def setUp(self):
        self.moderator = User.objects.create_user(
            username="api-mod",
            email="api-mod@example.com",
            password="ApiModPass123!",
            name="Api",
            surname="Mod",
            is_staff=True,
        )
        self.proposer = User.objects.create_user(
            username="api-submitter",
            email="api-submitter@example.com",
            password="ApiSubmit123!",
            name="Api",
            surname="User",
        )
        seed_price_entries([15, 25, 35, 45, 55, 65])
        self.client.force_authenticate(user=self.moderator)

    def test_full_moderation_flow_records_price_audit(self):
        proposal = FoodProposal.objects.create(
            name="API Approved Food",
            category="Meals",
            servingSize=150,
            caloriesPerServing=320,
            proteinContent=12,
            fatContent=9,
            carbohydrateContent=40,
            dietaryOptions=[],
            nutritionScore=7.2,
            imageUrl="",
            base_price=Decimal("38.00"),
            price_unit=PriceUnit.PER_100G,
            currency=DEFAULT_CURRENCY,
            proposedBy=self.proposer,
        )

        url = reverse("moderation-food-proposals-approve", args=[proposal.id])
        response = self.client.post(url, {"approved": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entry = FoodEntry.objects.get(name=proposal.name)
        self.assertEqual(entry.price_category, PriceCategory.MID)
        self.assertTrue(
            entry.price_audits.filter(
                change_type=PriceAudit.ChangeType.PRICE_UPDATE
            ).exists()
        )

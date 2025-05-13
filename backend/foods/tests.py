from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.conf import settings
from foods.models import FoodEntry
from unittest.mock import patch


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
        """
        Test that a valid food_name returns a recipe.
        """
        response = self.client.get(reverse("suggest_recipe"), {"food_name": "chicken"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Meal", response.data)
        self.assertEqual(response.data["Meal"], "Chicken Handi")

    def test_suggest_recipe_unsuccessful(self):
        """
        Test that an unknown food_name returns a warning and 404.
        """
        response = self.client.get(
            reverse("suggest_recipe"), {"food_name": "food_not_in_db"}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("warning", response.data)
        self.assertEqual(
            response.data["warning"], "No recipe found for the given food name."
        )

class RandomMealTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('random-meal')

    @patch('requests.get')
    def test_successful_random_meal(self, mock_get):
        """Test that a successful API call returns a random meal with all required fields."""
        # Mock successful API response
        mock_response = {
            "meals": [{
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
                "strMeasure2": "1/2 cup"
            }]
        }
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all required fields are present
        self.assertIn('id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('category', response.data)
        self.assertIn('area', response.data)
        self.assertIn('instructions', response.data)
        self.assertIn('image', response.data)
        self.assertIn('tags', response.data)
        self.assertIn('youtube', response.data)
        self.assertIn('ingredients', response.data)
        
        # Verify the data matches our mock
        self.assertEqual(response.data['id'], "52772")
        self.assertEqual(response.data['name'], "Teriyaki Chicken Casserole")
        self.assertEqual(len(response.data['ingredients']), 2)

    @patch('requests.get')
    def test_empty_meals_response(self, mock_get):
        """Test that an empty meals response returns appropriate error."""
        # Mock empty meals response
        mock_response = {"meals": None}
        mock_get.return_value.json.return_value = mock_response
        mock_get.return_value.status_code = 200

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('warning', response.data)
        self.assertIn('results', response.data)

    @patch('requests.get')
    def test_api_error(self, mock_get):
        """Test that API errors are handled properly."""
        # Mock API error
        mock_get.side_effect = Exception("API Error")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.conf import settings
from foods.models import FoodEntry


class FoodCatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create sample FoodEntry objects
        for i in range(15):
            FoodEntry.objects.create(
                name=f"Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                allergens=[],
                dietaryOptions=[],
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image{i}.jpg",
            )
        # Create 2 FoodEntry objects with category "Fruit"
        for i in range(2):
            FoodEntry.objects.create(
                name=f"Fruit Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                allergens=[],
                dietaryOptions=[],
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image_fruit_{i}.jpg",
                category="Fruit",
            )
        # Create 13 FoodEntry objects with category "Vegetable"
        for i in range(13):
            FoodEntry.objects.create(
                name=f"Vegetable Food {i}",
                servingSize=100,
                caloriesPerServing=100,
                proteinContent=10,
                fatContent=5,
                carbohydrateContent=20,
                allergens=[],
                dietaryOptions=[],
                nutritionScore=5.0,
                imageUrl=f"http://example.com/image_veg_{i}.jpg",
                category="Vegetable",
            )

    def test_successful_query(self):
        """
        Test that a valid query returns the correct status and data.
        """
        response = self.client.get(reverse("get_foods"), {"page": 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data), 4
        )  # (count, next, previous, results) // no warnings since query is valid

    def test_default_limit(self):
        """
        Test that the default limit (10) is applied when no 'limit' is provided.
        """
        response = self.client.get(reverse("get_foods"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data["results"]), settings.REST_FRAMEWORK["PAGE_SIZE"]
        )  # Updated to match actual default limit

    def test_category_filtering(self):
        """
        Test that filtering by category returns only foods in that category.
        """
        response = self.client.get(reverse("get_foods"), {"category": "Fruit"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        for food in response.data["results"]:
            self.assertEqual(food["category"], "Fruit")

    def test_case_insensitive_category_filtering(self):
        """
        Test that category filtering is case-insensitive.
        """
        # Test with lowercase
        response_lower = self.client.get(reverse("get_foods"), {"category": "fruit"})
        self.assertEqual(response_lower.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_lower.data), 4)

        # Test with uppercase
        response_upper = self.client.get(reverse("get_foods"), {"category": "FRUIT"})
        self.assertEqual(response_upper.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_upper.data), 4)

        # Test with mixed case
        response_mixed = self.client.get(reverse("get_foods"), {"category": "FrUiT"})
        self.assertEqual(response_mixed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_mixed.data), 4)

    def test_nonexistent_category(self):
        """
        Test that filtering by a nonexistent category returns an empty list.
        """
        response = self.client.get(
            reverse("get_foods"), {"category": "NonexistentCategory"}
        )
        self.assertEqual(response.status_code, status.HTTP_206_PARTIAL_CONTENT)
        self.assertEqual(
            response.data["warning"],
            "Some categories are not available: nonexistentcategory",
        )


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

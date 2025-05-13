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
        # Check that the total count matches the number of Fruit entries in the DB
        # self.assertEqual(response.data["count"], 2)
        # # Check that the number of results on this page is at most the total count
        self.assertLessEqual(len(response.data["results"]), 2)

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
        self.assertEqual(response.status_code, status.HTTP_206_PARTIAL_CONTENT)
        self.assertEqual(
            response.data["warning"],
            "Some categories are not available: nonexistentcategory",
        )

    def test_search_returns_successful(self):
        response = self.client.get(reverse("get_foods"), {"search": "frUit"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any("Fruit" in food["name"] for food in response.data.get("results", []))
        )

    def test_no_search_result(self):
        response = self.client.get(reverse("get_foods"), {"search": "nonexistentfood"})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(response.data.get("results", [])), 0)

    def test_search_with_category(self):
        response = self.client.get(
            reverse("get_foods"), {"search": "Food 1", "category": "Fruit"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertTrue(all(food["category"] == "Fruit" for food in results))
        self.assertTrue(any("Fruit Food" in food["name"] for food in results))

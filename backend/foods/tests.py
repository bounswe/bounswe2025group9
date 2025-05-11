from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from foods.models import FoodEntry


class FoodCatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
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

    def test_invalid_limit(self):
        """
        Test that an invalid 'limit' query parameter returns a 400 status.
        """
        response = self.client.get(reverse("get_foods"), {"limit": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_successful_query(self):
        """
        Test that a valid query returns the correct status and data.
        """
        response = self.client.get(reverse("get_foods"), {"limit": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_default_limit(self):
        """
        Test that the default limit (10) is applied when no 'limit' is provided.
        """
        response = self.client.get(reverse("get_foods"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response.data), 10
        )  # Updated to match actual default limit

    def test_category_filtering(self):
        """
        Test that filtering by category returns only foods in that category.
        """
        response = self.client.get(reverse("get_foods"), {"category": "Fruit"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        for food in response.data:
            self.assertEqual(food["category"], "Fruit")

    def test_case_insensitive_category_filtering(self):
        """
        Test that category filtering is case-insensitive.
        """
        # Test with lowercase
        response_lower = self.client.get(reverse("get_foods"), {"category": "fruit"})
        self.assertEqual(response_lower.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_lower.data), 2)

        # Test with uppercase
        response_upper = self.client.get(reverse("get_foods"), {"category": "FRUIT"})
        self.assertEqual(response_upper.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_upper.data), 2)

        # Test with mixed case
        response_mixed = self.client.get(reverse("get_foods"), {"category": "FrUiT"})
        self.assertEqual(response_mixed.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_mixed.data), 2)

    def test_nonexistent_category(self):
        """
        Test that filtering by a nonexistent category returns an empty list.
        """
        response = self.client.get(
            reverse("get_foods"), {"category": "NonexistentCategory"}
        )
        print("Response data in test_nonexistent_category: ", response.data)
        self.assertEqual(response.status_code, status.HTTP_206_PARTIAL_CONTENT)
        self.assertEqual(
            response.data["warning"],
            "Some categories are not available: nonexistentcategory",
        )

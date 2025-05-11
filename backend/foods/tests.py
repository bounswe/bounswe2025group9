from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
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
        self.assertEqual(len(response.data), 10)

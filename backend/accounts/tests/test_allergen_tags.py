from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Allergen

User = get_user_model()


class AllergenEndpointsTests(APITestCase):
    """Tests for allergen-related endpoints"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            name="Test",
            surname="User",
        )
        self.token_url = reverse("token_obtain_pair")
        self.allergen_add_url = reverse("add-allergen")
        self.allergen_set_url = reverse("set-allergens")
        self.common_allergens_url = reverse("list-allergens")

        # Create some test allergens
        self.allergen1 = Allergen.objects.create(name="Peanuts", common=True)
        self.allergen2 = Allergen.objects.create(name="Shellfish", common=True)
        self.allergen3 = Allergen.objects.create(name="Rare Allergen", common=False)

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def test_add_allergen_authenticated(self):
        """Test creating a new allergen when authenticated"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = {"name": "Soy", "common": False}
        response = self.client.post(self.allergen_add_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Soy")
        self.assertFalse(response.data["common"])
        self.assertTrue(Allergen.objects.filter(name="Soy").exists())

    def test_add_allergen_unauthenticated(self):
        """Test that unauthenticated users cannot add allergens"""
        data = {"name": "Soy", "common": False}
        response = self.client.post(self.allergen_add_url, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_allergen_invalid_data(self):
        """Test adding allergen with invalid data"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = {}  # Missing required 'name' field
        response = self.client.post(self.allergen_add_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_set_allergens_by_id(self):
        """Test setting user allergens using existing allergen IDs"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = [{"id": self.allergen1.id}, {"id": self.allergen2.id}]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)

        # Verify user has these allergens
        self.user.refresh_from_db()
        user_allergen_ids = set(self.user.allergens.values_list("id", flat=True))
        self.assertIn(self.allergen1.id, user_allergen_ids)
        self.assertIn(self.allergen2.id, user_allergen_ids)

    def test_set_allergens_by_name(self):
        """Test setting allergens by creating new ones with names"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = [
            {"name": "New Allergen 1", "common": False},
            {"name": "New Allergen 2", "common": True},
        ]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)

        # Verify allergens were created
        self.assertTrue(Allergen.objects.filter(name="New Allergen 1").exists())
        self.assertTrue(Allergen.objects.filter(name="New Allergen 2").exists())

    def test_set_allergens_mixed(self):
        """Test setting allergens with both IDs and new names"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = [
            {"id": self.allergen1.id},
            {"name": "Brand New Allergen", "common": False},
        ]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)

    def test_set_allergens_replaces_existing(self):
        """Test that setting allergens replaces previous ones"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Set initial allergens
        self.user.allergens.add(self.allergen1)
        self.assertEqual(self.user.allergens.count(), 1)

        # Replace with new allergen
        data = [{"id": self.allergen2.id}]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.allergens.count(), 1)
        self.assertEqual(self.user.allergens.first().id, self.allergen2.id)

    def test_set_allergens_invalid_format(self):
        """Test that non-list data returns error"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = {"id": self.allergen1.id}  # Should be a list
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_set_allergens_nonexistent_id(self):
        """Test setting allergen with non-existent ID (should skip it)"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        data = [
            {"id": 99999},  # Non-existent ID
            {"id": self.allergen1.id},  # Valid ID
        ]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should only have the valid allergen
        self.assertEqual(len(response.data), 1)

    def test_set_allergens_unauthenticated(self):
        """Test that unauthenticated users cannot set allergens"""
        data = [{"id": self.allergen1.id}]
        response = self.client.post(self.allergen_set_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_common_allergens(self):
        """Test retrieving list of common allergens without authentication"""
        response = self.client.get(self.common_allergens_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

        # Should only return common allergens
        common_allergen_names = [a["name"] for a in response.data]
        self.assertIn("Peanuts", common_allergen_names)
        self.assertIn("Shellfish", common_allergen_names)
        self.assertNotIn("Rare Allergen", common_allergen_names)

    def test_get_common_allergens_authenticated(self):
        """Test that authenticated users can also get common allergens"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.common_allergens_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

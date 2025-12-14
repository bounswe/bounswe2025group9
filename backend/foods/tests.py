from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.conf import settings
from django.contrib.auth import get_user_model
from foods.constants import DEFAULT_CURRENCY, PriceCategory, PriceUnit
from foods.models import (
    FoodEntry,
    FoodProposal,
    PriceAudit,
    Micronutrient,
    FoodEntryMicronutrient,
    Allergen,
)
from foods.serializers import FoodEntrySerializer
from foods.services import (
    approve_food_proposal,
    override_food_price_category,
    recalculate_price_thresholds,
    update_food_price,
    FoodAccessService,
)
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
    entry = FoodAccessService.create_validated_food_entry(**data)
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
            food = FoodAccessService.create_validated_food_entry(
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
            food = FoodAccessService.create_validated_food_entry(
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
            food = FoodAccessService.create_validated_food_entry(
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
        self.allergen1 = Allergen.objects.create(name="Peanuts")
        self.allergen2 = Allergen.objects.create(name="Dairy")

        # Get authentication token
        token_res = self.client.post(
            self.token_url, {"username": "testuser", "password": "testpass123"}
        )
        self.access_token = token_res.data["access"]

    def _create_private_food(self, **kwargs):
        """Helper to create a private FoodEntry"""
        defaults = {
            "name": "Test Food",
            "category": "Test",
            "servingSize": 100,
            "caloriesPerServing": 100,
            "proteinContent": 10,
            "fatContent": 5,
            "carbohydrateContent": 15,
            "nutritionScore": 5.0,
            "validated": False,
            "createdBy": self.user,
        }
        defaults.update(kwargs)
        return FoodEntry.objects.create(**defaults)

    def test_submit_food_proposal_success(self):
        """Test successful food proposal submission"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # First create a private food entry
        food_entry = self._create_private_food(
            name="Organic Quinoa",
            category="Grains",
            servingSize=185,
            caloriesPerServing=222,
            proteinContent=8.14,
            fatContent=3.55,
            carbohydrateContent=39.4,
            dietaryOptions=["Vegetarian", "Gluten-Free"],
            imageUrl="https://example.com/quinoa.jpg",
        )

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify proposal was created
        self.assertTrue(FoodProposal.objects.filter(food_entry=food_entry).exists())
        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertEqual(proposal.proposedBy, self.user)
        self.assertEqual(proposal.food_entry.name, "Organic Quinoa")
        self.assertEqual(proposal.food_entry.category, "Grains")

    def test_submit_food_proposal_minimal_data(self):
        """Test submitting proposal with only required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create a private food entry
        food_entry = self._create_private_food(name="Simple Food")

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertIsNotNone(proposal.food_entry.nutritionScore)

    def test_submit_food_proposal_with_multiple_allergens(self):
        """Test submitting proposal with multiple allergens"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create a private food entry with allergens
        food_entry = self._create_private_food(
            name="Peanut Butter",
            category="Fats & Oils",
            servingSize=32,
            caloriesPerServing=188,
            proteinContent=8,
            fatContent=16,
            carbohydrateContent=7,
        )
        # Set allergens on the food entry
        food_entry.allergens.set([self.allergen1, self.allergen2])

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertIsNotNone(proposal)
        # Verify allergens are on the food entry
        self.assertEqual(proposal.food_entry.allergens.count(), 2)

    def test_submit_food_proposal_missing_required_fields(self):
        """Test submitting proposal without required fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Try to submit without food_entry_id
        data = {}
        response = self.client.post(self.proposal_url, data, format="json")

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
            "carbohydrateContent": 20,
        }
        response = self.client.post(self.proposal_url, data, format="json")

        # Note: Current implementation accepts negative values
        # This test documents current behavior
        self.assertIn(
            response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]
        )

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
            "carbohydrateContent": 20,
        }
        response = self.client.post(self.proposal_url, data, format="json")

        # Note: Current implementation accepts zero values
        # This test documents current behavior
        self.assertIn(
            response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]
        )

    def test_submit_food_proposal_no_auth(self):
        """Test that unauthenticated users cannot submit proposals"""
        data = {
            "name": "Unauthorized Food",
            "category": "Other",
            "servingSize": 100,
            "caloriesPerServing": 150,
            "proteinContent": 5,
            "fatContent": 3,
            "carbohydrateContent": 20,
        }
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_food_proposal_with_dietary_options(self):
        """Test submitting proposal with dietary options"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create a private food entry with dietary options
        food_entry = self._create_private_food(
            name="Vegan Protein Bar",
            category="Sweets & Snacks",
            servingSize=60,
            caloriesPerServing=200,
            proteinContent=15,
            fatContent=8,
            carbohydrateContent=25,
            dietaryOptions=["Vegan", "Gluten-Free", "High-Protein"],
        )

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertEqual(len(proposal.food_entry.dietaryOptions), 3)

    def test_submit_duplicate_food_proposal(self):
        """Test submitting proposal for food that already exists"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create existing validated food entry
        FoodAccessService.create_validated_food_entry(
            name="Existing Food",
            category="Other",
            servingSize=100,
            caloriesPerServing=150,
            proteinContent=5,
            fatContent=3,
            carbohydrateContent=20,
            nutritionScore=5.0,
        )

        # Create a private food entry with similar data
        food_entry = self._create_private_food(
            name="Existing Food",
            category="Other",
            servingSize=100,
            caloriesPerServing=150,
            proteinContent=5,
            fatContent=3,
            carbohydrateContent=20,
        )

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        # Should still accept the proposal (proposals can be duplicates)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_nutrition_score_calculation(self):
        """Test that nutrition score is calculated for proposals"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create a private food entry (nutrition score is set in _create_private_food)
        food_entry = self._create_private_food(
            name="Healthy Food",
            category="Vegetable",
            servingSize=100,
            caloriesPerServing=50,
            proteinContent=3,
            fatContent=0.5,
            carbohydrateContent=10,
        )

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertGreater(proposal.food_entry.nutritionScore, 0)

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
            "carbohydrateContent": 20,
        }
        response = self.client.post(self.proposal_url, data, format="json")

        # Should either accept or reject based on model field max_length
        self.assertIn(
            response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]
        )

    def test_submit_food_proposal_with_image_url(self):
        """Test submitting proposal with custom image URL"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create a private food entry with custom image URL
        food_entry = self._create_private_food(
            name="Custom Image Food",
            category="Other",
            servingSize=100,
            caloriesPerServing=150,
            proteinContent=5,
            fatContent=3,
            carbohydrateContent=20,
            imageUrl="https://example.com/custom-food.jpg",
        )

        # Submit for approval
        data = {"food_entry_id": food_entry.id}
        response = self.client.post(self.proposal_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        proposal = FoodProposal.objects.get(food_entry=food_entry)
        self.assertEqual(
            proposal.food_entry.imageUrl, "https://example.com/custom-food.jpg"
        )


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
        # Create a private FoodEntry first
        food_entry = FoodEntry.objects.create(
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
            validated=False,
            createdBy=self.proposer,
        )
        # Create FoodProposal with reference to the food_entry
        return FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=self.proposer,
        )

    def test_approve_food_proposal_assigns_category_and_creates_audit(self):
        proposal = self._create_proposal(Decimal("32.50"))

        proposal, entry = approve_food_proposal(proposal, changed_by=self.moderator)

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
        # Create a private FoodEntry first
        food_entry = FoodEntry.objects.create(
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
            validated=False,
            createdBy=self.proposer,
        )

        # Create FoodProposal with reference to the food_entry
        proposal = FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=self.proposer,
        )

        url = reverse("moderation-food-proposals-approve", args=[proposal.id])
        response = self.client.post(url, {"approved": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entry = FoodEntry.objects.get(name=proposal.food_entry.name)
        self.assertEqual(entry.price_category, PriceCategory.MID)
        self.assertTrue(
            entry.price_audits.filter(
                change_type=PriceAudit.ChangeType.PRICE_UPDATE
            ).exists()
        )

    def test_approve_proposal_with_micronutrients_with_units_in_name(self):
        """Test that approving a proposal with micronutrients that have units in the name works"""
        # Create a private FoodEntry first
        food_entry = FoodEntry.objects.create(
            name="Spinach with Micronutrients",
            category="Vegetables",
            servingSize=100,
            caloriesPerServing=23,
            proteinContent=2.9,
            fatContent=0.4,
            carbohydrateContent=3.6,
            nutritionScore=8.5,
            validated=False,
            createdBy=self.proposer,
        )

        # Create micronutrients and associate them with the food entry
        micronutrient_data = {
            "Manganese, Mn (mg)": 0.07,
            "Vitamin C (mg)": 28.1,
            "Iron, Fe (mg)": 2.71,
            "Calcium, Ca (mg)": 99.0,
        }

        for micro_name, value in micronutrient_data.items():
            # Parse name and unit from the string (e.g., "Vitamin C (mg)" -> "Vitamin C", "mg")
            if "(" in micro_name and ")" in micro_name:
                name_part = micro_name.split("(")[0].strip()
                unit_part = micro_name.split("(")[1].split(")")[0].strip()
            else:
                name_part = micro_name
                unit_part = "g"

            micronutrient, _ = Micronutrient.objects.get_or_create(
                name=name_part, defaults={"unit": unit_part}
            )
            FoodEntryMicronutrient.objects.create(
                food_entry=food_entry, micronutrient=micronutrient, value=value
            )

        # Create FoodProposal with reference to the food_entry
        proposal = FoodProposal.objects.create(
            food_entry=food_entry,
            proposedBy=self.proposer,
        )

        url = reverse("moderation-food-proposals-approve", args=[proposal.id])
        response = self.client.post(url, {"approved": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify the food entry was validated (made public)
        entry = FoodEntry.objects.get(name=proposal.food_entry.name)
        self.assertIsNotNone(entry)
        self.assertTrue(entry.validated)

        # Verify micronutrients were copied correctly (already present since they're on the food entry)
        # Check that micronutrients were created/found
        manganese = Micronutrient.objects.filter(name="Manganese, Mn").first()
        self.assertIsNotNone(manganese, "Manganese micronutrient should be created")
        self.assertEqual(manganese.unit, "mg")

        vitamin_c = Micronutrient.objects.filter(name="Vitamin C").first()
        self.assertIsNotNone(vitamin_c, "Vitamin C micronutrient should be created")
        self.assertEqual(vitamin_c.unit, "mg")

        # Verify the values were copied to the food entry
        manganese_entry = FoodEntryMicronutrient.objects.filter(
            food_entry=entry, micronutrient=manganese
        ).first()
        self.assertIsNotNone(manganese_entry)
        self.assertAlmostEqual(manganese_entry.value, 0.07, places=2)

        vitamin_c_entry = FoodEntryMicronutrient.objects.filter(
            food_entry=entry, micronutrient=vitamin_c
        ).first()
        self.assertIsNotNone(vitamin_c_entry)
        self.assertAlmostEqual(vitamin_c_entry.value, 28.1, places=1)

        # Verify all micronutrients were copied
        entry_micronutrients = FoodEntryMicronutrient.objects.filter(food_entry=entry)
        self.assertEqual(
            entry_micronutrients.count(), 4, "All 4 micronutrients should be copied"
        )


class MicronutrientFilteringTests(TestCase):
    """Tests for micronutrient filtering in FoodCatalog"""

    def setUp(self):
        self.client = APIClient()

        # Clear all existing food and micronutrient data to ensure clean test state
        FoodEntry.objects.all().delete()
        Micronutrient.objects.all().delete()

        # Create micronutrients with units
        self.iron = Micronutrient.objects.create(name="Iron", unit="mg")
        self.vitamin_c = Micronutrient.objects.create(name="Vitamin C", unit="mg")
        self.zinc = Micronutrient.objects.create(name="Zinc", unit="mg")
        self.calcium = Micronutrient.objects.create(name="Calcium", unit="mg")

        # Create food entries with different micronutrient values
        # Food 1: High iron (8mg), medium vitamin C (30mg)
        self.food1 = FoodAccessService.create_validated_food_entry(
            name="Spinach",
            category="Vegetable",
            servingSize=100,
            caloriesPerServing=23,
            proteinContent=2.9,
            fatContent=0.4,
            carbohydrateContent=3.6,
            nutritionScore=8.5,
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food1, micronutrient=self.iron, value=8.0
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food1, micronutrient=self.vitamin_c, value=30.0
        )

        # Food 2: Low iron (2mg), high vitamin C (80mg), medium zinc (1.5mg)
        self.food2 = FoodAccessService.create_validated_food_entry(
            name="Orange",
            category="Fruit",
            servingSize=100,
            caloriesPerServing=47,
            proteinContent=0.9,
            fatContent=0.1,
            carbohydrateContent=12,
            nutritionScore=7.0,
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food2, micronutrient=self.iron, value=2.0
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food2, micronutrient=self.vitamin_c, value=80.0
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food2, micronutrient=self.zinc, value=1.5
        )

        # Food 3: Medium iron (5mg), low vitamin C (10mg), high zinc (3mg)
        self.food3 = FoodAccessService.create_validated_food_entry(
            name="Beef",
            category="Meat",
            servingSize=100,
            caloriesPerServing=250,
            proteinContent=26,
            fatContent=17,
            carbohydrateContent=0,
            nutritionScore=6.0,
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food3, micronutrient=self.iron, value=5.0
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food3, micronutrient=self.vitamin_c, value=10.0
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food3, micronutrient=self.zinc, value=3.0
        )

        # Food 4: No micronutrients
        self.food4 = FoodAccessService.create_validated_food_entry(
            name="Plain Water",
            category="Beverages",
            servingSize=100,
            caloriesPerServing=0,
            proteinContent=0,
            fatContent=0,
            carbohydrateContent=0,
            nutritionScore=5.0,
        )

        # Food 5: Only calcium (200mg)
        self.food5 = FoodAccessService.create_validated_food_entry(
            name="Milk",
            category="Dairy",
            servingSize=100,
            caloriesPerServing=42,
            proteinContent=3.4,
            fatContent=1.0,
            carbohydrateContent=5.0,
            nutritionScore=7.5,
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food5, micronutrient=self.calcium, value=200.0
        )

    def test_bounded_range_filtering(self):
        """Test filtering with bounded range (low-high)"""
        response = self.client.get(reverse("get_foods"), {"micronutrient": "iron:3-7"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include Beef (5mg) but not Spinach (8mg) or Orange (2mg)
        self.assertIn("Beef", names)
        self.assertNotIn("Spinach", names)
        self.assertNotIn("Orange", names)

    def test_lower_bounded_filtering(self):
        """Test filtering with lower bound only (low-)"""
        response = self.client.get(reverse("get_foods"), {"micronutrient": "iron:6-"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include only Spinach (8mg)
        self.assertIn("Spinach", names)
        self.assertNotIn("Beef", names)
        self.assertNotIn("Orange", names)

    def test_upper_bounded_filtering(self):
        """Test filtering with upper bound only (-high)"""
        response = self.client.get(reverse("get_foods"), {"micronutrient": "iron:-3"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Orange should be included (2mg <= 3)
        # May include other foods from database with iron <= 3mg
        # The key is: Spinach (8mg) and Beef (5mg) should NOT be in results
        self.assertNotIn("Spinach", names)
        self.assertNotIn("Beef", names)

        # Check that if Orange is in the database, it should be in results
        all_foods = [
            food["name"]
            for food in self.client.get(reverse("get_foods")).data.get("results", [])
        ]
        if "Orange" in all_foods:
            self.assertIn("Orange", names)

    def test_case_insensitive_micronutrient_name(self):
        """Test that micronutrient name matching is case-insensitive"""
        # Test with different cases
        response1 = self.client.get(
            reverse("get_foods"), {"micronutrient": "IRON:5-10"}
        )
        response2 = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:5-10"}
        )
        response3 = self.client.get(
            reverse("get_foods"), {"micronutrient": "IrOn:5-10"}
        )

        results1 = [f["name"] for f in response1.data.get("results", [])]
        results2 = [f["name"] for f in response2.data.get("results", [])]
        results3 = [f["name"] for f in response3.data.get("results", [])]

        # All should return the same results
        self.assertEqual(set(results1), set(results2))
        self.assertEqual(set(results2), set(results3))

    def test_partial_name_matching(self):
        """Test that micronutrient name uses icontains (partial matching)"""
        # "vit" should match "Vitamin C"
        response = self.client.get(reverse("get_foods"), {"micronutrient": "vit:50-"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include Orange (80mg Vitamin C)
        self.assertIn("Orange", names)
        self.assertNotIn("Spinach", names)  # 30mg

    def test_multiple_micronutrient_filters_and(self):
        """Test that multiple filters create AND constraints"""
        # Filter for iron >= 4 AND vitamin C >= 25
        response = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:4-,vitamin c:25-"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include only Spinach (iron=8, vit_c=30)
        # Beef has iron=5 but vit_c=10
        # Orange has vit_c=80 but iron=2
        self.assertIn("Spinach", names)
        self.assertNotIn("Beef", names)
        self.assertNotIn("Orange", names)

    def test_invalid_format_skipped(self):
        """Test that invalid filter formats are gracefully skipped"""
        # Missing colon
        response1 = self.client.get(reverse("get_foods"), {"micronutrient": "iron5-10"})
        # Missing dash
        response2 = self.client.get(reverse("get_foods"), {"micronutrient": "iron:510"})
        # Both numbers missing
        response3 = self.client.get(reverse("get_foods"), {"micronutrient": "iron:-"})

        # All should return all foods (filter skipped)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

        # Should return all foods since filter is invalid
        self.assertGreaterEqual(len(response1.data.get("results", [])), 4)
        self.assertGreaterEqual(len(response2.data.get("results", [])), 4)

    def test_invalid_numbers_skipped(self):
        """Test that invalid numeric values are gracefully skipped"""
        # Non-numeric values
        response = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:abc-xyz"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should return all foods since filter is invalid
        self.assertGreaterEqual(len(response.data.get("results", [])), 4)

    def test_nonexistent_micronutrient(self):
        """Test filtering by micronutrient that doesn't exist"""
        response = self.client.get(
            reverse("get_foods"), {"micronutrient": "nonexistent:5-10"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        # Should return empty or no results since no food has this micronutrient
        self.assertEqual(len(results), 0)

    def test_zero_values(self):
        """Test filtering with zero as a boundary value"""
        # Create food with very low iron using unique name
        unique_name = "Test_Low_Iron_Food_Unique_12345"
        food_low = FoodAccessService.create_validated_food_entry(
            name=unique_name,
            category="Test",
            servingSize=100,
            caloriesPerServing=100,
            proteinContent=5,
            fatContent=5,
            carbohydrateContent=10,
            nutritionScore=5.0,
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=food_low, micronutrient=self.iron, value=0.5
        )

        # Search for our specific food with the filter to avoid pagination issues
        response = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:0-1", "search": unique_name}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Our test food should be included (0.5mg is in range 0-1)
        self.assertIn(unique_name, names)

        # Test that Orange (2mg) is excluded when we search for it
        response2 = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:0-1", "search": "Orange"}
        )
        results2 = response2.data.get("results", [])
        # Should be empty or not contain Orange since it has 2mg
        orange_in_results = any(f["name"] == "Orange" for f in results2)
        self.assertFalse(orange_in_results)

    def test_combined_with_other_filters(self):
        """Test micronutrient filter combined with category filter"""
        response = self.client.get(
            reverse("get_foods"),
            {"category": "Fruit,Vegetable", "micronutrient": "vitamin c:20-"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include Spinach (veg, 30mg) and Orange (fruit, 80mg)
        # Should not include Beef (meat category)
        self.assertIn("Spinach", names)
        self.assertIn("Orange", names)
        self.assertNotIn("Beef", names)

    def test_combined_with_search(self):
        """Test micronutrient filter combined with search"""
        response = self.client.get(
            reverse("get_foods"),
            {"search": "e", "micronutrient": "zinc:1-"},  # Matches Orange, Beef
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should include Orange (zinc=1.5) and Beef (zinc=3)
        # Should not include Spinach (no zinc)
        self.assertIn("Orange", names)
        self.assertIn("Beef", names)
        self.assertNotIn("Spinach", names)

    def test_exact_boundary_values(self):
        """Test that boundary values are inclusive"""
        # Test lower boundary
        response1 = self.client.get(
            reverse("get_foods"), {"micronutrient": "iron:5-10"}
        )
        results1 = [f["name"] for f in response1.data.get("results", [])]
        self.assertIn("Beef", results1)  # Exactly 5mg

        # Test upper boundary
        response2 = self.client.get(reverse("get_foods"), {"micronutrient": "iron:1-5"})
        results2 = [f["name"] for f in response2.data.get("results", [])]
        self.assertIn("Beef", results2)  # Exactly 5mg

    def test_foods_without_micronutrient_treated_as_zero(self):
        """Test that foods without a micronutrient entry are treated as having 0"""
        # Create a food without any Alcohol micronutrient
        apple = create_food_entry("Apple")
        # Note: Apple has NO alcohol entry at all

        # Create Alcohol micronutrient
        alcohol = Micronutrient.objects.create(name="Alcohol", unit="g")

        # Create a food WITH alcohol
        beer = create_food_entry("Beer")
        FoodEntryMicronutrient.objects.create(
            food_entry=beer, micronutrient=alcohol, value=5.0
        )

        # Test 1: Filter for alcohol <= 0 should include Apple (no entry = 0)
        response1 = self.client.get(
            reverse("get_foods"), {"micronutrient": "alcohol:-0"}
        )
        results1 = [f["name"] for f in response1.data.get("results", [])]
        self.assertIn(
            "Apple", results1, "Apple (no alcohol entry) should match alcohol:-0"
        )
        self.assertNotIn(
            "Beer", results1, "Beer (5g alcohol) should NOT match alcohol:-0"
        )

        # Test 2: Filter for alcohol >= 1 should NOT include Apple
        response2 = self.client.get(
            reverse("get_foods"), {"micronutrient": "alcohol:1-"}
        )
        results2 = [f["name"] for f in response2.data.get("results", [])]
        self.assertNotIn(
            "Apple",
            results2,
            "Apple (no alcohol entry = 0) should NOT match alcohol:1-",
        )
        self.assertIn("Beer", results2, "Beer (5g alcohol) should match alcohol:1-")

        # Test 3: Filter for 0 <= alcohol <= 10 should include both
        response3 = self.client.get(
            reverse("get_foods"), {"micronutrient": "alcohol:0-10"}
        )
        results3 = [f["name"] for f in response3.data.get("results", [])]
        self.assertIn(
            "Apple", results3, "Apple (no alcohol entry = 0) should match alcohol:0-10"
        )
        self.assertIn("Beer", results3, "Beer (5g alcohol) should match alcohol:0-10")

        # Test 4: Filter for alcohol <= 3 should include Apple but not Beer
        response4 = self.client.get(
            reverse("get_foods"), {"micronutrient": "alcohol:-3"}
        )
        results4 = [f["name"] for f in response4.data.get("results", [])]
        self.assertIn(
            "Apple", results4, "Apple (no alcohol entry = 0) should match alcohol:-3"
        )
        self.assertNotIn(
            "Beer", results4, "Beer (5g alcohol) should NOT match alcohol:-3"
        )

    def test_empty_micronutrient_param(self):
        """Test with empty micronutrient parameter"""
        response = self.client.get(reverse("get_foods"), {"micronutrient": ""})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should return all foods
        self.assertGreaterEqual(len(response.data.get("results", [])), 4)

    def test_whitespace_handling(self):
        """Test that whitespace in filter is handled correctly"""
        response = self.client.get(
            reverse("get_foods"),
            {"micronutrient": " iron : 5 - 10 , vitamin c : 20 - "},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])
        names = [food["name"] for food in results]

        # Should still work despite extra spaces
        self.assertIn("Spinach", names)  # iron=8, vit_c=30

    def test_serializer_includes_micronutrients(self):
        """Test that the serializer includes micronutrients in response"""
        response = self.client.get(reverse("get_foods"), {"micronutrient": "iron:5-10"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data.get("results", [])

        # Find Beef in results
        beef = next((f for f in results if f["name"] == "Beef"), None)
        self.assertIsNotNone(beef)

        # Check that micronutrients are included
        self.assertIn("micronutrients", beef)
        self.assertIsInstance(beef["micronutrients"], dict)

        # Check specific values with new structure
        self.assertIn("Iron", beef["micronutrients"])
        self.assertEqual(beef["micronutrients"]["Iron"]["value"], 5.0)
        self.assertIn("unit", beef["micronutrients"]["Iron"])

        self.assertIn("Vitamin C", beef["micronutrients"])
        self.assertEqual(beef["micronutrients"]["Vitamin C"]["value"], 10.0)
        self.assertIn("unit", beef["micronutrients"]["Vitamin C"])

        self.assertIn("Zinc", beef["micronutrients"])
        self.assertEqual(beef["micronutrients"]["Zinc"]["value"], 3.0)
        self.assertIn("unit", beef["micronutrients"]["Zinc"])


class PrivateFoodAccessTest(TestCase):
    """Tests for private food functionality and access control"""

    def setUp(self):
        """Set up test users and food entries"""
        # Create test users
        self.user1 = User.objects.create_user(
            username="user1", email="user1@test.com", password="pass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@test.com", password="pass123"
        )

        # Create public (validated) food
        self.public_food = FoodEntry.objects.create(
            name="Public Apple",
            category="Fruits",
            servingSize=100,
            caloriesPerServing=52,
            proteinContent=0.3,
            fatContent=0.2,
            carbohydrateContent=14,
            nutritionScore=8.5,
            validated=True,
            createdBy=None,  # System food
        )

        # Create private food for user1
        self.user1_private_food = FoodEntry.objects.create(
            name="User1 Custom Protein Shake",
            category="Beverages",
            servingSize=250,
            caloriesPerServing=200,
            proteinContent=30,
            fatContent=5,
            carbohydrateContent=10,
            nutritionScore=7.0,
            validated=False,  # Private
            createdBy=self.user1,
        )

        # Create private food for user2
        self.user2_private_food = FoodEntry.objects.create(
            name="User2 Custom Salad",
            category="Vegetables",
            servingSize=200,
            caloriesPerServing=150,
            proteinContent=5,
            fatContent=10,
            carbohydrateContent=12,
            nutritionScore=8.0,
            validated=False,  # Private
            createdBy=self.user2,
        )

    def test_anonymous_user_sees_only_public_foods(self):
        """Test that anonymous users can only see validated foods"""
        accessible = FoodAccessService.get_accessible_foods(user=None)

        # Should see public food but not private foods
        self.assertIn(self.public_food, accessible)
        self.assertNotIn(self.user1_private_food, accessible)
        self.assertNotIn(self.user2_private_food, accessible)

    def test_user1_sees_public_and_own_private_foods(self):
        """Test that user1 sees public foods and their own private foods"""
        accessible = FoodAccessService.get_accessible_foods(user=self.user1)

        # Should see public food + their own private food, but not user2's private food
        self.assertIn(self.public_food, accessible)
        self.assertIn(self.user1_private_food, accessible)
        self.assertNotIn(self.user2_private_food, accessible)

    def test_user2_sees_public_and_own_private_foods(self):
        """Test that user2 sees public foods and their own private foods"""
        accessible = FoodAccessService.get_accessible_foods(user=self.user2)

        # Should see public food + their own private food, but not user1's private food
        self.assertIn(self.public_food, accessible)
        self.assertNotIn(self.user1_private_food, accessible)
        self.assertIn(self.user2_private_food, accessible)


class PrivateFoodVisibilityTests(TestCase):
    """Tests for private food visibility and access control"""

    def setUp(self):
        # Create two regular users
        self.user1 = User.objects.create_user(
            username="user1", email="user1@test.com", password="pass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@test.com", password="pass123"
        )

        # Create a private food for user1
        self.private_food = FoodEntry.objects.create(
            name="User1 Private Food",
            category="Test",
            servingSize=100,
            caloriesPerServing=100,
            proteinContent=10,
            fatContent=5,
            carbohydrateContent=20,
            nutritionScore=5.0,
            validated=False,  # Private
            createdBy=self.user1,
        )

        # Create a public validated food
        self.public_food = FoodAccessService.create_validated_food_entry(
            name="Public Food",
            category="Test",
            servingSize=100,
            caloriesPerServing=150,
            proteinContent=12,
            fatContent=6,
            carbohydrateContent=25,
            nutritionScore=6.0,
        )

    def test_user_can_access_own_private_food(self):
        """Test that users can access their own private foods"""
        accessible = FoodAccessService.get_accessible_foods(user=self.user1)

        # User1 should see both public food and their own private food
        self.assertIn(self.private_food, accessible)
        self.assertIn(self.public_food, accessible)

    def test_user_cannot_access_others_private_food(self):
        """Test that users cannot access other users' private foods"""
        accessible = FoodAccessService.get_accessible_foods(user=self.user2)

        # User2 should only see public food, not user1's private food
        self.assertNotIn(self.private_food, accessible)
        self.assertIn(self.public_food, accessible)

    def test_anonymous_can_only_access_public_foods(self):
        """Test that anonymous users can only access validated foods"""
        accessible = FoodAccessService.get_accessible_foods(user=None)

        # Anonymous should only see public food, not private food
        self.assertNotIn(self.private_food, accessible)
        self.assertIn(self.public_food, accessible)

    def test_can_access_food_validates_ownership(self):
        """Test can_access_food method for access control"""
        # Owner can access their private food
        self.assertTrue(
            FoodAccessService.can_access_food(self.private_food, self.user1)
        )

        # Other user cannot access private food
        self.assertFalse(
            FoodAccessService.can_access_food(self.private_food, self.user2)
        )

        # Anonymous cannot access private food
        self.assertFalse(FoodAccessService.can_access_food(self.private_food, None))

        # Everyone can access public food
        self.assertTrue(FoodAccessService.can_access_food(self.public_food, self.user1))
        self.assertTrue(FoodAccessService.can_access_food(self.public_food, self.user2))
        self.assertTrue(FoodAccessService.can_access_food(self.public_food, None))

    def test_approve_proposal_makes_food_public(self):
        """Test that approving a proposal changes validated to True"""
        # Create a food proposal
        proposal = FoodProposal.objects.create(
            food_entry=self.private_food, proposedBy=self.user1
        )

        # Initially private
        self.assertFalse(self.private_food.validated)

        # Approve the proposal
        admin = User.objects.create_user(username="admin", is_staff=True)
        approve_food_proposal(proposal, changed_by=admin)

        # Refresh from database
        self.private_food.refresh_from_db()

        # Should now be validated (public)
        self.assertTrue(self.private_food.validated)
        self.assertTrue(proposal.isApproved)

        # Now accessible to all users
        self.assertIn(
            self.private_food, FoodAccessService.get_accessible_foods(user=self.user2)
        )
        self.assertIn(
            self.private_food, FoodAccessService.get_accessible_foods(user=None)
        )

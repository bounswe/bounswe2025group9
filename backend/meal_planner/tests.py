from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import NutritionTargets
from foods.models import FoodEntryMicronutrient, Micronutrient
from foods.services import FoodAccessService

from .models import DailyNutritionLog, FoodLogEntry, MealPlan
from .serializers import DailyNutritionLogSerializer


def create_user(username="alice", email="alice@example.com", password="pass12345"):
    User = get_user_model()
    return User.objects.create_user(
        username=username, email=email, password=password, name="Alice", surname="Doe"
    )


def create_food(
    name="Chicken Breast",
    category="Meat",
    servingSize=100.0,
    caloriesPerServing=165.0,
    proteinContent=31.0,
    fatContent=3.6,
    carbohydrateContent=0.0,
    nutritionScore=80.0,
    imageUrl="https://example.com/chicken.jpg",
):
    return FoodAccessService.create_validated_food_entry(
        name=name,
        category=category,
        servingSize=servingSize,
        caloriesPerServing=caloriesPerServing,
        proteinContent=proteinContent,
        fatContent=fatContent,
        carbohydrateContent=carbohydrateContent,
        nutritionScore=nutritionScore,
        imageUrl=imageUrl,
    )


class MealPlanModelTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.food1 = create_food(
            name="Oats",
            category="Grain",
            servingSize=50,
            caloriesPerServing=194.0,
            proteinContent=8.0,
            fatContent=3.6,
            carbohydrateContent=33.0,
            nutritionScore=75.0,
            imageUrl="https://example.com/oats.jpg",
        )
        self.food2 = create_food(
            name="Egg",
            category="Protein",
            servingSize=50,
            caloriesPerServing=78.0,
            proteinContent=6.0,
            fatContent=5.0,
            carbohydrateContent=0.6,
            nutritionScore=70.0,
            imageUrl="https://example.com/egg.jpg",
        )

    def test_calculate_total_nutrition_with_valid_meals(self):
        plan = MealPlan.objects.create(
            user=self.user,
            name="Breakfast",
            meals=[
                {"food_id": self.food1.id, "serving_size": 1.5, "meal_type": "breakfast"},
                {"food_id": self.food2.id, "serving_size": 2.0, "meal_type": "breakfast"},
            ],
        )
        plan.calculate_total_nutrition()

        self.assertAlmostEqual(plan.total_calories, 194.0 * 1.5 + 78.0 * 2.0, places=4)
        self.assertAlmostEqual(plan.total_protein, 8.0 * 1.5 + 6.0 * 2.0, places=4)
        self.assertAlmostEqual(plan.total_fat, 3.6 * 1.5 + 5.0 * 2.0, places=4)
        self.assertAlmostEqual(plan.total_carbohydrates, 33.0 * 1.5 + 0.6 * 2.0, places=4)

    def test_calculate_total_nutrition_skips_missing_foods(self):
        plan = MealPlan.objects.create(
            user=self.user,
            name="Mixed",
            meals=[
                {"food_id": 999999, "serving_size": 1.0, "meal_type": "lunch"},
                {"food_id": self.food2.id, "serving_size": 1.0, "meal_type": "lunch"},
            ],
        )
        plan.calculate_total_nutrition()

        self.assertAlmostEqual(plan.total_calories, 78.0, places=4)
        self.assertAlmostEqual(plan.total_protein, 6.0, places=4)
        self.assertAlmostEqual(plan.total_fat, 5.0, places=4)
        self.assertAlmostEqual(plan.total_carbohydrates, 0.6, places=4)


class MealPlanSerializerTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.food = create_food()

    def test_meal_serializer_validates_food_id(self):
        from .serializers import MealSerializer

        invalid = MealSerializer(data={"food_id": 123456789, "serving_size": 1.0, "meal_type": "dinner"})
        self.assertFalse(invalid.is_valid())
        self.assertIn("food_id", invalid.errors)

        valid = MealSerializer(data={"food_id": self.food.id, "serving_size": 2.0, "meal_type": "dinner"})
        self.assertTrue(valid.is_valid(), valid.errors)

    def test_meal_plan_create_serializer_creates_and_calculates(self):
        from .serializers import MealPlanCreateSerializer

        serializer = MealPlanCreateSerializer(
            data={
                "name": "My Plan",
                "meals": [{"food_id": self.food.id, "serving_size": 2.0, "meal_type": "lunch"}],
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        plan = serializer.save(user=self.user)

        plan.refresh_from_db()
        self.assertEqual(plan.user, self.user)
        self.assertEqual(plan.name, "My Plan")
        self.assertGreater(plan.total_calories, 0.0)
        self.assertGreater(plan.total_protein, 0.0)

    def test_meal_plan_update_serializer_updates_meals_and_totals(self):
        from .serializers import MealPlanCreateSerializer

        plan = MealPlan.objects.create(user=self.user, name="Base")
        serializer = MealPlanCreateSerializer(
            instance=plan,
            data={
                "name": "Updated",
                "meals": [{"food_id": self.food.id, "serving_size": 1.0, "meal_type": "snack"}],
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        plan = serializer.save()
        plan.refresh_from_db()

        self.assertEqual(plan.name, "Updated")
        self.assertEqual(len(plan.meals), 1)
        self.assertGreater(plan.total_calories, 0.0)


class MealPlanAPITests(APITestCase):
    def setUp(self):
        self.user = create_user(username="bob", email="bob@example.com")
        self.other = create_user(username="eve", email="eve@example.com")
        self.client = APIClient()
        # Authenticate requests for JWT-only setup
        self.client.force_authenticate(user=self.user)

        self.food1 = create_food(name="Apple", caloriesPerServing=95.0, proteinContent=0.5, fatContent=0.3, carbohydrateContent=25.0)
        self.food2 = create_food(name="Yogurt", caloriesPerServing=59.0, proteinContent=10.0, fatContent=0.4, carbohydrateContent=3.6)

    def test_list_meal_plans_filters_by_user(self):
        MealPlan.objects.create(user=self.user, name="Mine")
        MealPlan.objects.create(user=self.other, name="Others")

        url = reverse("meal-plan-list-create")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get("results", [])
        self.assertTrue(all(mp["name"] != "Others" for mp in results))

    def test_create_meal_plan_sets_user_and_calculates(self):
        url = reverse("meal-plan-list-create")
        payload = {
            "name": "New Plan",
            "meals": [
                {"food_id": self.food1.id, "serving_size": 1.0, "meal_type": "breakfast"},
                {"food_id": self.food2.id, "serving_size": 2.0, "meal_type": "lunch"},
            ],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Response uses create serializer (no totals). Validate DB state instead.
        self.assertEqual(res.data.get("name"), "New Plan")
        plan = MealPlan.objects.filter(user=self.user, name="New Plan").order_by("-created_at").first()
        self.assertIsNotNone(plan)
        self.assertEqual(plan.user, self.user)
        self.assertGreater(plan.total_calories, 0.0)

    def test_retrieve_update_delete_meal_plan_permissions(self):
        mine = MealPlan.objects.create(user=self.user, name="Mine")
        others = MealPlan.objects.create(user=self.other, name="Others")

        # Retrieve mine
        url_mine = reverse("meal-plan-detail", kwargs={"pk": mine.id})
        res = self.client.get(url_mine)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Retrieve others should 404 (filtered queryset)
        url_others = reverse("meal-plan-detail", kwargs={"pk": others.id})
        res = self.client.get(url_others)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Update mine
        res = self.client.patch(url_mine, {"name": "Renamed"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Renamed")

        # Delete mine
        res = self.client.delete(url_mine)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MealPlan.objects.filter(id=mine.id).exists())

    def test_set_and_get_current_meal_plan(self):
        plan1 = MealPlan.objects.create(user=self.user, name="Plan 1")
        plan2 = MealPlan.objects.create(user=self.user, name="Plan 2", is_active=True)

        # Initially, current meal plan may be None
        url_get = reverse("get-current-meal-plan")
        res = self.client.get(url_get)
        # 404 acceptable when None
        self.assertIn(res.status_code, (status.HTTP_200_OK, status.HTTP_404_NOT_FOUND))

        # Set plan1 as current
        url_set = reverse("set-current-meal-plan", kwargs={"meal_plan_id": plan1.id})
        res = self.client.post(url_set)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["meal_plan"]["id"], plan1.id)

        # Ensure plan1 active, plan2 inactive
        plan1.refresh_from_db()
        plan2.refresh_from_db()
        self.assertTrue(plan1.is_active)
        self.assertFalse(plan2.is_active)

        # Now get current returns 200 and the same plan
        res = self.client.get(url_get)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], plan1.id)


class DailyNutritionHydrationTests(TestCase):
    def setUp(self):
        self.user = create_user(username="hydro", email="hydro@example.com")
        self.food = create_food(
            name="Hydration Hero",
            category="Beverage",
            servingSize=250.0,
            caloriesPerServing=120.0,
            proteinContent=4.0,
            fatContent=1.0,
            carbohydrateContent=25.0,
            nutritionScore=8.4,
            imageUrl="https://example.com/water.jpg",
        )
        self.water_target = 3000.0
        self.water_micro, _ = Micronutrient.objects.get_or_create(
            name="Water (g)", defaults={"unit": "g"}
        )
        FoodEntryMicronutrient.objects.create(
            food_entry=self.food,
            micronutrient=self.water_micro,
            value=850.0,
        )
        NutritionTargets.objects.create(
            user=self.user,
            calories=2200,
            protein=120,
            carbohydrates=260,
            fat=70,
            micronutrients={"Water (g)": {"target": self.water_target}},
            is_custom=True,
        )

    def _create_log_with_servings(self, serving_size: float) -> DailyNutritionLog:
        log = DailyNutritionLog.objects.create(user=self.user, date=date.today())
        FoodLogEntry.objects.create(
            daily_log=log,
            food=self.food,
            serving_size=serving_size,
            serving_unit="serving",
            meal_type="breakfast",
            calories=0,
            protein=0,
            carbohydrates=0,
            fat=0,
            micronutrients={},
        )
        log.refresh_from_db()
        return log

    def test_hydration_penalty_applied_when_under_target(self):
        log = self._create_log_with_servings(0.5)
        serializer = DailyNutritionLogSerializer(log)
        data = serializer.data

        expected_actual = round(850.0 * 0.5, 2)
        expected_ratio = round(min(1.0, expected_actual / self.water_target), 3)
        expected_penalty = round(-2.0 * (1.0 - expected_ratio), 2)
        expected_base = round(self.food.nutritionScore, 2)
        expected_adjusted = round(
            max(0.0, min(10.0, expected_base + expected_penalty)), 2
        )

        self.assertEqual(data["hydration_actual"], expected_actual)
        self.assertEqual(data["hydration_target"], round(self.water_target, 2))
        self.assertEqual(data["hydration_ratio"], expected_ratio)
        self.assertEqual(data["hydration_penalty"], expected_penalty)
        self.assertAlmostEqual(data["base_nutrition_score"], expected_base)
        self.assertAlmostEqual(data["hydration_adjusted_score"], expected_adjusted)

    def test_hydration_penalty_zero_when_target_met(self):
        log = self._create_log_with_servings(4)
        serializer = DailyNutritionLogSerializer(log)
        data = serializer.data

        self.assertEqual(data["hydration_actual"], round(850.0 * 4, 2))
        self.assertEqual(data["hydration_target"], round(self.water_target, 2))
        self.assertEqual(data["hydration_ratio"], 1.0)
        self.assertEqual(data["hydration_penalty"], 0.0)
        self.assertEqual(
            data["hydration_adjusted_score"], round(self.food.nutritionScore, 2)
        )


from typing import cast
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.views import Response
from forum.models import Post, Recipe, RecipeIngredient
from foods.models import FoodEntry

User = get_user_model()


class RecipeTests(TestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(
            username="alice", password="pass123", email="alice@example.com"
        )
        self.user2 = User.objects.create_user(
            username="bob", password="pass456", email="bob@example.com"
        )

        # Create a post
        self.post = Post.objects.create(
            title="Test Recipe Post", body="A post with a recipe", author=self.user1
        )

        # Create food entries for ingredients
        self.food1 = FoodEntry.objects.create(
            name="Chicken Breast",
            category="Protein",
            servingSize=100.0,
            caloriesPerServing=165.0,
            proteinContent=31.0,
            fatContent=3.6,
            carbohydrateContent=0.0,
            nutritionScore=8.5,
            imageUrl="",
        )
        self.food1.dietaryOptions = []
        self.food1.save()

        self.food2 = FoodEntry.objects.create(
            name="Brown Rice",
            category="Grain",
            servingSize=100.0,
            caloriesPerServing=112.0,
            proteinContent=2.6,
            fatContent=0.9,
            carbohydrateContent=23.5,
            nutritionScore=7.8,
            imageUrl="",
        )
        self.food2.dietaryOptions = []
        self.food2.save()

        self.client = APIClient()

    def test_create_recipe(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        response = cast(
            Response,
            self.client.post(
                url,
                {
                    "post_id": self.post.id,
                    "instructions": "1. Cook chicken. 2. Cook rice. 3. Serve together.",
                    "ingredients": [
                        {"food_id": self.food1.id, "amount": 200},
                        {"food_id": self.food2.id, "amount": 150},
                    ],
                },
                format="json",
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Recipe.objects.count(), 1)

        recipe = Recipe.objects.first()
        self.assertEqual(recipe.post, self.post)
        self.assertEqual(
            recipe.instructions, "1. Cook chicken. 2. Cook rice. 3. Serve together."
        )

        # Check ingredients
        self.assertEqual(recipe.ingredients.count(), 2)

        # Check nutritional calculations (approximate due to floating point)
        self.assertAlmostEqual(
            recipe.total_protein, 62.0 + 3.9, places=1
        )  # 200g chicken + 150g rice
        self.assertAlmostEqual(recipe.total_fat, 7.2 + 1.35, places=1)
        self.assertAlmostEqual(recipe.total_carbohydrates, 0.0 + 35.25, places=1)

    def test_get_recipe_details(self):
        # Create a recipe
        recipe = Recipe.objects.create(
            post=self.post,
            instructions="1. Cook chicken. 2. Cook rice. 3. Combine and serve.",
        )

        # Add ingredients
        RecipeIngredient.objects.create(recipe=recipe, food=self.food1, amount=200)
        RecipeIngredient.objects.create(recipe=recipe, food=self.food2, amount=150)

        self.client.force_authenticate(user=self.user2)  # Even non-author can view
        url = reverse("recipe-detail", args=[recipe.id])
        response = cast(Response, self.client.get(url))

        self.assertEqual(response.status_code, 200)
        data = response.data

        # Check basic recipe data
        self.assertEqual(data["post_title"], self.post.title)
        self.assertEqual(data["instructions"], recipe.instructions)

        # Check ingredients are included
        self.assertEqual(len(data["ingredients"]), 2)

        # Check nutrition values
        self.assertIn("total_protein", data)
        self.assertIn("total_fat", data)
        self.assertIn("total_carbohydrates", data)
        self.assertIn("total_calories", data)

    def test_filter_recipes_by_post(self):
        # Create another post for comparison
        post2 = Post.objects.create(
            title="Another Post", body="Another post content", author=self.user1
        )

        # Create recipes
        recipe1 = Recipe.objects.create(
            post=self.post, instructions="Recipe for first post"
        )
        recipe2 = Recipe.objects.create(
            post=post2, instructions="Recipe for second post"
        )

        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        response = cast(Response, self.client.get(f"{url}?post={self.post.id}"))

        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", [])

        # Should only return the recipe for the requested post
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], recipe1.id)

    def test_user_can_update_own_recipe(self):
        recipe = Recipe.objects.create(
            post=self.post, instructions="Original instructions"
        )
        RecipeIngredient.objects.create(recipe=recipe, food=self.food1, amount=100)

        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-detail", args=[recipe.id])
        response = cast(
            Response,
            self.client.patch(
                url,
                {
                    "instructions": "Updated instructions",
                    "ingredients": [
                        {"food_id": self.food1.id, "amount": 150},
                        {"food_id": self.food2.id, "amount": 100},
                    ],
                },
                format="json",
            ),
        )

        self.assertEqual(response.status_code, 200)
        recipe.refresh_from_db()
        self.assertEqual(recipe.instructions, "Updated instructions")
        self.assertEqual(recipe.ingredients.count(), 2)

    def test_user_cannot_update_others_recipe(self):
        recipe = Recipe.objects.create(
            post=self.post, instructions="Original instructions"
        )

        self.client.force_authenticate(user=self.user2)
        url = reverse("recipe-detail", args=[recipe.id])
        response = cast(
            Response,
            self.client.patch(
                url,
                {"instructions": "Trying to modify someone else's recipe"},
                format="json",
            ),
        )

        self.assertEqual(response.status_code, 403)
        recipe.refresh_from_db()
        self.assertEqual(recipe.instructions, "Original instructions")

    def test_post_author_can_delete_recipe(self):
        recipe = Recipe.objects.create(
            post=self.post, instructions="Recipe to be deleted"
        )

        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-detail", args=[recipe.id])
        response = cast(Response, self.client.delete(url))

        self.assertEqual(response.status_code, 204)
        self.assertEqual(Recipe.objects.count(), 0)

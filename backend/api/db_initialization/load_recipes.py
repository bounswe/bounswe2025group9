"""
Recipe loader script for populating the database with realistic recipes.

Usage:
    python backend/api/db_initialization/load_recipes.py

This script loads recipes from recipes_data.json and creates:
- Post entries for each recipe
- Recipe entries linked to posts
- RecipeIngredient entries linking recipes to food items
- Tags associated with posts
"""

import json
import os
import sys
import django
from pathlib import Path

# Django setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
django.setup()

from django.contrib.auth import get_user_model
from foods.models import FoodEntry
from forum.models import Post, Recipe, RecipeIngredient, Tag


class RecipeLoader:
    """Loads recipes from JSON file into the database."""

    def __init__(self):
        self.count = 0
        self.failed = 0
        self.User = get_user_model()

    def load_recipes(self, json_file, limit=None):
        """Main entry point: load recipes from JSON file."""
        json_file = Path(json_file)

        if not json_file.exists():
            raise FileNotFoundError(f"JSON file not found: {json_file}")

        print(f"Loading recipes from {json_file}...")

        with open(json_file, "r", encoding="utf-8") as f:
            recipes = json.load(f)

        print(f"Found {len(recipes)} recipes in JSON")

        iterable = recipes[:limit] if limit else recipes
        for idx, recipe_data in enumerate(iterable, start=1):
            try:
                self.create_recipe(recipe_data)
                self.count += 1
                print(f"  Created: {recipe_data.get('title', 'Unknown')[:40]:<40}", end="\r")
            except Exception as e:
                self.failed += 1
                print(f"⚠️  Failed to load recipe '{recipe_data.get('title', 'Unknown')}': {str(e)}")

        print(f"\n✓ Successfully loaded {self.count} recipes.")
        print(f"❌ Failed: {self.failed}")

    def get_or_create_user(self, username):
        """Get or create a user for recipe authorship."""
        user, created = self.User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@example.com"}
        )
        return user

    def create_recipe(self, recipe_data):
        """Create a recipe with its post and ingredients."""
        title = recipe_data.get("title", "").strip()
        body = recipe_data.get("body", "").strip()
        author_username = recipe_data.get("author_username", "demo")
        tag_names = recipe_data.get("tags", [])
        instructions = recipe_data.get("instructions", "")
        ingredients_data = recipe_data.get("ingredients", [])

        if not title:
            raise ValueError("Recipe title is missing")

        # Check if recipe already exists
        if Post.objects.filter(title=title).exists():
            print(f"  Skipping (exists): {title[:40]:<40}")
            return

        # Get or create author
        author = self.get_or_create_user(author_username)

        # Create post
        post = Post.objects.create(
            title=title,
            body=body,
            author=author
        )

        # Add tags
        for tag_name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            post.tags.add(tag)

        # Create recipe
        recipe = Recipe.objects.create(
            post=post,
            instructions=instructions
        )

        # Create ingredients
        for ing_data in ingredients_data:
            food_name = ing_data.get("foodName", "")
            amount = ing_data.get("amount", 0)
            custom_unit = ing_data.get("customUnit", "grams")
            custom_amount = ing_data.get("customAmount", 0)

            # Find food entry (try exact match first, then partial)
            food = FoodEntry.objects.filter(name=food_name).first()
            if not food:
                # Try partial match
                food = FoodEntry.objects.filter(name__icontains=food_name).first()
            
            if not food:
                print(f"    ⚠️  Food not found: {food_name}")
                continue

            RecipeIngredient.objects.create(
                recipe=recipe,
                food=food,
                amount=amount,
                customUnit=custom_unit,
                customAmount=custom_amount
            )


def load_recipes_for_migration(apps, schema_editor):
    """
    Function to be called from Django migration.
    Uses historical models provided by the migration framework.
    """
    Post = apps.get_model("forum", "Post")
    Recipe = apps.get_model("forum", "Recipe")
    RecipeIngredient = apps.get_model("forum", "RecipeIngredient")
    Tag = apps.get_model("forum", "Tag")
    FoodEntry = apps.get_model("foods", "FoodEntry")
    User = apps.get_model("accounts", "User")

    # Load JSON file
    json_file = Path(__file__).parent / "recipes_data.json"
    if not json_file.exists():
        print(f"⚠️  Recipe data file not found: {json_file}")
        return

    with open(json_file, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    count = 0
    for recipe_data in recipes:
        title = recipe_data.get("title", "").strip()
        body = recipe_data.get("body", "").strip()
        author_username = recipe_data.get("author_username", "demo")
        tag_names = recipe_data.get("tags", [])
        instructions = recipe_data.get("instructions", "")
        ingredients_data = recipe_data.get("ingredients", [])

        if not title:
            continue

        # Skip if exists
        if Post.objects.filter(title=title).exists():
            continue

        # Get or create author
        user, _ = User.objects.get_or_create(
            username=author_username,
            defaults={"email": f"{author_username}@example.com"}
        )

        # Create post
        post = Post.objects.create(
            title=title,
            body=body,
            author=user
        )

        # Add tags
        for tag_name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            post.tags.add(tag)

        # Create recipe
        recipe = Recipe.objects.create(
            post=post,
            instructions=instructions
        )

        # Create ingredients
        for ing_data in ingredients_data:
            food_name = ing_data.get("foodName", "")
            amount = ing_data.get("amount", 0)
            custom_unit = ing_data.get("customUnit", "grams")
            custom_amount = ing_data.get("customAmount", 0)

            food = FoodEntry.objects.filter(name=food_name).first()
            if not food:
                food = FoodEntry.objects.filter(name__icontains=food_name).first()
            
            if not food:
                continue

            RecipeIngredient.objects.create(
                recipe=recipe,
                food=food,
                amount=amount,
                customUnit=custom_unit,
                customAmount=custom_amount
            )

        count += 1

    print(f"✓ Loaded {count} recipes via migration")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Load recipes from JSON file")
    parser.add_argument(
        "--json-file",
        type=str,
        default=str(Path(__file__).parent / "recipes_data.json"),
        help="Path to JSON file containing recipes",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of recipes to load",
    )

    args = parser.parse_args()

    loader = RecipeLoader()
    try:
        loader.load_recipes(args.json_file, limit=args.limit)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

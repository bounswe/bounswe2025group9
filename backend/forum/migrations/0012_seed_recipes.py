# Generated migration for seeding recipe data

import json
from pathlib import Path
from django.db import migrations


def load_recipes(apps, schema_editor):
    """
    Load recipes from recipes_data.json into the database.
    Creates Posts, Recipes, RecipeIngredients, and associates Tags.
    """
    Post = apps.get_model("forum", "Post")
    Recipe = apps.get_model("forum", "Recipe")
    RecipeIngredient = apps.get_model("forum", "RecipeIngredient")
    Tag = apps.get_model("forum", "Tag")
    FoodEntry = apps.get_model("foods", "FoodEntry")
    User = apps.get_model("accounts", "User")

    # Load JSON file
    json_file = Path(__file__).parent.parent.parent / "api" / "db_initialization" / "recipes_data.json"
    if not json_file.exists():
        print(f"⚠️  Recipe data file not found: {json_file}")
        return

    with open(json_file, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    count = 0
    skipped = 0
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
            skipped += 1
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

            # Find food entry (exact match first, then partial)
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

    print(f"✓ Loaded {count} recipes (skipped {skipped} existing)")


def remove_recipes(apps, schema_editor):
    """
    Reverse migration: remove seeded recipes.
    """
    Post = apps.get_model("forum", "Post")
    
    # Load JSON to get titles
    json_file = Path(__file__).parent.parent.parent / "api" / "db_initialization" / "recipes_data.json"
    if not json_file.exists():
        return

    with open(json_file, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    titles = [r.get("title", "").strip() for r in recipes if r.get("title")]
    
    # Delete posts (cascades to recipes and ingredients)
    deleted, _ = Post.objects.filter(title__in=titles).delete()
    print(f"✓ Removed {deleted} seeded recipe posts")


class Migration(migrations.Migration):

    dependencies = [
        ("forum", "0011_alter_recipeingredient_customunit"),
        ("foods", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(load_recipes, remove_recipes),
    ]

import json
import os
import sys
import django

"""
For loading food data manualy into the database, but we need to run this script in the Django context.
"""
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
django.setup()

from foods.models import FoodEntry, Allergen

json_path = os.path.join(os.path.dirname(__file__), "foods.json")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

try:
    # First clear existing data to avoid duplicates
    print("Clearing existing food entries...")
    FoodEntry.objects.all().delete()

    print(f"Loading {len(data)} food entries...")
    for item in data:
        # Create a FoodEntry object for each item in the JSON file and save it to the database.
        food_entry = FoodEntry.objects.create(
            name=item["name"],
            category=item["category"],
            servingSize=item["servingSize"],
            caloriesPerServing=item["caloriesPerServing"],
            proteinContent=item["proteinContent"],
            fatContent=item["fatContent"],
            carbohydrateContent=item["carbohydrateContent"],
            dietaryOptions=item.get("dietaryOptions", []),
            nutritionScore=item["nutritionScore"],
            imageUrl=item["imageUrl"],
        )

        # Handle the many-to-many relationship properly
        if "allergens" in item and item["allergens"]:
            # Create allergens if they don't exist and add them to the food entry
            allergen_objects = []
            for allergen_name in item["allergens"]:
                allergen, _ = Allergen.objects.get_or_create(name=allergen_name)
                allergen_objects.append(allergen)

            # Use the set method to handle the many-to-many relationship
            food_entry.allergens.set(allergen_objects)

    print(f"Successfully loaded {FoodEntry.objects.count()} food entries.")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("Food data loading completed.")

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

from foods.models import FoodEntry

json_path = os.path.join(os.path.dirname(__file__), "foods.json")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

try:
    for item in data:
        """Create a FoodEntry object for each item in the JSON file and save it to the database."""
        FoodEntry.objects.create(
            name=item["name"],
            category=item["category"],
            servingSize=item["servingSize"],
            caloriesPerServing=item["caloriesPerServing"],
            proteinContent=item["proteinContent"],
            fatContent=item["fatContent"],
            carbohydrateContent=item["carbohydrateContent"],
            allergens=item.get("allergens", []),
            dietaryOptions=item.get("dietaryOptions", []),
            nutritionScore=item["nutritionScore"],
            imageUrl=item.get("imageUrl", ""),
        )
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("Food data loading completed.")

import json
from api.models import FoodEntry

with open("enriched_foods.json", "r", encoding="utf-8") as f:
    data = json.load(f)

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

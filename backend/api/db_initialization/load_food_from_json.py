import json
import os
import sys
import django
import argparse
from pathlib import Path

# Django setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
django.setup()

from foods.models import FoodEntry, Allergen
from nutrition_score import calculate_nutrition_score


class FoodLoader:
    """Standalone food loader for USDA FDC JSON format."""

    def __init__(self, skip_errors=False):
        self.skip_errors = skip_errors
        self.count = 0
        self.failed = 0

    def load_foods(self, json_file, limit=None):
        """Main entry point: load foods from JSON file."""
        json_file = Path(json_file)

        if not json_file.exists():
            raise FileNotFoundError(f"JSON file not found: {json_file}")

        print(f"Loading foods from {json_file}...")

        foods = self.load_json_file(json_file)
        print(f"Loaded {len(foods)} foods from JSON")

        for food_data in foods[:limit] if limit else foods:
            try:
                self.create_food_entry(food_data)
                self.count += 1
            except Exception as e:
                error_msg = f"Failed to load food '{food_data.get('description', 'Unknown')}': {str(e)}"
                if self.skip_errors:
                    print(f"⚠️  {error_msg}")
                    self.failed += 1
                else:
                    raise Exception(error_msg)

        print(f"✓ Successfully loaded {self.count} foods. Failed: {self.failed}")

    def load_json_file(self, filepath):
        """Load JSON file and return list of food items.
        Handles:
        1. Array of objects: [{ food1 }, { food2 }, ...]
        2. Object with 'SurveyFoods' key: { "SurveyFoods": [ ... ] }
        3. JSONL format: one object per line
        """
        foods = []

        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Try to parse the whole content as JSON first
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                # Common case: top-level object with key 'SurveyFoods'
                if "SurveyFoods" in parsed and isinstance(parsed["SurveyFoods"], list):
                    return parsed["SurveyFoods"]
                # Fallback: return the first list value we find
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
                return []
        except json.JSONDecodeError:
            # If full-JSON parsing failed, try to extract the 'SurveyFoods' array
            key = '"SurveyFoods"'
            idx = content.find(key)
            if idx != -1:
                start = content.find("[", idx)
                if start != -1:
                    depth = 0
                    end = None
                    i = start
                    while i < len(content):
                        ch = content[i]
                        if ch == "[":
                            depth += 1
                        elif ch == "]":
                            depth -= 1
                            if depth == 0:
                                end = i + 1
                                break
                        i += 1
                    if end:
                        arr_text = content[start:end]
                        try:
                            return json.loads(arr_text)
                        except json.JSONDecodeError:
                            pass

            # Final fallback: attempt JSONL parsing (one JSON object per line)
            for line in content.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    foods.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"⚠️  Failed to parse JSON line: {str(e)}")

        return foods

    def extract_nutrients(self, food_data):
        """Extract macronutrients and micronutrients from foodNutrients array."""
        nutrients = {
            "calories": 0,
            "protein": 0,
            "fat": 0,
            "carbs": 0,
            "micronutrients": {},
        }

        # Nutrient number to field mapping
        macro_mapping = {
            "203": "protein",  # Protein
            "204": "fat",  # Total lipid (fat)
            "205": "carbs",  # Carbohydrate, by difference
            "208": "calories",  # Energy (kcal)
        }

        # Extract nutrients
        for item in food_data.get("foodNutrients", []):
            nutrient = item.get("nutrient", {})
            nutrient_number = nutrient.get("number", "")
            nutrient_name = nutrient.get("name", "")
            unit_name = nutrient.get("unitName", "")
            amount = item.get("amount", 0)

            if not nutrient_number or amount is None:
                continue

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                amount = 0

            # Map to macronutrient if applicable
            if nutrient_number in macro_mapping:
                nutrients[macro_mapping[nutrient_number]] = amount
            else:
                # Add to micronutrients as dict value (amount with unit in name)
                if nutrient_name and amount > 0:
                    nutrients["micronutrients"][
                        f"{nutrient_name} ({unit_name})"
                    ] = amount

        return nutrients

    def extract_serving_size(self, food_data):
        """Extract serving size in grams from foodPortions.
        Returns the first (primary) portion's gram weight, or 100g as default.
        """
        portions = food_data.get("foodPortions", [])

        if portions:
            # Sort by sequenceNumber to get the primary portion
            sorted_portions = sorted(
                portions, key=lambda x: x.get("sequenceNumber", 999)
            )
            first_portion = sorted_portions[0]

            gram_weight = first_portion.get("gramWeight")
            if gram_weight and gram_weight > 0:
                return float(gram_weight)

        return 100.0  # Default: 100g

    def extract_category(self, food_data):
        """Extract category from wweiaFoodCategory."""
        wweia_category = food_data.get("wweiaFoodCategory", {})
        return wweia_category.get("wweiaFoodCategoryDescription", "Uncategorized")

    # def calculate_nutrition_score(self, calories, protein, fat, carbs):
    #     """
    #     Calculate a nutrition score (0-100 scale).
    #     Higher score = more nutritious per calorie.

    #     Factors considered:
    #     - Protein ratio (higher is better)
    #     - Fat ratio (lower is better, but some fat is needed)
    #     - Carb ratio (moderate is better)
    #     - Overall calorie density
    #     """
    #     score = 50  # Start at neutral 50

    #     # Protein efficiency (aim for 20%+ of calories from protein)
    #     # Each gram of protein = 4 calories
    #     if calories > 0:
    #         protein_calories = protein * 4
    #         protein_ratio = (protein_calories / calories) * 100

    #         if protein_ratio >= 20:
    #             score += min((protein_ratio - 20) / 10, 15)  # Up to +15
    #         else:
    #             score -= (20 - protein_ratio) / 5  # Penalize low protein

    #         # Fat ratio (aim for 25-35% of calories from fat)
    #         fat_calories = fat * 9
    #         fat_ratio = (fat_calories / calories) * 100

    #         if 25 <= fat_ratio <= 35:
    #             score += 10
    #         elif fat_ratio < 25:
    #             score -= (25 - fat_ratio) / 10
    #         else:
    #             score -= min((fat_ratio - 35) / 20, 10)

    #         # Carb ratio (aim for 45-65% of calories from carbs)
    #         carb_calories = carbs * 4
    #         carb_ratio = (carb_calories / calories) * 100

    #         if 45 <= carb_ratio <= 65:
    #             score += 10
    #         else:
    #             score -= abs(55 - carb_ratio) / 15
    #     else:
    #         # No calories, low score
    #         score = 20

    #     # Clamp score between 0 and 100
    #     return max(0, min(100, round(score, 2)))

    def infer_dietary_options(self, description):
        """Infer dietary options from food description."""
        options = []
        description_lower = description.lower()

        # Fat content
        if (
            "fat-free" in description_lower
            or "nonfat" in description_lower
            or "skim" in description_lower
        ):
            options.append("fat-free")
        elif (
            "low-fat" in description_lower
            or "lowfat" in description_lower
            or "1%" in description_lower
        ):
            options.append("low-fat")
        elif "reduced fat" in description_lower or "2%" in description_lower:
            options.append("reduced-fat")

        # Dietary category
        if any(
            word in description_lower
            for word in ["vegan", "vegetable", "legume", "bean", "tofu"]
        ):
            options.append("vegetarian")

        # Sugars
        if "unsweetened" in description_lower:
            options.append("unsweetened")
        elif "sugar-free" in description_lower or "no sugar" in description_lower:
            options.append("sugar-free")

        # Lactose
        if "lactose" in description_lower:
            if "free" in description_lower:
                options.append("lactose-free")
            else:
                options.append("contains-lactose")

        # Gluten (inferred from common allergen info)
        if any(word in description_lower for word in ["wheat", "barley", "rye"]):
            options.append("contains-gluten")

        return options

    def infer_allergens(self, description):
        """
        Infer allergens from food description.
        Returns list of allergen names to add to the food.
        """
        allergens = []
        description_lower = description.lower()

        allergen_keywords = {
            "milk": [
                "milk",
                "cheese",
                "yogurt",
                "dairy",
                "butter",
                "cream",
                "whey",
                "casein",
                "lactose",
            ],
            "eggs": ["egg", "omelet", "mayonnaise"],
            "peanuts": ["peanut"],
            "tree nuts": [
                "nut",
                "almond",
                "walnut",
                "pecan",
                "cashew",
                "pistachio",
                "hazelnut",
            ],
            "fish": ["fish", "salmon", "tuna", "cod", "halibut", "anchovy"],
            "shellfish": [
                "shrimp",
                "crab",
                "lobster",
                "oyster",
                "clam",
                "mussel",
                "scallop",
            ],
            "soy": ["soy", "tofu", "edamame"],
            "wheat": ["wheat", "bread", "pasta", "flour"],
            "sesame": ["sesame"],
        }

        for allergen_name, keywords in allergen_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                allergens.append(allergen_name)

        return allergens

    def create_food_entry(self, food_data):
        """Create or update a FoodEntry from JSON food data."""

        # Extract basic information
        name = food_data.get("description", "").strip()
        if not name:
            raise ValueError("Food description is missing")

        category = self.extract_category(food_data)
        serving_size = self.extract_serving_size(food_data)
        nutrients = self.extract_nutrients(food_data)

        # Infer dietary options and allergens
        dietary_options = self.infer_dietary_options(name)
        allergen_names = self.infer_allergens(name)

        # Create or update the FoodEntry
        food_entry, created = FoodEntry.objects.update_or_create(
            name=name,
            defaults={
                "category": category,
                "servingSize": serving_size,
                "caloriesPerServing": nutrients["calories"],
                "proteinContent": nutrients["protein"],
                "fatContent": nutrients["fat"],
                "carbohydrateContent": nutrients["carbs"],
                "micronutrients": nutrients["micronutrients"],
                "dietaryOptions": dietary_options,
                "nutritionScore": 0.0,  # Temporary, will recalculate below
                "imageUrl": "",
            },
        )

        # Add allergens
        for allergen_name in allergen_names:
            allergen, _ = Allergen.objects.get_or_create(name=allergen_name)
            food_entry.allergens.add(allergen)

        # Recalculate nutrition score using external function
        # Convert FoodEntry object to dict for nutrition_score function
        food_dict = {
            "caloriesPerServing": food_entry.caloriesPerServing,
            "proteinContent": food_entry.proteinContent,
            "fatContent": food_entry.fatContent,
            "carbohydrateContent": food_entry.carbohydrateContent,
            "servingSize": food_entry.servingSize,
            "category": food_entry.category,
            "name": food_entry.name,
        }
        try:
            score = calculate_nutrition_score(food_dict)
            assert (
                0.0 <= score <= 10.0
            ), "Nutrition score out of bounds, score = {score}"
            food_entry.nutritionScore = score
        except Exception as e:
            print(f"⚠️  Failed to calculate nutrition score for '{name}': {str(e)}")
            # Delete the food entry if score calculation fails
            print(f"❌ Deleting incomplete food entry '{name}'")
            food_entry.delete()
        food_entry.save()

        action = "Created" if created else "Updated"
        print(
            f"  {action}: {name} ({serving_size}g, {nutrients['calories']}kcal, score: {food_entry.nutritionScore})"
        )


# ============================================================================
# Main entry point
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Load food items from JSON file (USDA FDC format) into the FoodEntry model"
    )
    parser.add_argument(
        "json_file",
        type=str,
        help="Path to JSON file containing food items",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of foods to load (for testing)",
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Continue loading even if some items fail",
    )

    args = parser.parse_args()

    loader = FoodLoader(skip_errors=args.skip_errors)
    try:
        loader.load_foods(args.json_file, limit=args.limit)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

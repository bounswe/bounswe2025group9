import json
from pathlib import Path


def calculate_nutrition_score(food_item):
    """
    Calculate a nutrition score based on the food's nutritional profile.

    The score is calculated as:
    - Protein content (30% of score)
    - Carbohydrate quality (30% of score, favoring complex carbs over simple sugars)
    - Nutrient balance (40% of score, representing overall balance of macro and micronutrients)

    Args:
        food_item (dict): Food item with nutritional information

    Returns:
        float: Nutrition score from 0.00-10.00, rounded to 2 decimal places
    """
    # Extract nutritional values
    calories = food_item.get("caloriesPerServing", 0)
    protein = food_item.get("proteinContent", 0)
    fat = food_item.get("fatContent", 0)
    carbs = food_item.get("carbohydrateContent", 0)
    serving_size = food_item.get("servingSize", 100)

    # Avoid division by zero
    if serving_size == 0:
        serving_size = 100

    # Normalize values to per 100g if they aren't already
    if serving_size != 100:
        multiplier = 100 / serving_size
        calories *= multiplier
        protein *= multiplier
        fat *= multiplier
        carbs *= multiplier

    # 1. Protein content (30% of score)
    # Typical range: 0-30g per 100g, with 30g being excellent (3 points)
    protein_score = min(protein / 10, 3) * (
        0.3 * 10 / 3
    )  # Scale to 30% of total 10 points

    # 2. Carbohydrate quality (30% of score)
    # We need to estimate carb quality since we don't have direct data on complex vs. simple carbs
    carb_quality_score = 0

    # Using food category as proxy for carb quality
    category = food_item.get("category", "").lower()

    if "vegetable" in category or "fruit" in category:
        # Vegetables and fruits tend to have higher quality carbs
        carb_quality_score = 3  # Max score
    elif "whole" in food_item.get("name", "").lower() and "grain" in category:
        # Whole grains have high quality carbs
        carb_quality_score = 2.5
    elif "grain" in category:
        # Regular grains have moderate quality carbs
        carb_quality_score = 2
    elif "dairy" in category:
        # Dairy has moderate to low carb quality (lactose is a simple sugar)
        carb_quality_score = 1.5
    elif "sweets" in category or "snacks" in category:
        # Sweets and snacks generally have low quality carbs
        carb_quality_score = 0.5
    else:
        # Default moderate score
        carb_quality_score = 1.5

    # Scale carb quality to 30% of total score
    carb_quality_score = carb_quality_score * (0.3 * 10 / 3)

    # 3. Nutrient balance (40% of score)
    # Calculate percentage of calories from each macronutrient
    total_macros = protein * 4 + carbs * 4 + fat * 9

    if total_macros == 0:
        nutrient_balance_score = 0
    else:
        # Calculate percentage of calories from each macro
        protein_pct = (protein * 4) / total_macros
        carbs_pct = (carbs * 4) / total_macros
        fat_pct = (fat * 9) / total_macros

        # Ideal ranges (approximate):
        # Protein: 10-35%
        # Carbs: 45-65%
        # Fat: 20-35%

        # Score for each macronutrient's balance
        if protein_pct < 0.1:
            protein_balance = 0.5  # Too low
        elif protein_pct <= 0.35:
            protein_balance = 1.0  # Good range
        else:
            protein_balance = 0.7  # Too high

        if carbs_pct < 0.45:
            carbs_balance = 0.7  # Too low
        elif carbs_pct <= 0.65:
            carbs_balance = 1.0  # Good range
        else:
            carbs_balance = 0.7  # Too high

        if fat_pct < 0.2:
            fat_balance = 0.7  # Too low
        elif fat_pct <= 0.35:
            fat_balance = 1.0  # Good range
        else:
            fat_balance = 0.5  # Too high

        # Combine the balance scores
        nutrient_balance_score = (protein_balance + carbs_balance + fat_balance) * (
            0.4 * 10 / 3
        )

    # Calculate final score (0-10 scale)
    final_score = protein_score + carb_quality_score + nutrient_balance_score

    # Cap at 10 and round to 2 decimal places
    return round(min(final_score, 10.0), 2)


if __name__ == "__main__":
    # Load the foods.json file
    json_path = Path("foods.json")

    # Load data directly
    with open(json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    # Update all nutrition scores
    for food in foods:
        food["nutritionScore"] = calculate_nutrition_score(food)

    # Save updated data
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

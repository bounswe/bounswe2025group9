import json
from pathlib import Path

def calculate_nutrition_score(food_item):
    """
    Calculate a nutrition score based on the food's nutritional profile.
    
    
    Args:
        food_item (dict): Food item with nutritional information
        
    Returns:
        float: Nutrition score from 0-10, rounded to 1 decimal place
    """
    # Extract nutritional values
    calories = food_item.get('caloriesPerServing', 0)
    protein = food_item.get('proteinContent', 0)
    fat = food_item.get('fatContent', 0)
    carbs = food_item.get('carbohydrateContent', 0)
    serving_size = food_item.get('servingSize', 100)
    
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
    
    # Calculate sub-scores
    
    # Protein score (0-3): Higher protein content is better
    # Typical range: 0-30g per 100g
    protein_score = min(protein / 10, 3)
    
    # Calorie density score (0-2): Lower is better, but not too low
    # Typical range: 0-900 calories per 100g
    if calories < 50:
        calorie_score = 1.0  # Very low calorie foods (like vegetables)
    elif calories < 200:
        calorie_score = 2.0  # Moderate calorie foods
    elif calories < 400:
        calorie_score = 1.5  # Higher calorie but potentially nutritious
    elif calories < 600:
        calorie_score = 1.0  # High calorie foods
    else:
        calorie_score = 0.5  # Very high calorie foods
    
    # Macronutrient balance score (0-3)
    # Calculate percentage of calories from each macronutrient
    total_macros = protein * 4 + carbs * 4 + fat * 9
    if total_macros == 0:
        macro_balance_score = 0
    else:
        # Calculate percentage of calories from each macro
        protein_pct = (protein * 4) / total_macros if total_macros > 0 else 0
        carbs_pct = (carbs * 4) / total_macros if total_macros > 0 else 0
        fat_pct = (fat * 9) / total_macros if total_macros > 0 else 0
        
        # Ideal ranges (approximate):
        # Protein: 10-35%
        # Carbs: 45-65%
        # Fat: 20-35%
        protein_balance = min(protein_pct * 10, 1.0)
        
        # For carbs, we want a moderate amount
        if carbs_pct < 0.2:
            carbs_balance = 0.5  # Too low
        elif carbs_pct < 0.65:
            carbs_balance = 1.0  # Good range
        else:
            carbs_balance = 0.5  # Too high
        
        # For fat, too little or too much is not ideal
        if fat_pct < 0.1:
            fat_balance = 0.5  # Too low
        elif fat_pct < 0.35:
            fat_balance = 1.0  # Good range
        else:
            fat_balance = 0.5  # Too high
            
        macro_balance_score = protein_balance + carbs_balance + fat_balance
    
    # Food category adjustment (0-2)
    # Certain food categories get bonuses or penalties
    category = food_item.get('category', '').lower()
    category_score = 0
    
    if 'vegetable' in category:
        category_score = 2.0
    elif 'fruit' in category:
        category_score = 1.8
    elif 'protein' in category:
        category_score = 1.5
    elif 'grain' in category and 'whole' in food_item.get('name', '').lower():
        category_score = 1.5
    elif 'grain' in category:
        category_score = 1.2
    elif 'dairy' in category:
        category_score = 1.0
    elif 'fats & oils' in category:
        # Some healthy fats deserve better scores
        if any(healthy_fat in food_item.get('name', '').lower() 
               for healthy_fat in ['olive', 'avocado', 'nut', 'seed']):
            category_score = 1.0
        else:
            category_score = 0.5
    elif 'sweets & snacks' in category:
        category_score = 0.3
    elif 'beverage' in category:
        if any(healthy_drink in food_item.get('name', '').lower() 
               for healthy_drink in ['water', 'tea', 'vegetable']):
            category_score = 1.5
        elif 'juice' in food_item.get('name', '').lower():
            category_score = 0.8
        else:
            category_score = 0.5
    
    # Calculate final score (0-10 scale)
    final_score = protein_score + calorie_score + macro_balance_score + category_score
    
    # Cap at 10 and round to 1 decimal place
    return round(min(final_score, 10.0), 1)

if __name__ == "__main__":
    # Load the foods.json file
    json_path = Path("foods.json")
    
    # Load data directly
    with open(json_path, 'r', encoding='utf-8') as f:
        foods = json.load(f)
    print(calculate_nutrition_score(foods[0]))
    for i, food in enumerate(foods, 1):
        if food.get("nutritionScore", 0) == 0:
            food["nutritionScore"] = calculate_nutrition_score(food)
    
    # Save updated data
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(foods,f, indent=2, ensure_ascii=False)
    
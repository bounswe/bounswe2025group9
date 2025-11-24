"""
Nutrition calculation utilities for BMR, TDEE, and macro distribution.
Uses the Mifflin-St Jeor Equation for BMR calculation.
"""

# Activity level multipliers for TDEE calculation
ACTIVITY_MULTIPLIERS = {
    'sedentary': 1.2,      # Little or no exercise
    'light': 1.375,        # Light exercise 1-3 days/week
    'moderate': 1.55,      # Moderate exercise 3-5 days/week
    'active': 1.725,       # Hard exercise 6-7 days/week
    'very_active': 1.9,    # Very hard exercise & physical job
}

# Macronutrient energy values (kcal per gram)
PROTEIN_KCAL_PER_G = 4
CARBS_KCAL_PER_G = 4
FAT_KCAL_PER_G = 9


def calculate_bmr(weight_kg, height_cm, age, gender):
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation.
    
    The Mifflin-St Jeor equation is considered one of the most accurate
    formulas for calculating BMR.
    
    Args:
        weight_kg (float): Weight in kilograms
        height_cm (float): Height in centimeters
        age (int): Age in years
        gender (str): 'M' for male, 'F' for female
    
    Returns:
        float: BMR in calories per day, rounded to 2 decimal places
    
    Raises:
        ValueError: If gender is not 'M' or 'F'
    """
    if gender not in ['M', 'F']:
        raise ValueError("Gender must be 'M' or 'F'")
    
    # Base calculation: (10 × weight) + (6.25 × height) - (5 × age)
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    
    # Gender adjustment
    if gender == 'M':
        bmr = base + 5
    else:  # gender == 'F'
        bmr = base - 161
    
    return round(bmr, 2)


def calculate_tdee(bmr, activity_level):
    """
    Calculate Total Daily Energy Expenditure.
    
    TDEE represents the total calories burned per day including
    basal metabolic rate and physical activity.
    
    Activity levels:
    - sedentary: Little or no exercise
    - light: Light exercise 1-3 days/week
    - moderate: Moderate exercise 3-5 days/week
    - active: Hard exercise 6-7 days/week
    - very_active: Very hard exercise & physical job
    
    Args:
        bmr (float): Basal Metabolic Rate in calories/day
        activity_level (str): Activity level key
    
    Returns:
        float: TDEE in calories per day, rounded to 2 decimal places
    
    Raises:
        ValueError: If activity_level is not recognized
    """
    if activity_level not in ACTIVITY_MULTIPLIERS:
        raise ValueError(
            f"Invalid activity level. Must be one of: {', '.join(ACTIVITY_MULTIPLIERS.keys())}"
        )
    
    multiplier = ACTIVITY_MULTIPLIERS[activity_level]
    tdee = bmr * multiplier
    
    return round(tdee, 2)


def calculate_macro_targets(tdee, carb_ratio=0.40, protein_ratio=0.30, fat_ratio=0.30):
    """
    Calculate macronutrient targets from TDEE using specified ratios.
    
    Default ratios (40/30/30):
    - Carbohydrates: 40% of total calories
    - Protein: 30% of total calories
    - Fat: 30% of total calories
    
    Args:
        tdee (float): Total Daily Energy Expenditure in calories
        carb_ratio (float): Percentage of calories from carbs (0.0-1.0)
        protein_ratio (float): Percentage of calories from protein (0.0-1.0)
        fat_ratio (float): Percentage of calories from fat (0.0-1.0)
    
    Returns:
        dict: Dictionary with keys:
            - calories (float): Total daily calories (equals TDEE)
            - protein_g (float): Protein target in grams
            - carbohydrates_g (float): Carbohydrates target in grams
            - fat_g (float): Fat target in grams
    
    Raises:
        ValueError: If ratios don't sum to approximately 1.0
    """
    # Validate ratios sum to 1.0 (allowing small floating point error)
    total_ratio = carb_ratio + protein_ratio + fat_ratio
    if not (0.99 <= total_ratio <= 1.01):
        raise ValueError(
            f"Macro ratios must sum to 1.0, got {total_ratio}"
        )
    
    # Calculate calories from each macro
    carb_calories = tdee * carb_ratio
    protein_calories = tdee * protein_ratio
    fat_calories = tdee * fat_ratio
    
    # Convert to grams
    # Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
    protein_g = protein_calories / PROTEIN_KCAL_PER_G
    carbs_g = carb_calories / CARBS_KCAL_PER_G
    fat_g = fat_calories / FAT_KCAL_PER_G
    
    return {
        'calories': round(tdee, 2),
        'protein_g': round(protein_g, 2),
        'carbohydrates_g': round(carbs_g, 2),
        'fat_g': round(fat_g, 2),
    }


def aggregate_micronutrients(micronutrient_list):
    """
    Aggregate micronutrients from multiple food entries.
    
    Takes a list of micronutrient dictionaries and sums the values
    for each micronutrient across all entries.
    
    Args:
        micronutrient_list (list): List of dicts with micronutrient values
            Example: [
                {"Vitamin A": 120, "Vitamin C": 45},
                {"Vitamin A": 80, "Calcium": 250}
            ]
    
    Returns:
        dict: Dictionary with summed micronutrient values
            Example: {"Vitamin A": 200, "Vitamin C": 45, "Calcium": 250}
    """
    aggregated = {}
    
    for micronutrients in micronutrient_list:
        if not micronutrients:
            continue
            
        for nutrient, value in micronutrients.items():
            if nutrient in aggregated:
                aggregated[nutrient] += value
            else:
                aggregated[nutrient] = value
    
    # Round all values to 2 decimal places
    return {k: round(v, 2) for k, v in aggregated.items()}


def calculate_macro_calories(protein_g, carbohydrates_g, fat_g):
    """
    Calculate total calories from macronutrient amounts.
    
    Args:
        protein_g (float): Protein in grams
        carbohydrates_g (float): Carbohydrates in grams
        fat_g (float): Fat in grams
    
    Returns:
        float: Total calories, rounded to 2 decimal places
    """
    calories = (
        (protein_g * PROTEIN_KCAL_PER_G) +
        (carbohydrates_g * CARBS_KCAL_PER_G) +
        (fat_g * FAT_KCAL_PER_G)
    )
    
    return round(calories, 2)


def calculate_micronutrient_targets(age, gender):
    """
    Calculate micronutrient targets based on Recommended Dietary Allowances (RDA).
    
    Uses FDA/WHO RDA values based on age and gender.
    Returns targets in the format matching the API response (e.g., "Vitamin A, RAE (µg)").
    
    Args:
        age (int): Age in years
        gender (str): 'M' for male, 'F' for female
    
    Returns:
        dict: Dictionary with micronutrient targets matching API format
            Example: {
                "Vitamin A, RAE (µg)": 900,
                "Vitamin C (mg)": 90,
                ...
            }
    
    Raises:
        ValueError: If gender is not 'M' or 'F'
    """
    if gender not in ['M', 'F']:
        raise ValueError("Gender must be 'M' or 'F'")
    
    # Base RDA values for adults (ages 19-50)
    # Format: (male_value, female_value, unit, max_value_if_applicable)
    rda_values = {
        # Vitamins
        'Vitamin A, RAE (µg)': (900, 700, None, 3000),
        'Vitamin C (mg)': (90, 75, None, 2000),
        'Vitamin D (µg)': (15, 15, None, 100),
        'Vitamin E (alpha-tocopherol) (mg)': (15, 15, None, 1000),
        'Vitamin K (phylloquinone) (µg)': (120, 90, None, None),
        'Thiamin (mg)': (1.2, 1.1, None, None),
        'Riboflavin (mg)': (1.3, 1.1, None, None),
        'Niacin (mg)': (16, 14, None, 35),
        'Vitamin B-6 (mg)': (1.7, 1.5, None, 100),
        'Folate, DFE (µg)': (400, 400, None, 1000),
        'Folic acid (µg)': (400, 400, None, 1000),
        'Folate, food (µg)': (400, 400, None, None),
        'Folate, total (µg)': (400, 400, None, None),
        'Vitamin B-12 (µg)': (2.4, 2.4, None, None),
        'Choline, total (mg)': (550, 425, None, 3500),
        'Carotene, beta (µg)': (None, None, None, None),  # No RDA, precursor to Vitamin A
        'Lutein + zeaxanthin (µg)': (None, None, None, None),  # No RDA
        'Lycopene (µg)': (None, None, None, None),  # No RDA
        
        # Minerals
        'Calcium, Ca (mg)': (1000, 1000, None, 2500),
        'Iron, Fe (mg)': (8, 18, None, 45),  # Higher for females due to menstruation
        'Magnesium, Mg (mg)': (420, 320, None, None),
        'Phosphorus, P (mg)': (700, 700, None, 4000),
        'Potassium, K (mg)': (3400, 2600, None, None),
        'Sodium, Na (mg)': (1500, 1500, None, 2300),  # AI (Adequate Intake), not RDA
        'Zinc, Zn (mg)': (11, 8, None, 40),
        'Copper, Cu (mg)': (0.9, 0.9, None, 10),
        'Manganese, Mn (mg)': (2.3, 1.8, None, 11),
        'Selenium, Se (µg)': (55, 55, None, 400),
        
        # Fatty acids (AI values)
        'Fatty acids, total saturated (g)': (None, None, None, None),  # No target, limit instead
        'Fatty acids, total monounsaturated (g)': (None, None, None, None),
        'Fatty acids, total polyunsaturated (g)': (None, None, None, None),
        'MUFA 18:1 (g)': (None, None, None, None),
        'PUFA 18:2 (g)': (None, None, None, None),
        'PUFA 18:3 (g)': (None, None, None, None),
        
        # Water
        'Water (g)': (3700, 2700, None, None),  # AI for total water (includes beverages and food)
    }
    
    # Age adjustments for older adults (51+)
    if age >= 51:
        # Vitamin D increases for older adults
        rda_values['Vitamin D (µg)'] = (20, 20, None, 100)
        # Calcium increases for older adults
        rda_values['Calcium, Ca (mg)'] = (1200, 1200, None, 2500)
    
    # Build targets dictionary
    targets = {}
    
    for nutrient_name, (male_val, female_val, _, max_val) in rda_values.items():
        # Select value based on gender
        if gender == 'M':
            target_value = male_val
        else:
            target_value = female_val
        
        # Only include nutrients with defined RDA values
        if target_value is not None:
            # Store as number (simple format) or as object with target and maximum
            if max_val is not None:
                targets[nutrient_name] = {
                    'target': target_value,
                    'maximum': max_val
                }
            else:
                targets[nutrient_name] = target_value
    
    return targets

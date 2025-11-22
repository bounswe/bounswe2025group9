# Food Database Import Script Documentation

## Overview

This standalone Python script imports food items from a JSON file (USDA FDC API format) into the `FoodEntry` model. The script handles:

- **Parsing** JSON arrays, JSONL (one object per line), or nested JSON objects with `SurveyFoods` key
- **Extracting** macronutrients and micronutrients
- **Mapping** nutrient data to FoodEntry fields
- **Inferring** dietary options and allergens from descriptions
- **Calculating** nutrition scores using `nutrition_score.py`
- **Deduplication** using the food name as the unique identifier

The script is located at `backend/api/db_initialization/load_food_from_json.py` and can be run as a standalone utility.

---

## Usage

### Basic Usage

```bash
# Import the whole USDA Database from the backend directory
python api/db_initialization/load_food_from_json.py api/db_initialization/NewFoodDatabase.json

# Load with limit (e.g., first 10 items for testing)
python api/db_initialization/load_food_from_json.py api/db_initialization/NewFoodDatabase.json --limit 10
```

### From Docker

```bash
# Run inside the backend container
docker-compose exec backend bash -lc "cd /project && python api/db_initialization/load_food_from_json.py NewFoodDatabase/surveyDownload.json --limit 10"
```

---

## Field Mapping Reference

### Direct Mappings

| JSON Field | FoodEntry Field | 
|-----------|-----------------|
| `description` | `name` | 
| `wweiaFoodCategory.wweiaFoodCategoryDescription` | `category` | 
| `foodPortions[0].gramWeight` | `servingSize` | 

### Nutrient Mappings (from `foodNutrients` array)

The script matches nutrients by their `number` field:

| Nutrient Number | Nutrient Name | FoodEntry Field | Unit |
|-----------------|---------------|-----------------|------|
| `208` | Energy | `caloriesPerServing` | kcal |
| `203` | Protein | `proteinContent` | g |
| `204` | Total lipid (fat) | `fatContent` | g |
| `205` | Carbohydrate, by difference | `carbohydrateContent` | g |

All other nutrients with amounts > 0 are stored in `micronutrients` as a JSON dictionary.

### Inferred Fields

#### `nutritionScore`

Calculated using the `calculate_nutrition_score` function in `nutrition_score.py`.

#### `dietaryOptions` (EXPERIMENTARY) (inferred from description)

```python
# Examples:
"fat-free", "low-fat", "reduced-fat"      # Fat content
"vegetarian"                               # Plant-based
"unsweetened", "sugar-free"               # Sugar content
"lactose-free", "contains-lactose"        # Lactose status
"contains-gluten"                          # Gluten status
```

#### `allergens` (EXPERIMENTARY) (inferred from description)

Automatically creates `Allergen` objects and associates them:

```python
"milk"          # Keywords: milk, cheese, yogurt, dairy, butter, cream, whey
"eggs"          # Keywords: egg, omelet, mayonnaise
"peanuts"       # Keywords: peanut
"tree nuts"     # Keywords: nut, almond, walnut, pecan, cashew, pistachio
"fish"          # Keywords: fish, salmon, tuna, cod, halibut, anchovy
"shellfish"     # Keywords: shrimp, crab, lobster, oyster, clam, mussel
"soy"           # Keywords: soy, tofu, edamame
"wheat"         # Keywords: wheat, bread, pasta, flour
"sesame"        # Keywords: sesame
```

---

## JSON Data Structure

The script expects food items in the following structure:

```json
{
  "description": "Milk, NFS",
  "wweiaFoodCategory": {
    "wweiaFoodCategoryDescription": "Milk, reduced fat"
  },
  "foodPortions": [
    {
      "sequenceNumber": 1,
      "gramWeight": 244,
      "portionDescription": "1 cup"
    }
  ],
  "foodNutrients": [
    {
      "nutrient": {
        "number": "203",
        "name": "Protein",
        "unitName": "g"
      },
      "amount": 3.33
    },
    {
      "nutrient": {
        "number": "208",
        "name": "Energy",
        "unitName": "kcal"
      },
      "amount": 52.0
    }
  ]
}
```

### Supported Input Formats

1. **JSON Array** - Plain array of food objects:
   ```json
   [
     { "description": "Food 1", ... },
     { "description": "Food 2", ... }
   ]
   ```

2. **Nested JSON Object** - Object with `SurveyFoods` key (USDA FDC format):
   ```json
   {
     "SurveyFoods": [
       { "description": "Food 1", ... },
       { "description": "Food 2", ... }
     ]
   }
   ```

3. **JSONL (JSON Lines)** - One JSON object per line:
   ```
   {"description": "Food 1", ...}
   {"description": "Food 2", ...}
   ```

The script automatically detects and handles all three formats.

---

## Key Features

### Deduplication

Foods are matched by `name` (the `description` field). If a food with the same name already exists:
- The existing record is **updated** with new nutritional data
- **Allergen associations are preserved** (new allergens are added, not replaced)

### Flexible Nutrient Extraction

- Handles missing nutrients gracefully (defaults to 0)
- Skips zero-amount micronutrients to keep JSON clean
- Supports both nutrient IDs and numbers for flexibility

### Experimentary Intelligent Dietary Preference and Allergen Inference

The script uses regex-based keyword matching on descriptions:

```python
# Examples of detected dietary options:
"Milk, fat-free (skim)" → ["fat-free"]
"Soy milk, unsweetened" → ["vegetarian", "unsweetened"]
"Milk, lactose free, low fat (1%)" → ["lactose-free", "low-fat"]
```

WARNING: This method is experimantary and might need improvement in next PRs.

### Error Handling

In case of erros, continues loading remaining items, logs warnings

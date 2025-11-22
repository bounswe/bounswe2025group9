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
# From the backend directory
python api/db_initialization/load_food_from_json.py api/db_initialization/NewFoodDatabase.json

# Load with limit (e.g., first 10 items for testing)
python api/db_initialization/load_food_from_json.py api/db_initialization/NewFoodDatabase.json --limit 10

# Skip errors and continue loading
python api/db_initialization/load_food_from_json.py api/db_initialization/NewFoodDatabase.json --skip-errors
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

#### `nutritionScore` (0-100 scale)

Calculated based on macronutrient composition:
- **Protein ratio**: Aims for 20%+ of calories (target increases score)
- **Fat ratio**: Aims for 25-35% of calories (optimal range gets +10)
- **Carb ratio**: Aims for 45-65% of calories (optimal range gets +10)
- **Calorie density**: Lower density gets slight bonus

Formula is designed to favor balanced, nutrient-dense foods.

#### `dietaryOptions` (inferred from description)

```python
# Examples:
"fat-free", "low-fat", "reduced-fat"      # Fat content
"vegetarian"                               # Plant-based
"unsweetened", "sugar-free"               # Sugar content
"lactose-free", "contains-lactose"        # Lactose status
"contains-gluten"                          # Gluten status
```

#### `allergens` (inferred from description)

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

### Intelligent Dietary Inference

The script uses regex-based keyword matching on descriptions:

```python
# Examples of detected dietary options:
"Milk, fat-free (skim)" → ["fat-free"]
"Soy milk, unsweetened" → ["vegetarian", "unsweetened"]
"Milk, lactose free, low fat (1%)" → ["lactose-free", "low-fat"]
```

### Error Handling

- **Strict mode (default)**: Stops on first error with detailed message
- **Skip errors mode**: Continues loading remaining items, logs warnings
- All exceptions are caught with context about which food failed

---

## Example Workflow

### 1. Prepare Your JSON File

Extract food items from `surveyDownload.json` (first 100 items):

```bash
# Using jq (Unix/Linux/Mac)
cat NewFoodDatabase/surveyDownload.json | head -100 > foods_sample.json

# Or use Python
python -c "import json; f=json.load(open('NewFoodDatabase/surveyDownload.json')); json.dump(f['SurveyFoods'][:100], open('foods_sample.json','w'))"
```

### 2. Run the Import

```bash
python api/db_initialization/load_food_from_json.py foods_sample.json --limit 50
```

Output:
```
Loading foods from foods_sample.json...
Loaded 50 foods from JSON
  Created: Milk, NFS (244.0g, 52kcal, score: 58.45)
  Created: Yogurt, plain (227.0g, 150kcal, score: 71.23)
  Updated: Cheese (28.0g, 110kcal, score: 45.67)
...
✓ Successfully loaded 42 foods. Failed: 0
```

### 3. Verify in Admin

Visit Django admin (`/admin/foods/foodentry/`) to verify:
- ✓ Foods are created with correct names and categories
- ✓ Nutritional values are populated
- ✓ Nutrition scores are calculated
- ✓ Allergens are associated
- ✓ Dietary options are set
- ✓ Micronutrients are in JSON format

---

## Troubleshooting


### Issue: "Food description is missing"

Some items in the JSON don't have a `description` field. These are skipped. To see which ones:

```bash
python api/db_initialization/load_food_from_json.py file.json 2>&1 | grep "description is missing"
```

### Issue: Memory issues with large files

Use `--limit` to import in batches:

```bash
# Import first 1000
python api/db_initialization/load_food_from_json.py file.json --limit 1000

# Then import next 1000 (modify the extraction script or manually)
```

### Issue: Import fails with JSON parse errors

The script robustly handles three JSON formats. If you still see parse errors:

1. Verify your JSON file is valid:
   ```bash
   python -m json.tool surveyDownload.json > /dev/null
   ```

2. If it's a very large file with floating-point precision issues (like `0.800000000000000710...`), the bracket-matching fallback will extract the array safely.

### Issue: Duplicate allergens

Allergens are unique by name. If you re-run the script, allergens won't be duplicated — they'll be reused.

---

## Performance Considerations

- **File I/O**: Loads entire file into memory. For files >500MB, consider splitting or using JSONL format (streams line-by-line).
- **Database**: Uses `update_or_create()` which does a lookup per item. For 10,000+ items, consider batch operations.
- **Allergen Creation**: Creates allergens on-demand (one query per unique allergen found).
- **Nutrition Score**: Calculated via `nutrition_score.py` — uses the `calculate_nutrition_score()` function which analyzes macronutrient ratios and food category.

Typical speed: **100-500 items/minute** depending on server and database load.

---

## Script Architecture

The script is organized as follows:

- **`load_food_from_json.py`** - Standalone utility in `backend/api/db_initialization/`
  - `FoodLoader` class handles all food import logic
  - Django ORM setup at the top (same pattern as `load_food_data.py`)
  - `argparse` for command-line arguments
  - Can be run directly with `python load_food_from_json.py <file> [--limit N] [--skip-errors]`

- **`nutrition_score.py`** - Located in same directory
  - `calculate_nutrition_score(food_item)` function
  - Takes a `FoodEntry` instance and returns a 0-10 score
  - Considers protein, carb quality, and nutrient balance

---

## Future Enhancements

Possible improvements:

1. **Batch operations**: Use `bulk_create()` for faster inserts
2. **Streaming JSON parser**: For very large files (>1GB), use streaming parser to avoid loading entire file
3. **Progress bar**: Add `tqdm` for visual feedback during long imports
4. **Dry-run mode**: Preview changes before committing to DB
5. **Image download**: Fetch images from external sources and store locally
6. **Allergen mapping database**: Load allergen definitions from a configurable source
7. **Nutrition score customization**: Make scoring formula configurable via config file


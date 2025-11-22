# Micronutrient Data Integration - Usage Guide

## Overview

This integration adds detailed USDA FoodData Central micronutrient data to your database while preserving all existing legacy tables. Your MVP presentation data remains completely untouched.

## What Was Added

### New Database Models

1. **NutrientDefinition** - 479 nutrient types (vitamins, minerals, etc.)
2. **FoodData** - 5,434 foods with detailed USDA information
3. **FoodNutrient** - 353,017 food-nutrient relationships with amounts
4. **FoodPortion** - 22,048 serving size definitions

### Relationships

- `FoodData` has optional link to legacy `FoodEntry` via `legacy_food_entry` field
- Access USDA data from legacy model: `food_entry.usda_food_data`
- All new tables use separate table names to avoid conflicts

## Setup Instructions

### 1. Run Migrations

```bash
# Activate your virtual environment first
source venv/bin/activate  # or your venv path

# Create migration files
python manage.py makemigrations foods

# Apply migrations to database
python manage.py migrate foods
```

### 2. Import CSV Data

```bash
# Import all CSV files (takes 2-5 minutes)
python manage.py import_food_data

# Or clear existing micronutrient data first
python manage.py import_food_data --clear
```

**Expected Output:**
```
Importing nutrients from .../nutrient.csv...
  ✓ Imported 479 nutrients

Importing foods from .../food.csv...
  ✓ Imported 5,434 foods

Importing food nutrients from .../food_nutrient.csv...
  (This may take a few minutes due to large dataset...)
    Progress: 353,017 records imported...
  ✓ Imported 353,017 food-nutrient relationships

Importing food portions from .../food_portion.csv...
  ✓ Imported 22,048 food portions

✓ All CSV files imported successfully!
```

## Usage Examples

### Query Nutrients for a Food

```python
from foods.models import FoodData

# Find a food
milk = FoodData.objects.get(description__icontains="Milk, whole")

# Get all nutrients
nutrients = milk.nutrients.select_related('nutrient').all()

for fn in nutrients:
    print(f"{fn.nutrient.name}: {fn.amount} {fn.nutrient.unit_name}")
# Output: Calcium, Ca: 123 MG
#         Vitamin D: 1.1 UG
#         etc.
```

### Find Foods High in Specific Nutrient

```python
from foods.models import NutrientDefinition, FoodNutrient

# Find Vitamin C
vit_c = NutrientDefinition.objects.get(name__icontains="Vitamin C")

# Get foods with >50mg Vitamin C
high_vit_c = FoodNutrient.objects.filter(
    nutrient=vit_c,
    amount__gte=50
).select_related('food_data').order_by('-amount')[:10]

for fn in high_vit_c:
    print(f"{fn.food_data.description}: {fn.amount}mg")
```

### Get Portion Sizes

```python
from foods.models import FoodData

food = FoodData.objects.get(fdc_id=2705385)  # Milk, whole
portions = food.portions.all()

for portion in portions:
    print(f"{portion.portion_description}: {portion.gram_weight}g")
# Output: 1 cup: 244.0g
#         1 fl oz: 30.5g
#         etc.
```

### Link to Legacy FoodEntry (Optional)

```python
from foods.models import FoodEntry, FoodData

# Manual linking example
legacy_food = FoodEntry.objects.get(name="Whole Milk")
usda_food = FoodData.objects.get(description__icontains="Milk, whole")

usda_food.legacy_food_entry = legacy_food
usda_food.save()

# Now access from either direction
legacy_food.usda_food_data  # Returns FoodData
usda_food.legacy_food_entry  # Returns FoodEntry
```

## Database Schema

```
NutrientDefinition (479 records)
├── nutrient_id (unique)
├── name
├── unit_name
└── nutrient_nbr

FoodData (5,434 records)
├── fdc_id (unique)
├── description
├── data_type
├── food_category_id
├── publication_date
└── legacy_food_entry (FK to FoodEntry, optional)

FoodNutrient (353,017 records)
├── food_data (FK to FoodData)
├── nutrient (FK to NutrientDefinition)
├── amount
└── [additional metadata fields]

FoodPortion (22,048 records)
├── food_data (FK to FoodData)
├── portion_description
├── gram_weight
└── [additional fields]
```

## Verification

```bash
# Check record counts
python manage.py shell
```

```python
from foods.models import NutrientDefinition, FoodData, FoodNutrient, FoodPortion

print(f"Nutrients: {NutrientDefinition.objects.count()}")  # Should be 479
print(f"Foods: {FoodData.objects.count()}")  # Should be 5,434
print(f"Food-Nutrients: {FoodNutrient.objects.count()}")  # Should be ~353,017
print(f"Portions: {FoodPortion.objects.count()}")  # Should be ~22,048

# Verify legacy data is intact
from foods.models import FoodEntry
print(f"Legacy Foods: {FoodEntry.objects.count()}")  # Should be unchanged
```

## Troubleshooting

### Import Fails with "No such file or directory"
- Ensure CSV files are in `backend/project/food_data_csv/`
- Check file names match exactly: `nutrient.csv`, `food.csv`, `food_nutrient.csv`, `food_portion.csv`

### Slow Import Performance
- This is normal for `food_nutrient.csv` (353K records)
- Expected time: 2-5 minutes depending on hardware
- Uses batch inserts for optimal performance

### Migration Conflicts
- If you get migration conflicts, try: `python manage.py migrate foods --fake-initial`
- Or delete migration files and recreate: `python manage.py makemigrations foods`

## Notes

- **Legacy tables are NOT modified** - All existing `FoodEntry`, `FoodProposal`, etc. remain unchanged
- **Storage**: Expect ~50-100MB database growth
- **Indexes**: Optimized for common queries (by nutrient, by food, by amount)
- **Bulk Operations**: Import uses Django's `bulk_create` for performance

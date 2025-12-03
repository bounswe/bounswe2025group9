from django.db import migrations
import json
import os
from pathlib import Path

def update_images(apps, schema_editor):
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    
    # Path to the mapping file
    # Assuming the migration is run from backend/
    mapping_path = Path(__file__).parent / 'docs' / 'image_mapping.json'
    
    if not mapping_path.exists():
        print(f"Warning: Mapping file not found at {mapping_path}")
        return

    with open(mapping_path, 'r') as f:
        mapping = json.load(f)

    print(f"Loaded {len(mapping)} image mappings.")
    
    # Fetch all foods to update their images from the mapping
    foods = FoodEntry.objects.all()
    
    updated_count = 0
    for food in foods:
        # Normalize name logic (must match analyze_food_images.py)
        if not food.name:
            continue
            
        parts = food.name.split(',')
        base_name = parts[0].strip().lower()
        
        # Safe filename logic (must match generate_food_images.py)
        safe_name = base_name.replace(" ", "_").replace(",", "").replace("/", "_").replace("(", "").replace(")", "")
        
        if safe_name in mapping:
            # Only update if the URL is different to avoid unnecessary writes
            if food.imageUrl != mapping[safe_name]:
                food.imageUrl = mapping[safe_name]
                food.save()
                updated_count += 1
            
    print(f"Updated {updated_count} food items with new images.")

class Migration(migrations.Migration):

    dependencies = [
        ('foods', '0015_assign_initial_price_categories'),
    ]

    operations = [
        migrations.RunPython(update_images, migrations.RunPython.noop),
    ]

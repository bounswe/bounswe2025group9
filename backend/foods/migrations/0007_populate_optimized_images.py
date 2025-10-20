"""
Data migration to populate optimized image URLs for all food entries.
"""

from django.db import migrations
import json
import os


def populate_optimized_images(apps, schema_editor):
    """
    Populate the new image URL fields with local file paths.
    """
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    
    # Path to image mapping file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(os.path.dirname(current_dir))
    mapping_file = os.path.join(backend_dir, 'static', 'food_images', 'image_mapping.json')
    
    # Check if mapping file exists
    if not os.path.exists(mapping_file):
        print(f"⚠️  Warning: Image mapping file not found at {mapping_file}")
        print("   Skipping image population. Run download_and_optimize_images.py first.")
        return
    
    # Load image mapping
    with open(mapping_file, 'r') as f:
        image_mapping = json.load(f)
    
    # Create a dictionary mapping food names to filenames
    name_to_filename = {}
    for item in image_mapping:
        if item['success']:
            name_to_filename[item['name']] = item['filename']
    
    # Update food entries
    updated_count = 0
    for food in FoodEntry.objects.all():
        if food.name in name_to_filename:
            filename = name_to_filename[food.name]
            # Store relative paths that will be served by Django static files
            food.imageUrlHigh = f"/static/food_images/high/{filename}"
            food.imageUrlMedium = f"/static/food_images/medium/{filename}"
            food.imageUrlLow = f"/static/food_images/low/{filename}"
            food.save()
            updated_count += 1
    
    print(f"✅ Updated {updated_count} food entries with optimized images")
    print(f"   ({len(name_to_filename)} images available in mapping)")


def reverse_populate(apps, schema_editor):
    """
    Reverse the migration by clearing the new image fields.
    """
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    FoodEntry.objects.update(
        imageUrlHigh=None,
        imageUrlMedium=None,
        imageUrlLow=None
    )


class Migration(migrations.Migration):
    dependencies = [
        ('foods', '0006_add_optimized_image_fields'),
    ]

    operations = [
        migrations.RunPython(populate_optimized_images, reverse_populate),
    ]


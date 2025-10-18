# Generated migration to update food image URLs

from django.db import migrations
import json
import os


def update_food_images(apps, schema_editor):
    """
    Update existing food entries with new image URLs from foods.json
    """
    json_path = os.path.join(
        os.path.dirname(__file__), "../../api/db_initialization/foods.json"
    )
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Warning: {json_path} not found. Skipping image updates.")
        return
    
    FoodEntry = apps.get_model("foods", "FoodEntry")
    
    updated_count = 0
    not_found_count = 0
    
    for item in data:
        food_name = item["name"]
        new_image_url = item.get("imageUrl")
        
        if not new_image_url:
            continue
            
        try:
            # Find the food entry by name and update its imageUrl
            food_entry = FoodEntry.objects.get(name=food_name)
            food_entry.imageUrl = new_image_url
            food_entry.save()
            updated_count += 1
        except FoodEntry.DoesNotExist:
            print(f"Warning: Food entry '{food_name}' not found in database")
            not_found_count += 1
        except Exception as e:
            print(f"Error updating {food_name}: {e}")
    
    print(f"Food image update completed. Updated: {updated_count}, Not found: {not_found_count}")


def backwards(apps, schema_editor):
    """
    Reverse operation - set all imageUrl fields to None
    """
    FoodEntry = apps.get_model("foods", "FoodEntry")
    FoodEntry.objects.all().update(imageUrl=None)
    print("All food image URLs have been reset to None")


class Migration(migrations.Migration):

    dependencies = [
        ("foods", "0004_load_500_common_foods"),
    ]

    operations = [
        migrations.RunPython(update_food_images, backwards),
    ]


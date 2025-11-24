from django.db import migrations
from django.db.models import Q

def cleanup_empty_micros(apps, schema_editor):
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    FoodLogEntry = apps.get_model('meal_planner', 'FoodLogEntry')
    
    # Find all items with empty micronutrients
    empty_micros_items = FoodEntry.objects.filter(
        Q(micronutrients__exact={}) | Q(micronutrients__isnull=True)
    )
    
    print(f"Found {empty_micros_items.count()} items with empty micronutrients to clean up.")
    
    for item in empty_micros_items:
        # Check for logs
        log_count = FoodLogEntry.objects.filter(food_id=item.id).count()
        
        if log_count > 0:
            # Try to find a replacement
            name = item.name.strip()
            if ',' in name:
                base_name = name.split(',')[0].strip()
            else:
                base_name = name
                
            # Find a "New" item with the same base name (case insensitive)
            # and has micronutrients
            replacements = FoodEntry.objects.filter(
                name__istartswith=base_name,
                micronutrients__isnull=False
            ).exclude(micronutrients__exact={}).exclude(id=item.id)
            
            replacement = replacements.first()
            
            if replacement:
                print(f"Re-pointing {log_count} logs from '{item.name}' to '{replacement.name}'")
                FoodLogEntry.objects.filter(food_id=item.id).update(food=replacement)
                item.delete()
            else:
                print(f"SKIPPING '{item.name}' (ID: {item.id}) - Has {log_count} logs but no replacement found.")
        else:
            # No logs, safe to delete
            # print(f"Deleting '{item.name}' (ID: {item.id})")
            item.delete()

    # Explicitly delete "Organic Tomato Meatball Soup"
    soup_items = FoodEntry.objects.filter(name__iexact="Organic Tomato Meatball Soup")
    for item in soup_items:
        print(f"Explicitly deleting '{item.name}' (ID: {item.id})")
        # Nullify logs pointing to this item to allow deletion
        FoodLogEntry.objects.filter(food_id=item.id).update(food=None)
        item.delete()

class Migration(migrations.Migration):

    dependencies = [
        ('foods', '0013_propagate_images_and_cleanup'),
    ]

    operations = [
        migrations.RunPython(cleanup_empty_micros),
    ]

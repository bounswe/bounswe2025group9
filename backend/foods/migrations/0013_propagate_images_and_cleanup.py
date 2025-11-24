from django.db import migrations
from collections import defaultdict

def propagate_images_and_cleanup(apps, schema_editor):
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    
    # Fetch all food items
    all_foods = list(FoodEntry.objects.all())
    
    # Group by base name
    food_groups = defaultdict(list)
    for food in all_foods:
        name = food.name.strip()
        if ',' in name:
            base_name = name.split(',')[0].strip()
        else:
            base_name = name
        food_groups[base_name.lower()].append(food)
        
    items_to_update = []
    ids_to_delete = set()
    
    for base_name, items in food_groups.items():
        source_image = None
        source_item = None
        
        # 1. Find a source image
        # Priority 1: Exact match with base name AND has image
        for item in items:
            if item.name.lower() == base_name and item.imageUrl:
                source_image = item.imageUrl
                source_item = item
                break
        
        # Priority 2: Try to find an "Old" item with image (empty micros)
        if not source_image:
            for item in items:
                if item.imageUrl and (item.micronutrients == {} or item.micronutrients is None):
                    source_image = item.imageUrl
                    source_item = item
                    break
        
        # Priority 3: Just take the first one with an image
        if not source_image:
            for item in items:
                if item.imageUrl:
                    source_image = item.imageUrl
                    source_item = item
                    break
                    
        # If no source image found for this group, skip
        if not source_image:
            continue
            
        # 2. Identify targets (items without image) and update them
        for item in items:
            if not item.imageUrl and item.id != source_item.id:
                item.imageUrl = source_image
                items_to_update.append(item)
                
        # 3. Identify Old items to delete
        # Logic: If the group has at least one "New" item (with micros), 
        # we can safely delete all "Old" items (no micros) in this group,
        # including the source item if it was Old.
        
        has_new_item = any(item.micronutrients and item.micronutrients != {} for item in items)
        
        if has_new_item:
            for item in items:
                if item.micronutrients == {} or item.micronutrients is None:
                    ids_to_delete.add(item.id)

    # Bulk update
    if items_to_update:
        FoodEntry.objects.bulk_update(items_to_update, ['imageUrl'])
        
    # Handle deletions with re-pointing
    if ids_to_delete:
        FoodLogEntry = apps.get_model('meal_planner', 'FoodLogEntry')
        
        # We need to map old_id -> new_id for re-pointing
        # Re-iterate groups to find a suitable replacement for each old item
        for base_name, items in food_groups.items():
            # Find a "New" item (target) in this group
            target_item = None
            for item in items:
                if item.micronutrients and item.micronutrients != {}:
                    target_item = item
                    break
            
            if not target_item:
                continue
                
            # Find "Old" items in this group that are marked for deletion
            for item in items:
                if item.id in ids_to_delete:
                    # Re-point any logs pointing to this old item
                    FoodLogEntry.objects.filter(food_id=item.id).update(food=target_item)
                    
        # Now safe to delete (orphaned items)
        # Note: If an item in ids_to_delete didn't have a target found above, 
        # it might still fail if it has logs. But our logic ensures we only delete 
        # if has_new_item is True, so target_item should be found.
        FoodEntry.objects.filter(id__in=ids_to_delete).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('foods', '0012_remove_broken_image_links'),
    ]

    operations = [
        migrations.RunPython(propagate_images_and_cleanup),
    ]

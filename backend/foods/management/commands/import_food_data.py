"""
Django management command to import USDA FoodData Central CSV files.

Usage:
    python manage.py import_food_data
    python manage.py import_food_data --clear  # Clear existing data first
"""

import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
from foods.models import NutrientDefinition, FoodData, FoodNutrient, FoodPortion


class Command(BaseCommand):
    help = 'Import USDA FoodData Central CSV files into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing micronutrient data before importing',
        )

    def handle(self, *args, **options):
        csv_dir = os.path.join(settings.BASE_DIR, 'project', 'food_data_csv')
        
        if not os.path.exists(csv_dir):
            self.stdout.write(self.style.ERROR(f'CSV directory not found: {csv_dir}'))
            return

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing micronutrient data...'))
            FoodPortion.objects.all().delete()
            FoodNutrient.objects.all().delete()
            FoodData.objects.all().delete()
            NutrientDefinition.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        # Import in dependency order
        self.import_nutrients(csv_dir)
        self.import_foods(csv_dir)
        self.import_food_nutrients(csv_dir)

        # I think portion information is kinda complicated and useless.
        # self.import_food_portions(csv_dir)

        self.stdout.write(self.style.SUCCESS('\n✓ All CSV files imported successfully!'))

    def import_nutrients(self, csv_dir):
        """Import nutrient.csv"""
        csv_path = os.path.join(csv_dir, 'nutrient.csv')
        self.stdout.write(f'\nImporting nutrients from {csv_path}...')
        
        nutrients = []
        skipped = 0
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Use nutrient_nbr as the primary ID since food_nutrient.csv references it
                # Skip nutrients with decimal nutrient_nbr (e.g., "205.2")
                try:
                    nutrient_id = int(row['nutrient_nbr'])
                except ValueError:
                    skipped += 1
                    continue
                
                nutrients.append(NutrientDefinition(
                    nutrient_id=nutrient_id,
                    name=row['name'],
                    unit_name=row['unit_name'],
                    nutrient_nbr=row['nutrient_nbr'],
                    rank=float(row['rank']) if row['rank'] else None,
                ))
        
        with transaction.atomic():
            NutrientDefinition.objects.bulk_create(nutrients, batch_size=500, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Imported {len(nutrients)} nutrients (skipped {skipped} with decimal IDs)'))

    def import_foods(self, csv_dir):
        """Import food.csv"""
        csv_path = os.path.join(csv_dir, 'food.csv')
        self.stdout.write(f'\nImporting foods from {csv_path}...')
        
        foods = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                pub_date = None
                if row['publication_date']:
                    try:
                        pub_date = datetime.strptime(row['publication_date'], '%Y-%m-%d').date()
                    except ValueError:
                        pass
                
                foods.append(FoodData(
                    fdc_id=int(row['fdc_id']),
                    data_type=row['data_type'],
                    description=row['description'],
                    food_category_id=int(row['food_category_id']) if row['food_category_id'] else None,
                    publication_date=pub_date,
                ))
        
        with transaction.atomic():
            FoodData.objects.bulk_create(foods, batch_size=500, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Imported {len(foods)} foods'))

    def import_food_nutrients(self, csv_dir):
        """Import food_nutrient.csv"""
        csv_path = os.path.join(csv_dir, 'food_nutrient.csv')
        self.stdout.write(f'\nImporting food nutrients from {csv_path}...')
        self.stdout.write('  (This may take a few minutes due to large dataset...)')
        
        # Create lookup dictionaries for performance
        food_lookup = {f.fdc_id: f for f in FoodData.objects.all()}
        nutrient_lookup = {n.nutrient_id: n for n in NutrientDefinition.objects.all()}
        
        food_nutrients = []
        batch_size = 1000
        total_imported = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, 1):
                fdc_id = int(row['fdc_id'])
                nutrient_id = int(row['nutrient_id'])
                
                # Skip if food or nutrient doesn't exist
                if fdc_id not in food_lookup or nutrient_id not in nutrient_lookup:
                    continue
                
                food_nutrients.append(FoodNutrient(
                    food_data=food_lookup[fdc_id],
                    nutrient=nutrient_lookup[nutrient_id],
                    amount=float(row['amount']) if row['amount'] else 0.0,
                ))
                
                # Bulk insert in batches
                if len(food_nutrients) >= batch_size:
                    with transaction.atomic():
                        FoodNutrient.objects.bulk_create(food_nutrients, batch_size=batch_size, ignore_conflicts=True)
                    total_imported += len(food_nutrients)
                    self.stdout.write(f'    Progress: {total_imported:,} records imported...', ending='\r')
                    self.stdout.flush()
                    food_nutrients = []
        
        # Insert remaining records
        if food_nutrients:
            with transaction.atomic():
                FoodNutrient.objects.bulk_create(food_nutrients, batch_size=batch_size, ignore_conflicts=True)
            total_imported += len(food_nutrients)
        
        self.stdout.write(self.style.SUCCESS(f'\n  ✓ Imported {total_imported:,} food-nutrient relationships'))

    def import_food_portions(self, csv_dir):
        """Import food_portion.csv"""
        csv_path = os.path.join(csv_dir, 'food_portion.csv')
        self.stdout.write(f'\nImporting food portions from {csv_path}...')
        
        # Create lookup dictionary for performance
        food_lookup = {f.fdc_id: f for f in FoodData.objects.all()}
        
        food_portions = []
        batch_size = 1000
        total_imported = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                fdc_id = int(row['fdc_id'])
                
                # Skip if food doesn't exist
                if fdc_id not in food_lookup:
                    continue
                
                food_portions.append(FoodPortion(
                    food_data=food_lookup[fdc_id],
                    seq_num=int(row['seq_num']),
                    portion_description=row['portion_description'],
                    gram_weight=float(row['gram_weight']) if row['gram_weight'] else 0.0,
                ))
                
                # Bulk insert in batches
                if len(food_portions) >= batch_size:
                    with transaction.atomic():
                        FoodPortion.objects.bulk_create(food_portions, batch_size=batch_size, ignore_conflicts=True)
                    total_imported += len(food_portions)
                    food_portions = []
        
        # Insert remaining records
        if food_portions:
            with transaction.atomic():
                FoodPortion.objects.bulk_create(food_portions, batch_size=batch_size, ignore_conflicts=True)
            total_imported += len(food_portions)
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Imported {total_imported:,} food portions'))

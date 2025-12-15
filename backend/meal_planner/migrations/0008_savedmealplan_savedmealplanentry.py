# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('foods', '0001_initial'),
        ('meal_planner', '0007_add_planned_food_entry'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedMealPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='My Meal Plan', max_length=200)),
                ('description', models.TextField(blank=True, default='')),
                ('total_calories', models.DecimalField(decimal_places=2, default=0.0, max_digits=8)),
                ('total_protein', models.DecimalField(decimal_places=2, default=0.0, max_digits=7)),
                ('total_fat', models.DecimalField(decimal_places=2, default=0.0, max_digits=7)),
                ('total_carbohydrates', models.DecimalField(decimal_places=2, default=0.0, max_digits=7)),
                ('micronutrients_summary', models.JSONField(blank=True, default=dict, help_text='Aggregated micronutrient totals for the meal plan')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_meal_plans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='SavedMealPlanEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('serving_size', models.DecimalField(decimal_places=6, help_text='Serving size multiplier (e.g., 2 for two servings)', max_digits=10)),
                ('serving_unit', models.CharField(default='serving', help_text='Unit of measurement (e.g., serving, cup, gram)', max_length=50)),
                ('meal_type', models.CharField(choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner'), ('snack', 'Snack')], max_length=20)),
                ('calories', models.DecimalField(decimal_places=2, max_digits=8)),
                ('protein', models.DecimalField(decimal_places=2, max_digits=7)),
                ('carbohydrates', models.DecimalField(decimal_places=2, max_digits=7)),
                ('fat', models.DecimalField(decimal_places=2, max_digits=7)),
                ('micronutrients', models.JSONField(blank=True, default=dict, help_text='Micronutrient values for this serving')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('food', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='saved_meal_plan_entries', to='foods.foodentry')),
                ('meal_plan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entries', to='meal_planner.savedmealplan')),
            ],
            options={
                'verbose_name_plural': 'Saved Meal Plan Entries',
                'ordering': ['meal_type', 'created_at'],
            },
        ),
    ]


from django.db import migrations, models


def forwards(apps, schema_editor):
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    Micronutrient = apps.get_model('foods', 'Micronutrient')
    FEM = apps.get_model('foods', 'FoodEntryMicronutrient')

    micronutrient_cache = {}

    # Preload any existing micronutrients (rare but safe)
    for m in Micronutrient.objects.all():
        micronutrient_cache[m.name] = m

    batch = []
    BATCH_SIZE = 1000

    qs = FoodEntry.objects.all().iterator()

    for fe in qs:
        data = fe.micronutrients or {}
        for name, value in data.items():
            # unit is one of {'(mg)', '(g)', '(µg)'}
            if name.endswith('(mg)'):
                name = name[:-4].strip()
                unit = 'mg'
            elif name.endswith('(µg)'):
                name = name[:-4].strip()
                unit = 'ug'
            else:
                name = name.rstrip('(g)').strip()
                unit = 'g'

            value = float(value)

            # get or create in-memory
            mn = micronutrient_cache.get(name)
            if mn is None:
                mn = Micronutrient.objects.create(name=name, unit=unit )
                micronutrient_cache[name] = mn

            batch.append(
                FEM(
                    food_entry=fe,
                    micronutrient=mn,
                    value=value
                )
            )

            if len(batch) >= BATCH_SIZE:
                FEM.objects.bulk_create(batch)
                batch.clear()

    if batch:
        FEM.objects.bulk_create(batch)


def backwards(apps, schema_editor):
    FoodEntry = apps.get_model('foods', 'FoodEntry')
    FEM = apps.get_model('foods', 'FoodEntryMicronutrient')

    # Group micronutrients by food_entry to avoid multiple saves
    from collections import defaultdict
    food_entry_data = defaultdict(dict)

    for link in FEM.objects.select_related("food_entry", "micronutrient").iterator():
        food_entry_data[link.food_entry.id][link.micronutrient.name] = link.value

    # Update each food entry once with all its micronutrients
    for fe in FoodEntry.objects.all().iterator():
        fe.micronutrients = food_entry_data.get(fe.id, {})
        fe.save(update_fields=["micronutrients"])


class Migration(migrations.Migration):

    dependencies = [
        ('foods', '0015_assign_initial_price_categories'),
    ]

    operations = [
        migrations.CreateModel(
            name='Micronutrient',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, unique=True)),
                ("unit", models.CharField(max_length=2)),
            ],
        ),

        migrations.CreateModel(
            name='FoodEntryMicronutrient',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('value', models.FloatField()),
                (
                    'food_entry',
                    models.ForeignKey(
                        on_delete=models.CASCADE,
                        to='foods.FoodEntry'
                    )
                ),
                (
                    'micronutrient',
                    models.ForeignKey(
                        on_delete=models.CASCADE,
                        to='foods.Micronutrient'
                    )
                ),
            ],
            options={
                'unique_together': [('food_entry', 'micronutrient')],
            },
        ),

        migrations.RunPython(forwards, backwards),
    ]




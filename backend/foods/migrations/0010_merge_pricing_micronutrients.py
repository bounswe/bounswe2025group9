from django.db import migrations


class Migration(migrations.Migration):
    """
    Merge the pricing (0008_foodentry_base_price_and_more) and
    micronutrient (0008_foodentry_micronutrients_foodproposal_micronutrients)
    branches so the migration graph is linear.
    """

    dependencies = [
        ("foods", "0008_foodentry_base_price_and_more"),
        ("foods", "0008_foodentry_micronutrients_foodproposal_micronutrients"),
    ]

    operations = []


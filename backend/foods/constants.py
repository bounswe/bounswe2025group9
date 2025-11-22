from django.db import models

# Shared pricing-related choices and constants.

DEFAULT_CURRENCY = "TRY"


class PriceUnit(models.TextChoices):
    PER_100G = "per_100g", "Per 100g"
    PER_UNIT = "per_unit", "Per Unit"


class PriceCategory(models.TextChoices):
    CHEAP = "₺", "₺"
    MID = "₺ ₺", "₺ ₺"
    PREMIUM = "₺ ₺₺", "₺ ₺₺"


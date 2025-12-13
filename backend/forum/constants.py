"""
Constants for the forum app.

Standard cooking measurement units based on FDA/USDA standardization:
- FDA defines metric equivalents for common household measures
- 1 teaspoon = 5 mL
- 1 tablespoon = 15 mL  
- 1 cup = 240 mL
- 1 ounce (weight) = 28 g
"""

# Standard cooking measurement units
# These units are based on FDA/USDA standardization for recipe consistency
CUSTOM_UNITS = [
    "serving",
    "teaspoon",
    "tablespoon",
    "cup",
    "stick",
    "gram",
    "ounce",
    "pound",
    "pinch",
    "dash",
]

# Unit to grams conversion mapping
# Volume measurements use water equivalents per FDA standards (1 mL = 1 g)
# Weight measurements use direct USDA conversions
# For ingredient-specific conversions, these are approximations
UNIT_TO_GRAMS_CONVERSION = {
    "serving": 0.0,  # Dynamic: Uses food item's servingSize (handled separately)
    "teaspoon": 5.0,  # FDA: 1 tsp = 5 mL ≈ 5 g (water equivalent)
    "tablespoon": 15.0,  # FDA: 1 tbsp = 15 mL ≈ 15 g (water equivalent)
    "cup": 240.0,  # FDA: 1 cup = 240 mL ≈ 240 g (water equivalent)
    "stick": 113.0,  # Standard butter stick = 113 g (1/2 cup)
    "gram": 1.0,  # Direct conversion
    "ounce": 28.35,  # USDA: 1 oz = 28.35 g
    "pound": 453.6,  # USDA: 1 lb = 453.6 g
    "pinch": 0.36,  # Approximately 1/16 tsp ≈ 0.36 g
    "dash": 0.62,  # Approximately 1/8 tsp ≈ 0.62 g
}

# Default custom unit for new recipe ingredients
DEFAULT_CUSTOM_UNIT = "serving"


def convert_to_grams(
    custom_amount: float, custom_unit: str, serving_size: float = None
) -> float:
    """
    Convert a custom amount and unit to grams.

    Args:
        custom_amount: The amount in the custom unit
        custom_unit: The unit of measurement
        serving_size: The regular serving size of food item in grams (required when custom_unit is 'serving')

    Returns:
        The equivalent amount in grams

    Raises:
        ValueError: If the custom_unit is not in CUSTOM_UNITS or if serving_size is not provided when custom_unit is 'serving'
    """
    if custom_unit not in CUSTOM_UNITS:
        raise ValueError(
            f"Invalid custom unit: {custom_unit}. Must be one of: {', '.join(CUSTOM_UNITS)}"
        )

    if custom_unit == "serving":
        if serving_size is None:
            raise ValueError(
                "serving_size must be provided when custom_unit is 'serving'"
            )
        return custom_amount * serving_size

    conversion_rate = UNIT_TO_GRAMS_CONVERSION.get(custom_unit, 1.0)
    return custom_amount * conversion_rate

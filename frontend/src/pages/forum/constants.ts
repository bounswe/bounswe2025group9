/**
 * Constants for the forum module.
 * 
 * Standard cooking measurement units based on FDA/USDA standardization:
 * - FDA defines metric equivalents for common household measures
 * - 1 teaspoon = 5 mL
 * - 1 tablespoon = 15 mL
 * - 1 cup = 240 mL
 * - 1 ounce (weight) = 28 g
 */

/**
 * Standard cooking measurement units.
 * These units are based on FDA/USDA standardization for recipe consistency.
 */
export const CUSTOM_UNITS = [
    'serving',
    'gram',
    'teaspoon',
    'tablespoon',
    'cup',
    'stick',
    'ounce',
    'pound',
    'pinch',
    'dash',
] as const;

/**
 * Type for custom unit values
 */
export type CustomUnit = typeof CUSTOM_UNITS[number];

/**
 * Unit to grams conversion mapping
 * Volume measurements use water equivalents per FDA standards (1 mL = 1 g)
 * Weight measurements use direct USDA conversions
 * For ingredient-specific conversions, these are approximations
 */
export const UNIT_TO_GRAMS_CONVERSION: Record<CustomUnit, number> = {
    'serving': 0,         // Dynamic: Uses food item's servingSize (handled separately)
    'gram': 1.0,          // Direct conversion
    'teaspoon': 5.0,      // FDA: 1 tsp = 5 mL ≈ 5 g (water equivalent)
    'tablespoon': 15.0,   // FDA: 1 tbsp = 15 mL ≈ 15 g (water equivalent)
    'cup': 240.0,         // FDA: 1 cup = 240 mL ≈ 240 g (water equivalent)
    'stick': 113.0,       // Standard butter stick = 113 g (1/2 cup)
    'ounce': 28.35,       // USDA: 1 oz = 28.35 g
    'pound': 453.6,       // USDA: 1 lb = 453.6 g
    'pinch': 0.36,        // Approximately 1/16 tsp ≈ 0.36 g
    'dash': 0.62,         // Approximately 1/8 tsp ≈ 0.62 g
};

/**
 * Default custom unit for new recipe ingredients
 */
export const DEFAULT_CUSTOM_UNIT: CustomUnit = 'serving';

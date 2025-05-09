/**
 * Constants related to food functionality
 */

/**
 * Food categories available in the application
 */
export const FOOD_CATEGORIES = {
  FRUIT: 'Fruit',
  VEGETABLE: 'Vegetable',
  DAIRY: 'Dairy',
  MEAT: 'Meat',
  GRAIN: 'Grain',
  LEGUME: 'Legume',
  NUT_SEED: 'Nuts & Seeds',
  BEVERAGE: 'Beverage',
  SNACK: 'Snack',
  CONDIMENT: 'Condiment',
  OTHER: 'Other'
} as const;

/**
 * Common food allergens tracked in the system
 */
export const COMMON_ALLERGENS = {
  GLUTEN: 'Gluten',
  LACTOSE: 'Lactose',
  PEANUTS: 'Peanuts',
  SOY: 'Soy',
  SHELLFISH: 'Shellfish',
  EGGS: 'Eggs',
  TREE_NUTS: 'Tree Nuts',
  SESAME: 'Sesame',
  FISH: 'Fish',
  SULFITES: 'Sulfites',
  COLORANTS: 'Artificial Colorants',
  PRESERVATIVES: 'Preservatives'
} as const;

/**
 * Dietary options supported by the application
 */
export const DIETARY_OPTIONS = {
  LOW_FAT: 'Low-fat',
  HIGH_PROTEIN: 'High-protein',
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  CELIAC_FRIENDLY: 'Celiac-friendly',
  GLUTEN_FREE: 'Gluten-free',
  LACTOSE_FREE: 'Lactose-free',
} as const;

/**
 * Food sorting options for display
 */
export const FOOD_SORT_OPTIONS = {
  NAME_A_TO_Z: 'name-asc',
  NAME_Z_TO_A: 'name-desc',
  PRICE_LOW_TO_HIGH: 'price-asc',
  PRICE_HIGH_TO_LOW: 'price-desc',
  NUTRITION_SCORE: 'nutrition-score',
  COST_TO_NUTRITION_RATIO: 'cost-nutrition-ratio'
} as const;
/**
 * Constants related to forum functionality
 */

/**
 * Post tag types for forum content
 */
export const POST_TAGS = {
    NUTRITION_TIP: 'Nutrition Tip', 
    RECIPE: 'Recipe',
    MEAL_PLAN: 'Meal Plan'
  } as const;
  
  /**
   * Forum post sorting options
   */
  export const POST_SORT_OPTIONS = {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    MOST_LIKED: 'most-liked',
    MOST_COMMENTED: 'most-commented'
  } as const;
  
  /**
   * Report status types
   */
  export const REPORT_STATUS = {
    PENDING: 'pending',
    PROCESSED: 'processed'
  } as const;
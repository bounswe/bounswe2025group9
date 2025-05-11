/**
 * Constants related to forum functionality
 */

/**
 * Post tag types for forum content
 */
export const POST_TAGS = {
    DIETARY_TIP: 'Dietary Tip',
    RECIPE: 'Recipe',
    MEAL_PLAN: 'Meal Plan'
  } as const;
  
  /**
   * Report reason types for reporting inappropriate content
   */
  export const REPORT_REASONS = {
    SPAM: 'Spam',
    MISINFORMATION: 'Misinformation',
    INAPPROPRIATE_CONTENT: 'Inappropriate Content'
  } as const;
  
  /**
   * Moderation action types that can be taken on reported content
   */
  export const MODERATION_ACTIONS = {
    WARNING: 'Warning',
    POST_REMOVAL: 'Post Removal',
    SUSPENSION: 'Account Suspension',
    BAN: 'Account Ban'
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
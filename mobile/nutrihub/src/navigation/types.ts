/**
 * Navigation Types
 * 
 * Type definitions for navigation routes and parameters.
 */

/**
 * Root stack navigation parameters
 */
export type RootStackParamList = {
  /**
   * Login screen with no parameters
   */
  Login: undefined;
  
  /**
   * Main app navigator with no parameters
   */
  MainApp: undefined;
};

/**
 * Main tab navigation parameters
 */
export type MainTabParamList = {
  /**
   * Home tab with no parameters
   */
  Home: undefined;
  
  /**
   * Forum tab with no parameters
   */
  Forum: undefined;
  
  /**
   * Food tab with no parameters
   */
  Food: undefined;
};

/**
 * Food stack navigation parameters (for future implementation)
 */
export type FoodStackParamList = {
  /**
   * Food list screen with optional category filter
   */
  FoodList: {
    category?: string;
  };
  
  /**
   * Food detail screen with food item ID
   */
  FoodDetail: {
    id: number;
  };
};

/**
 * Forum stack navigation parameters (for future implementation)
 */
export type ForumStackParamList = {
  /**
   * Forum list screen with optional tag filter
   */
  ForumList: {
    tag?: string;
  };
  
  /**
   * Forum post detail screen with post ID
   */
  ForumDetail: {
    id: number;
  };
  
  /**
   * Create or edit forum post screen with optional post ID for editing
   */
  ForumPost: {
    id?: number;
  };
};
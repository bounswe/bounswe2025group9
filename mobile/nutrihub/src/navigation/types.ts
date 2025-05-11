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
   * Register screen with no parameters
   */
  Register: undefined;
  
  /**
   * Forgot password screen with no parameters
   */
  ForgotPassword: undefined;
  
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
 * Forum stack navigation parameters
 */
export type ForumStackParamList = {
  /**
   * Forum list screen
   */
  ForumList: {
    action?: 'addPost';
    postData?: SerializedForumPost;
  } | undefined;
  
  /**
   * Forum post detail screen with post ID
   */
  PostDetail: {
    postId: number;
  };
  
  /**
   * Create new forum post screen
   */
  CreatePost: undefined;
};

/**
 * Serialized version of ForumTopic for navigation
 */
export interface SerializedForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number;
  commentsCount: number;
  likesCount: number;
  isLiked: boolean;
  tags: string[]; // PostTagType[]
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}
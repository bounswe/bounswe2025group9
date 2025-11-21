/**
 * Navigation Types
 * 
 * Type definitions for navigation routes and parameters.
 */

/**
 * Root stack navigation parameters
 */
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ChangePassword: undefined; // Changed from ForgotPassword
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
  
  /**
   * My Profile tab with no parameters
   */
  MyProfile: undefined;
  
  /**
   * Feed tab with no parameters (kept for backwards compatibility)
   */
  Feed: undefined;
  
  /**
   * Post detail accessible from Home/Feed
   */
  PostDetail: {
    postId: number;
  };
  
  /**
   * User profile accessible from Home/Feed
   */
  UserProfile: {
    username: string;
    userId?: number;
  };
  
  /**
   * Followers list accessible from profiles
   */
  FollowersList: {
    username: string;
  };
  
  /**
   * Following list accessible from profiles
   */
  FollowingList: {
    username: string;
  };
};

/**
 * Food stack navigation parameters
 */
export type FoodStackParamList = {
  /**
   * Food list screen with optional category filter
   */
  FoodList: undefined;
  
  /**
   * Food detail screen with food item ID
   */
  FoodDetail: {
    id: number;
  };

  /**
   * Food comparison screen
   */
  FoodCompare: undefined;
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
    // When set, ForumList should immediately navigate to the target screen
    openUserProfile?: {
      username: string;
      userId?: number;
    };
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

  /**
   * View another user's public profile
   */
  UserProfile: {
    username: string;
    userId?: number;
  };

  /**
   * List of followers for a user
   */
  FollowersList: {
    username: string;
  };

  /**
   * List of users that a user is following
   */
  FollowingList: {
    username: string;
  };
};

/**
 * Profile stack navigation parameters
 */
export type ProfileStackParamList = {
  /**
   * Main profile overview screen (profile info, stats, settings hub)
   */
  ProfileOverview: undefined;
  
  /**
   * My posts and content screen
   */
  MyPosts: undefined;
  
  /**
   * Allergen selection screen
   */
  AllergenSelection: undefined;
  
  /**
   * Personal recipes screen
   */
  PersonalRecipes: undefined;
  
  /**
   * Contact information screen
   */
  ContactInfo: undefined;
  
  /**
   * Liked posts screen
   */
  LikedPosts: undefined;
  
  /**
   * Liked recipes screen
   */
  LikedRecipes: undefined;
  
  /**
   * Profession tags screen
   */
  ProfessionTags: undefined;
  
  /**
   * Account warnings screen
   */
  AccountWarnings: undefined;
  
  /**
   * Report user screen
   */
  ReportUser: {
    userId: number;
    username: string;
  };
  
  /**
   * Nutrition tracking screen
   */
  NutritionTracking: undefined;
};

/**
 * Serialized version of ForumTopic for navigation
 * This matches the API response structure
 */
export interface SerializedForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number;
  commentsCount: number;
  likesCount: number;
  isLiked: boolean; // Changed from isLiked?: boolean to isLiked: boolean
  tags: string[];
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}
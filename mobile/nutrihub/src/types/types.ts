/**
 * Common type definitions for the application
 */
import { FOOD_CATEGORIES, DIETARY_OPTIONS, COMMON_ALLERGENS } from '../constants/foodConstants';
import { POST_TAGS, POST_SORT_OPTIONS } from '../constants/forumConstants';

/**
 * Theme type
 */
export type ThemeType = 'dark' | 'light';

/**
 * Food-related types
 */
export type FoodCategoryType = typeof FOOD_CATEGORIES[keyof typeof FOOD_CATEGORIES];
export type DietaryOptionType = typeof DIETARY_OPTIONS[keyof typeof DIETARY_OPTIONS];
export type AllergenType = typeof COMMON_ALLERGENS[keyof typeof COMMON_ALLERGENS];

export interface FoodItem {
  id: number;
  title: string;
  description: string;
  iconName: string; // Icon name from MaterialCommunityIcons
  category: FoodCategoryType;
  imageUrl?: string;
  nutritionScore?: number;
  macronutrients?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  dietaryOptions?: DietaryOptionType[];
  allergens?: AllergenType[];
  price?: number;
}

/**
 * Food filtering types
 */
export interface FoodFilters {
  name?: string;
  category?: FoodCategoryType;
  minPrice?: number;
  maxPrice?: number;
  minNutritionScore?: number;
  maxNutritionScore?: number;
  dietaryOptions?: DietaryOptionType[];
  allergens?: AllergenType[];
}

/**
 * Forum-related types
 */
export type PostTagType = typeof POST_TAGS[keyof typeof POST_TAGS];
export type PostSortOptionType = typeof POST_SORT_OPTIONS[keyof typeof POST_SORT_OPTIONS];

/**
 * Forum topic model matching backend API structure
 */
export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number;
  authorDisplayName?: string;
  authorProfileImage?: string;
  commentsCount: number;
  likesCount: number;
  isLiked?: boolean;
  tags: string[]; // Using string instead of PostTagType to accommodate any tag from API
  createdAt: Date;
  updatedAt?: Date;
  hasRecipe?: boolean;
}

/**
 * Comment model matching backend API structure
 */
export interface Comment {
  id: number;
  postId: number;
  content: string;
  author: string;
  authorId: number;
  authorDisplayName?: string;
  authorProfileImage?: string;
  createdAt: Date;
  likesCount: number;
  isLiked?: boolean;
}

/**
 * Recipe model matching backend API structure
 */
export interface Recipe {
  id: number;
  post_id: number;
  instructions: string;
  ingredients: RecipeIngredient[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Lightweight recipe data returned on user profiles
 */
export interface UserRecipeSummary {
  id: number;
  name: string;
  ingredients?: RecipeIngredient[];
}

/**
 * Recipe ingredient model
 */
export interface RecipeIngredient {
  food_id: number;
  food_name: string;
  amount: number; // In grams
}

/**
 * User-related types
 */
export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  surname?: string;
  address?: string;
  tags?: ProfessionTag[];
  allergens?: Allergen[];
  recipes?: UserRecipeSummary[];
  createdAt?: Date;
  profile_image?: string | null;
  profession?: string;
  bio?: string;
  badges?: string[];
  phone?: string;
  location?: string;
  website?: string;
  social_links?: SocialLink[];
  profession_tags?: ProfessionTag[];
  custom_allergens?: string[];
  privacy_settings?: PrivacySettings;
  account_warnings?: AccountWarning[];
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

/**
 * Social media links
 */
export interface SocialLink {
  platform: string;
  url: string;
}

/**
 * Profession tag with verification status
 */
export interface ProfessionTag {
  id: number;
  name: string;
  verified: boolean;
  certificate?: string | null;
}

/**
 * Privacy settings for profile visibility
 */
export interface PrivacySettings {
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  show_profession_tags: boolean;
  show_recipes: boolean;
  show_posts: boolean;
  show_badges: boolean;
}

/**
 * Account warnings and disciplinary actions
 */
export interface AccountWarning {
  id: number;
  type: 'warning' | 'post_removal' | 'ban' | 'suspension';
  reason: string;
  description: string;
  issued_at: Date;
  expires_at?: Date;
  issued_by: string;
  is_active: boolean;
}

/**
 * Report types for user reporting
 */
export type ReportType = 'invalid_certificate' | 'misleading_information';

/**
 * User report
 */
export interface UserReport {
  id: number;
  reported_user_id: number;
  report_type: ReportType;
  description: string;
  created_at: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: Date;
}

/**
 * Allergen types
 */
export interface Allergen {
  id: string;
  name: string;
  category: 'common' | 'additive';
  is_custom?: boolean;
}


/**
 * Profession tag options
 */
export const PROFESSION_TAGS = [
  'Dietitian',
  'Nutritionist',
  'Chef',
  'Food Scientist',
  'Health Coach',
  'Personal Trainer',
  'Doctor',
  'Nurse',
  'Pharmacist',
  'Researcher',
] as const;

export type ProfessionTagType = typeof PROFESSION_TAGS[number];

export interface AuthTokens {
  access: string;
  refresh: string;
}

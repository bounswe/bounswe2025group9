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

export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number;
  commentsCount: number;
  likesCount: number;
  isLiked?: boolean;
  tags: PostTagType[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  author: string;
  authorId: number;
  createdAt: Date;
  likesCount: number;
  isLiked?: boolean;
}

export interface ForumComment {
  id: number;
  topicId: number;
  content: string;
  author: string;
  authorId: number;
  likesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt?: Date;
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
  profilePicture?: string;
  dietaryPreferences?: DietaryOptionType[];
  allergens?: AllergenType[];
  isProfessional?: boolean;
  professionalRole?: 'dietitian' | 'store_owner';
  createdAt: Date;
}
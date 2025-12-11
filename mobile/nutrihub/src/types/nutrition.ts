// Types for Nutrition Tracking Feature

export interface MacroNutrient {
  name: 'protein' | 'carbohydrates' | 'fat' | 'calories';
  current: number;
  target: number;
  unit: string;
}

export interface MicroNutrient {
  name: string;
  current: number;
  target: number;
  maximum?: number; // Maximum safe threshold
  unit: string;
  category: 'vitamin' | 'mineral';
}

export interface FoodLogEntry {
  id: number;
  food_id: number;
  food_name: string;
  food_serving_size?: number; // Original serving size of the food in grams (from database)
  serving_size: number;
  serving_unit: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  image_url?: string;
  logged_at: string;
}

export interface DailyNutritionLog {
  date: string; // ISO date string (YYYY-MM-DD)
  total_calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fat: number;
  micronutrients_summary: { [key: string]: number };
  entries?: FoodLogEntry[];
  targets?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  adherence?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface NutritionTargets {
  calories: number;
  protein: number; // in grams
  carbohydrates: number; // in grams
  fat: number; // in grams
  micronutrients: {
    [key: string]: number;
  };
  is_custom: boolean;
  bmr: number;
  tdee: number;
  created_at: string;
  updated_at: string;
}

export interface UserMetrics {
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: 'M' | 'F';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  bmr?: number;
  tdee?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Private Food - User's custom food items stored locally
 * These foods are not synced to the backend and can be used immediately
 * in nutrition tracking without admin approval.
 */
export interface PrivateFood {
  id: string; // UUID for local identification
  name: string;
  category: string;
  servingSize: number; // in grams
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  micronutrients?: Record<string, number>;
  dietaryOptions?: string[];
  createdAt: string;
  updatedAt: string;
  // Flag to track origin
  sourceType: 'custom' | 'modified_proposal';
  originalFoodId?: number; // If modified from a proposal
}


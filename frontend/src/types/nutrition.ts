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
  food_serving_size: number; // Original serving size of the food (e.g., 100g)
  image_url: string; // Image URL from the food
  serving_size: number;
  serving_unit: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  micronutrients?: { [key: string]: number };
  logged_at: string;
}

export interface DailyNutritionLog {
  date: string; // ISO date string (YYYY-MM-DD)
  total_calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fat: number;
  micronutrients_summary: { [key: string]: number };
  entries?: FoodLogEntry[]; // Optional because history endpoint doesn't return entries
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

export interface NutritionStatistics {
  period: 'week' | 'month';
  start_date: string;
  end_date: string;
  statistics: {
    avg_calories: number;
    avg_protein: number;
    avg_carbohydrates: number;
    avg_fat: number;
    days_logged: number;
    streak_days: number;
    adherence: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
    };
  };
}


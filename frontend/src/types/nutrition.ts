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
  id: number;
  user_id: number;
  date: string; // ISO date string (YYYY-MM-DD)
  entries: FoodLogEntry[];
  total_calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fat: number;
  micronutrients: MicroNutrient[];
}

export interface NutritionTargets {
  id: number;
  user_id: number;
  calories: number;
  protein: number; // in grams
  carbohydrates: number; // in grams
  fat: number; // in grams
  micronutrients: {
    [key: string]: {
      target: number;
      maximum?: number;
      unit: string;
    };
  };
  calculated_from_metrics: boolean; // true if auto-calculated
  last_updated: string;
}

export interface UserMetrics {
  height: number; // in cm
  weight: number; // in kg
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}


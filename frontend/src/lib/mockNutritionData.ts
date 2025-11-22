// Mock data for Nutrition Tracking feature
import { DailyNutritionLog, NutritionTargets, UserMetrics } from '../types/nutrition';

// Mock user metrics
export const mockUserMetrics: UserMetrics = {
  height: 175, // cm
  weight: 70, // kg
  age: 30,
  gender: 'male',
  activity_level: 'moderate'
};

// Mock nutrition targets (auto-calculated from metrics)
export const mockNutritionTargets: NutritionTargets = {
  id: 1,
  user_id: 1,
  calories: 2500,
  protein: 150, // grams
  carbohydrates: 300, // grams
  fat: 83, // grams
  micronutrients: {
    'Vitamin A': { target: 900, maximum: 3000, unit: 'mcg' },
    'Vitamin C': { target: 90, maximum: 2000, unit: 'mg' },
    'Vitamin D': { target: 20, maximum: 100, unit: 'mcg' },
    'Vitamin E': { target: 15, maximum: 1000, unit: 'mg' },
    'Vitamin K': { target: 120, unit: 'mcg' },
    'Thiamin (B1)': { target: 1.2, unit: 'mg' },
    'Riboflavin (B2)': { target: 1.3, unit: 'mg' },
    'Niacin (B3)': { target: 16, maximum: 35, unit: 'mg' },
    'Vitamin B6': { target: 1.7, maximum: 100, unit: 'mg' },
    'Folate (B9)': { target: 400, maximum: 1000, unit: 'mcg' },
    'Vitamin B12': { target: 2.4, unit: 'mcg' },
    'Calcium': { target: 1000, maximum: 2500, unit: 'mg' },
    'Iron': { target: 8, maximum: 45, unit: 'mg' },
    'Magnesium': { target: 400, unit: 'mg' },
    'Phosphorus': { target: 700, maximum: 4000, unit: 'mg' },
    'Potassium': { target: 3400, unit: 'mg' },
    'Sodium': { target: 1500, maximum: 2300, unit: 'mg' },
    'Zinc': { target: 11, maximum: 40, unit: 'mg' },
    'Copper': { target: 0.9, maximum: 10, unit: 'mg' },
    'Selenium': { target: 55, maximum: 400, unit: 'mcg' }
  },
  calculated_from_metrics: true,
  last_updated: new Date().toISOString()
};

// Mock daily nutrition log for today
export const mockTodayLog: DailyNutritionLog = {
  id: 1,
  user_id: 1,
  date: new Date().toISOString().split('T')[0],
  entries: [
    // Breakfast
    {
      id: 1,
      food_id: 783, // Yogurt from database
      food_name: 'Yogurt',
      serving_size: 200,
      serving_unit: 'g',
      meal_type: 'breakfast',
      calories: 150,
      protein: 20,
      carbohydrates: 8,
      fat: 4,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    {
      id: 2,
      food_id: 35, // Almonds from database
      food_name: 'Almonds',
      serving_size: 30,
      serving_unit: 'g',
      meal_type: 'breakfast',
      calories: 200,
      protein: 8,
      carbohydrates: 8,
      fat: 18,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    // Lunch
    {
      id: 3,
      food_id: 271, // Chicken Breast from database
      food_name: 'Chicken Breast',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 248,
      protein: 47,
      carbohydrates: 0,
      fat: 5,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    {
      id: 4,
      food_id: 767, // Broccoli from database
      food_name: 'Broccoli',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 55,
      protein: 4,
      carbohydrates: 11,
      fat: 0.5,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    {
      id: 5,
      food_id: 591, // Wheat Bread from database
      food_name: 'Wheat Bread',
      serving_size: 60,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 160,
      protein: 8,
      carbohydrates: 30,
      fat: 2,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    // Snack
    {
      id: 6,
      food_id: 55, // Walnuts from database
      food_name: 'Walnuts',
      serving_size: 30,
      serving_unit: 'g',
      meal_type: 'snack',
      calories: 200,
      protein: 6,
      carbohydrates: 8,
      fat: 18,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    // Dinner
    {
      id: 7,
      food_id: 895, // Salmon from database
      food_name: 'Salmon',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 312,
      protein: 39,
      carbohydrates: 0,
      fat: 18,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    {
      id: 8,
      food_id: 463, // Rice from database
      food_name: 'Rice',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 195,
      protein: 4,
      carbohydrates: 43,
      fat: 0.4,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    },
    {
      id: 9,
      food_id: 767, // Broccoli from database (can have same food multiple times)
      food_name: 'Broccoli',
      serving_size: 100,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 34,
      protein: 3,
      carbohydrates: 7,
      fat: 0.4,
      image_url: '', // Will be fetched from backend
      logged_at: new Date().toISOString()
    }
  ],
  total_calories: 1554,
  total_protein: 139,
  total_carbohydrates: 115,
  total_fat: 66,
  micronutrients: [
    // Vitamins
    { name: 'Vitamin A', current: 750, target: 900, maximum: 3000, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin C', current: 120, target: 90, maximum: 2000, unit: 'mg', category: 'vitamin' },
    { name: 'Vitamin D', current: 15, target: 20, maximum: 100, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin E', current: 12, target: 15, maximum: 1000, unit: 'mg', category: 'vitamin' },
    { name: 'Vitamin K', current: 95, target: 120, unit: 'mcg', category: 'vitamin' },
    { name: 'Thiamin (B1)', current: 1.0, target: 1.2, unit: 'mg', category: 'vitamin' },
    { name: 'Riboflavin (B2)', current: 1.1, target: 1.3, unit: 'mg', category: 'vitamin' },
    { name: 'Niacin (B3)', current: 14, target: 16, maximum: 35, unit: 'mg', category: 'vitamin' },
    { name: 'Vitamin B6', current: 1.5, target: 1.7, maximum: 100, unit: 'mg', category: 'vitamin' },
    { name: 'Folate (B9)', current: 350, target: 400, maximum: 1000, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin B12', current: 3.2, target: 2.4, unit: 'mcg', category: 'vitamin' },
    // Minerals
    { name: 'Calcium', current: 850, target: 1000, maximum: 2500, unit: 'mg', category: 'mineral' },
    { name: 'Iron', current: 12, target: 8, maximum: 45, unit: 'mg', category: 'mineral' },
    { name: 'Magnesium', current: 320, target: 400, unit: 'mg', category: 'mineral' },
    { name: 'Phosphorus', current: 950, target: 700, maximum: 4000, unit: 'mg', category: 'mineral' },
    { name: 'Potassium', current: 2800, target: 3400, unit: 'mg', category: 'mineral' },
    { name: 'Sodium', current: 1800, target: 1500, maximum: 2300, unit: 'mg', category: 'mineral' },
    { name: 'Zinc', current: 9, target: 11, maximum: 40, unit: 'mg', category: 'mineral' },
    { name: 'Copper', current: 0.8, target: 0.9, maximum: 10, unit: 'mg', category: 'mineral' },
    { name: 'Selenium', current: 60, target: 55, maximum: 400, unit: 'mcg', category: 'mineral' }
  ]
};

// Mock historical logs (previous days)
export const mockHistoricalLogs: DailyNutritionLog[] = [
  {
    id: 2,
    user_id: 1,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    entries: [],
    total_calories: 2200,
    total_protein: 130,
    total_carbohydrates: 250,
    total_fat: 80,
    micronutrients: []
  },
  {
    id: 3,
    user_id: 1,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    entries: [],
    total_calories: 2100,
    total_protein: 145,
    total_carbohydrates: 220,
    total_fat: 75,
    micronutrients: []
  },
  {
    id: 4,
    user_id: 1,
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
    entries: [],
    total_calories: 2400,
    total_protein: 155,
    total_carbohydrates: 280,
    total_fat: 85,
    micronutrients: []
  }
];


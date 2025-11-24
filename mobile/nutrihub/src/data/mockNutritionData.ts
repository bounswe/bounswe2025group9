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
      food_id: 783,
      food_name: 'Yogurt',
      serving_size: 200,
      serving_unit: 'g',
      meal_type: 'breakfast',
      calories: 150,
      protein: 20,
      carbohydrates: 8,
      fat: 4,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 2,
      food_id: 35,
      food_name: 'Almonds',
      serving_size: 30,
      serving_unit: 'g',
      meal_type: 'breakfast',
      calories: 200,
      protein: 8,
      carbohydrates: 8,
      fat: 18,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 3,
      food_id: 56,
      food_name: 'Banana',
      serving_size: 120,
      serving_unit: 'g',
      meal_type: 'breakfast',
      calories: 150,
      protein: 2,
      carbohydrates: 35,
      fat: 0.5,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    // Lunch
    {
      id: 4,
      food_id: 271,
      food_name: 'Chicken Breast',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 248,
      protein: 47,
      carbohydrates: 0,
      fat: 5,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 5,
      food_id: 767,
      food_name: 'Broccoli',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 55,
      protein: 4,
      carbohydrates: 11,
      fat: 0.5,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 6,
      food_id: 591,
      food_name: 'Wheat Bread',
      serving_size: 60,
      serving_unit: 'g',
      meal_type: 'lunch',
      calories: 160,
      protein: 8,
      carbohydrates: 30,
      fat: 2,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    // Snack
    {
      id: 7,
      food_id: 55,
      food_name: 'Walnuts',
      serving_size: 30,
      serving_unit: 'g',
      meal_type: 'snack',
      calories: 200,
      protein: 6,
      carbohydrates: 8,
      fat: 18,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    // Dinner
    {
      id: 8,
      food_id: 895,
      food_name: 'Salmon',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 312,
      protein: 39,
      carbohydrates: 0,
      fat: 18,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 9,
      food_id: 463,
      food_name: 'Rice',
      serving_size: 150,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 195,
      protein: 4,
      carbohydrates: 43,
      fat: 0.4,
      image_url: '',
      logged_at: new Date().toISOString()
    },
    {
      id: 10,
      food_id: 767,
      food_name: 'Broccoli',
      serving_size: 100,
      serving_unit: 'g',
      meal_type: 'dinner',
      calories: 34,
      protein: 3,
      carbohydrates: 7,
      fat: 0.4,
      image_url: '',
      logged_at: new Date().toISOString()
    }
  ],
  total_calories: 2680, // 107% of target (2500) - slightly over
  total_protein: 165, // 110% of target (150) - acceptable for protein
  total_carbohydrates: 315, // 105% of target (300) - slightly over
  total_fat: 95, // 114% of target (83) - moderately over
  micronutrients: [
    // Vitamins
    { name: 'Vitamin A', current: 750, target: 900, maximum: 3000, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin C', current: 120, target: 90, maximum: 2000, unit: 'mg', category: 'vitamin' },
    { name: 'Vitamin D', current: 15, target: 20, maximum: 100, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin E', current: 12, target: 15, maximum: 1000, unit: 'mg', category: 'vitamin' },
    { name: 'Vitamin K', current: 95, target: 120, unit: 'mcg', category: 'vitamin' },
    { name: 'Thiamin (B1)', current: 1.0, target: 1.2, unit: 'mg', category: 'vitamin' },
    { name: 'Riboflavin (B2)', current: 1.1, target: 1.3, unit: 'mg', category: 'vitamin' },
    { name: 'Niacin (B3)', current: 38, target: 16, maximum: 35, unit: 'mg', category: 'vitamin' }, // OVER MAXIMUM - shows warning
    { name: 'Vitamin B6', current: 1.5, target: 1.7, maximum: 100, unit: 'mg', category: 'vitamin' },
    { name: 'Folate (B9)', current: 350, target: 400, maximum: 1000, unit: 'mcg', category: 'vitamin' },
    { name: 'Vitamin B12', current: 3.2, target: 2.4, unit: 'mcg', category: 'vitamin' },
    // Minerals
    { name: 'Calcium', current: 850, target: 1000, maximum: 2500, unit: 'mg', category: 'mineral' },
    { name: 'Iron', current: 12, target: 8, maximum: 45, unit: 'mg', category: 'mineral' },
    { name: 'Magnesium', current: 320, target: 400, unit: 'mg', category: 'mineral' },
    { name: 'Phosphorus', current: 950, target: 700, maximum: 4000, unit: 'mg', category: 'mineral' },
    { name: 'Potassium', current: 2800, target: 3400, unit: 'mg', category: 'mineral' },
    { name: 'Sodium', current: 2450, target: 1500, maximum: 2300, unit: 'mg', category: 'mineral' }, // OVER MAXIMUM - shows warning
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
    total_calories: 3500, // 140% - severely over (shows red warning)
    total_protein: 180, // 120% - moderate over for protein
    total_carbohydrates: 410, // 137% - severely over
    total_fat: 95, // 114% - moderately over
    micronutrients: []
  },
  {
    id: 3,
    user_id: 1,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    entries: [],
    total_calories: 2300, // 92% - under target, good day
    total_protein: 155, // 103% - perfect for protein
    total_carbohydrates: 270, // 90% - on track
    total_fat: 75, // 90% - on track
    micronutrients: []
  },
  {
    id: 4,
    user_id: 1,
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
    entries: [],
    total_calories: 1200, // 48% - VERY LOW (shows red alert)
    total_protein: 65, // 43% - very low
    total_carbohydrates: 180, // 60% - low
    total_fat: 40, // 48% - very low
    micronutrients: []
  },
  {
    id: 5,
    user_id: 1,
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
    entries: [],
    total_calories: 1600, // 64% - LOW (shows orange warning)
    total_protein: 95, // 63% - low
    total_carbohydrates: 200, // 67% - low
    total_fat: 50, // 60% - low
    micronutrients: []
  },
  {
    id: 6,
    user_id: 1,
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 days ago
    entries: [],
    total_calories: 2000, // 80% - FAIR (shows orange, trending up)
    total_protein: 120, // 80% - fair
    total_carbohydrates: 240, // 80% - fair
    total_fat: 66, // 80% - fair
    micronutrients: []
  },
  {
    id: 7,
    user_id: 1,
    date: new Date(Date.now() - 518400000).toISOString().split('T')[0], // 6 days ago
    entries: [],
    total_calories: 2350,
    total_protein: 142,
    total_carbohydrates: 268,
    total_fat: 79,
    micronutrients: []
  },
  {
    id: 8,
    user_id: 1,
    date: new Date(Date.now() - 604800000).toISOString().split('T')[0], // 7 days ago
    entries: [],
    total_calories: 2280,
    total_protein: 135,
    total_carbohydrates: 255,
    total_fat: 76,
    micronutrients: []
  },
  {
    id: 9,
    user_id: 1,
    date: new Date(Date.now() - 691200000).toISOString().split('T')[0], // 8 days ago
    entries: [],
    total_calories: 2420,
    total_protein: 148,
    total_carbohydrates: 272,
    total_fat: 81,
    micronutrients: []
  },
  {
    id: 10,
    user_id: 1,
    date: new Date(Date.now() - 777600000).toISOString().split('T')[0], // 9 days ago
    entries: [],
    total_calories: 2180,
    total_protein: 138,
    total_carbohydrates: 245,
    total_fat: 73,
    micronutrients: []
  },
  {
    id: 11,
    user_id: 1,
    date: new Date(Date.now() - 864000000).toISOString().split('T')[0], // 10 days ago
    entries: [],
    total_calories: 2380,
    total_protein: 152,
    total_carbohydrates: 265,
    total_fat: 80,
    micronutrients: []
  }
];


/**
 * NutritionTrackingScreen Tests
 * 
 * Basic tests for the nutrition tracking screen functionality
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import NutritionTrackingScreen from '../src/screens/nutrition/NutritionTrackingScreen';

// Mock ThemeContext
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      background: '#ffffff',
      card: '#f9f9f9',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      error: '#dc2626',
      warning: '#f59e0b',
      success: '#10b981',
    },
    textStyles: {
      heading2: { fontSize: 24, fontWeight: 'bold' },
      heading3: { fontSize: 20, fontWeight: 'bold' },
      heading4: { fontSize: 18, fontWeight: 'bold' },
      body: { fontSize: 16 },
      caption: { fontSize: 12 },
      small: { fontSize: 10 },
      button: { fontSize: 16, fontWeight: '600' },
    },
  }),
}));

// Mock LanguageContext (i18n)
jest.mock('../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, options?: any) => {
      const dict: Record<string, string> = {
        'nutrition.tracking': 'Nutrition Tracking',
        'nutrition.breakfast': 'Breakfast',
        'nutrition.lunch': 'Lunch',
        'nutrition.dinner': 'Dinner',
        'nutrition.snack': 'Snack',
        'nutrition.meals': 'Meals',
        'nutrition.todaysMeals': "Today's Meals",
        'nutrition.loadingNutritionData': 'Loading nutrition data...',
        'nutrition.setupRequired': 'Setup Required',
        'nutrition.setupRequiredDesc': 'To track your nutrition, we need some basic information about you. Please set up your metrics to get started.',
        'nutrition.nutritionPreview': 'Nutrition Preview',
        'food.addFood': 'Add Food',
        'food.calories': 'Calories',
        'food.protein': 'Protein',
        'food.carbohydrates': 'Carbs',
        'food.fat': 'Fat',
        'metrics.kcal': 'kcal',
        'common.today': 'Today',
        'common.thisWeek': 'This Week',
        'common.daily': 'Daily',
        'common.weekly': 'Weekly',
        'common.item': 'item',
        'common.items': 'items',
        'common.update': 'Update',
        'common.gotIt': 'Got it',
        'profile.setMetrics': 'Set Up Metrics',
      };

      if (dict[key]) return dict[key];
      if (options?.count !== undefined && typeof options?.count === 'number') {
        return options.count === 1 ? 'item' : 'items';
      }
      return key;
    },
  }),
}));

// Mock navigation
let mockFocusEffectCalled = false;
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  useFocusEffect: jest.fn((callback) => {
    // Only call callback once (across renders) to avoid infinite loops
    if (!mockFocusEffectCalled && typeof callback === 'function') {
      mockFocusEffectCalled = true;
      try {
        callback();
      } catch (e) {
        // Ignore errors in test
      }
    }
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'MockSafeAreaView',
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MockIcon',
}));

// Mock MacronutrientCard component
jest.mock('../src/components/nutrition/MacronutrientCard', () => {
  return 'MockMacronutrientCard';
});

// Mock MicronutrientPanel component
jest.mock('../src/components/nutrition/MicronutrientPanel', () => {
  return 'MockMicronutrientPanel';
});

// Mock nutrition service
jest.mock('../src/services/api/nutrition.service', () => ({
  nutritionService: {
    getUserMetrics: jest.fn().mockResolvedValue({
      height: 175,
      weight: 75,
      age: 25,
      gender: 'M',
      activity_level: 'moderate',
    }),
    getTargets: jest.fn().mockResolvedValue({
      calories: 2000,
      protein: 150,
      carbohydrates: 250,
      fat: 70,
      micronutrients: {},
      is_custom: true,
      bmr: 1500,
      tdee: 2200,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    getDailyLog: jest.fn().mockResolvedValue({
      date: new Date().toISOString().split('T')[0],
      total_calories: 0,
      total_protein: 0,
      total_carbohydrates: 0,
      total_fat: 0,
      micronutrients_summary: {},
      entries: [
        {
          id: 1,
          food_id: 101,
          food_name: 'Eggs',
          serving_size: 1,
          serving_unit: 'serving',
          meal_type: 'breakfast',
          calories: 100,
          protein: 10,
          carbohydrates: 1,
          fat: 7,
          logged_at: new Date().toISOString(),
        },
      ],
    }),
    getLogsForRange: jest.fn().mockResolvedValue([]),
    addFoodEntry: jest.fn(),
    updateFoodEntry: jest.fn(),
    deleteFoodEntry: jest.fn(),
  },
}));

// Mock private food service (AsyncStorage-backed)
jest.mock('../src/services/api/privateFood.service', () => ({
  privateFoodService: {
    getPrivateFoodEntries: jest.fn().mockResolvedValue([]),
    addPrivateFoodEntry: jest.fn(),
  },
}));

// Mock FoodSelectorModal
jest.mock('../src/components/food/FoodSelectorModal', () => {
  return 'MockFoodSelectorModal';
});

// Mock UserMetricsModal
jest.mock('../src/components/nutrition/UserMetricsModal', () => {
  return 'MockUserMetricsModal';
});

// Mock TextInput
jest.mock('../src/components/common/TextInput', () => {
  return 'MockTextInput';
});

describe('NutritionTrackingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusEffectCalled = false;
  });

  it('should render without crashing', () => {
    // Basic smoke test - just verify it renders
    let component: any;
    expect(() => {
      component = render(<NutritionTrackingScreen />);
    }).not.toThrow();
    
    expect(component).toBeTruthy();
  });

  it('should handle component mount without errors', () => {
    const { root } = render(<NutritionTrackingScreen />);
    expect(root).toBeTruthy();
  });

  it('should render translated meal section labels', async () => {
    const { getByText } = render(<NutritionTrackingScreen />);

    await waitFor(() => {
      expect(getByText('Breakfast')).toBeTruthy();
      expect(getByText('Lunch')).toBeTruthy();
      expect(getByText('Dinner')).toBeTruthy();
      expect(getByText('Snack')).toBeTruthy();
    });
  });
});


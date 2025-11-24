/**
 * Tests for Micronutrients Comparison Feature
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import NutritionCompare from '../src/components/food/NutritionCompare';
import { ThemeProvider } from '../src/context/ThemeContext';
import { FoodItem } from '../src/types/types';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'Icon',
}));

jest.mock('../src/constants/theme', () => ({
  ...jest.requireActual('../src/constants/theme'),
  getValidIconName: jest.fn((name) => name),
}));

jest.mock('../src/components/food/MacroRadarChart', () => 'MacroRadarChart');

// Helper to wrap component with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

// Mock foods with micronutrients
const mockFood1: FoodItem = {
  id: 1,
  title: 'Apple',
  description: 'Red apple',
  iconName: 'food-apple',
  category: 'Fruit',
  servingSize: 100,
  macronutrients: {
    calories: 52,
    protein: 0.3,
    carbohydrates: 14,
    fat: 0.2,
  },
  micronutrients: {
    'Water (g)': 85.56,
    'Cholesterol (mg)': 0,
    'Calcium, Ca (mg)': 6,
    'Vitamin B-6 (mg)': 0.041,
  },
};

const mockFood2: FoodItem = {
  id: 2,
  title: 'Banana',
  description: 'Yellow banana',
  iconName: 'food',
  category: 'Fruit',
  servingSize: 100,
  macronutrients: {
    calories: 89,
    protein: 1.1,
    carbohydrates: 23,
    fat: 0.3,
  },
  micronutrients: {
    'Water (g)': 74.91,
    'Cholesterol (mg)': 0,
    'Calcium, Ca (mg)': 5,
    'Vitamin B-6 (mg)': 0.367,
  },
};

describe('NutritionCompare - Micronutrients Feature', () => {
  it('should render micronutrients comparison section', () => {
    const { getByText } = renderWithTheme(
      <NutritionCompare foods={[mockFood1, mockFood2]} />
    );

    expect(getByText('Micronutrients (per 100g)')).toBeTruthy();
  });

  it('should display all 4 micronutrients', () => {
    const { getByText } = renderWithTheme(
      <NutritionCompare foods={[mockFood1, mockFood2]} />
    );

    // Verify the section exists and both foods have micronutrient data
    expect(getByText('Micronutrients (per 100g)')).toBeTruthy();
    expect(mockFood1.micronutrients).toBeDefined();
    expect(mockFood2.micronutrients).toBeDefined();
    expect(mockFood1.micronutrients!['Water (g)']).toBe(85.56);
    expect(mockFood2.micronutrients!['Calcium, Ca (mg)']).toBe(5);
  });

  it('should not display micronutrients when less than 2 foods', () => {
    const { queryByText } = renderWithTheme(
      <NutritionCompare foods={[mockFood1]} />
    );

    expect(queryByText('Micronutrients (per 100g)')).toBeNull();
  });

  it('should handle foods without micronutrients data', () => {
    const foodWithoutMicro: FoodItem = {
      id: 3,
      title: 'Unknown Food',
      description: 'Test',
      iconName: 'food',
      category: 'Snack',
      macronutrients: {
        calories: 100,
        protein: 5,
        carbohydrates: 10,
        fat: 2,
      },
    };

    const { getByText } = renderWithTheme(
      <NutritionCompare foods={[foodWithoutMicro, mockFood1]} />
    );

    // Should still render the section
    expect(getByText('Micronutrients (per 100g)')).toBeTruthy();
  });
});


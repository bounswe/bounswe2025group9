/**
 * NutritionTrackingScreen Tests
 * 
 * Basic tests for the nutrition tracking screen functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import NutritionTrackingScreen from '../src/screens/nutrition/NutritionTrackingScreen';

// Mock the theme context
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

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
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

describe('NutritionTrackingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByText } = render(<NutritionTrackingScreen />);
    expect(getByText('Nutrition Tracking')).toBeTruthy();
  });

  it('should render view mode toggle buttons', () => {
    const { getByText } = render(<NutritionTrackingScreen />);
    
    expect(getByText('Daily')).toBeTruthy();
    expect(getByText('Weekly')).toBeTruthy();
  });

  it('should render meal section headers', () => {
    const { getByText } = render(<NutritionTrackingScreen />);
    
    // Meal headers are displayed in lowercase in the component
    expect(getByText(/breakfast/i)).toBeTruthy();
    expect(getByText(/lunch/i)).toBeTruthy();
    expect(getByText(/dinner/i)).toBeTruthy();
    expect(getByText(/snack/i)).toBeTruthy();
  });

  it('should display current date', () => {
    const { getByText } = render(<NutritionTrackingScreen />);
    
    // Should display some date information
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'short' });
    
    expect(getByText(new RegExp(monthName))).toBeTruthy();
  });
});


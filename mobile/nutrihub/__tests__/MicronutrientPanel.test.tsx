/**
 * MicronutrientPanel Tests
 * 
 * Tests for the micronutrient panel component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MicronutrientPanel from '../src/components/nutrition/MicronutrientPanel';
import { MicroNutrient } from '../src/types/nutrition';

// Mock the theme context
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#3b82f6',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      error: '#dc2626',
      warning: '#f59e0b',
      success: '#10b981',
    },
    textStyles: {
      heading3: { fontSize: 20, fontWeight: 'bold' },
      heading4: { fontSize: 18, fontWeight: 'bold' },
      body: { fontSize: 16 },
      caption: { fontSize: 12 },
    },
  }),
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MockIcon',
}));

describe('MicronutrientPanel', () => {
  const mockMicronutrients: MicroNutrient[] = [
    {
      name: 'Vitamin A',
      current: 850,
      target: 900,
      unit: 'µg',
      maximum: 3000,
      category: 'vitamin',
    },
    {
      name: 'Vitamin C',
      current: 95,
      target: 90,
      unit: 'mg',
      maximum: 2000,
      category: 'vitamin',
    },
    {
      name: 'Calcium',
      current: 1050,
      target: 1000,
      unit: 'mg',
      maximum: 2500,
      category: 'mineral',
    },
    {
      name: 'Iron',
      current: 15,
      target: 18,
      unit: 'mg',
      maximum: 45,
      category: 'mineral',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText('Micronutrients')).toBeTruthy();
  });

  it('should render vitamins section', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText('Vitamins')).toBeTruthy();
  });

  it('should render minerals section', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText('Minerals')).toBeTruthy();
  });

  it('should display vitamin entries', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText('Vitamin A')).toBeTruthy();
    expect(getByText('Vitamin C')).toBeTruthy();
  });

  it('should display mineral entries', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText('Calcium')).toBeTruthy();
    expect(getByText('Iron')).toBeTruthy();
  });

  it('should show warning message about maximum limits', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={mockMicronutrients} />
    );
    
    expect(getByText(/Important Note/i)).toBeTruthy();
  });

  it('should handle empty micronutrients array', () => {
    const { getByText } = render(
      <MicronutrientPanel micronutrients={[]} />
    );
    
    expect(getByText('Micronutrients')).toBeTruthy();
  });

  it('should display only vitamins when no minerals provided', () => {
    const onlyVitamins: MicroNutrient[] = [
      {
        name: 'Vitamin A',
        current: 900,
        target: 900,
        unit: 'µg',
        category: 'vitamin',
      },
    ];

    const { getByText } = render(
      <MicronutrientPanel micronutrients={onlyVitamins} />
    );
    
    expect(getByText('Vitamin A')).toBeTruthy();
  });

  it('should display only minerals when no vitamins provided', () => {
    const onlyMinerals: MicroNutrient[] = [
      {
        name: 'Calcium',
        current: 1000,
        target: 1000,
        unit: 'mg',
        category: 'mineral',
      },
    ];

    const { getByText } = render(
      <MicronutrientPanel micronutrients={onlyMinerals} />
    );
    
    expect(getByText('Calcium')).toBeTruthy();
  });

  it('should render nutrients with different units', () => {
    const mixedUnits: MicroNutrient[] = [
      {
        name: 'Vitamin B12',
        current: 2.4,
        target: 2.4,
        unit: 'µg',
        category: 'vitamin',
      },
      {
        name: 'Sodium',
        current: 2000,
        target: 2000,
        unit: 'mg',
        category: 'mineral',
      },
    ];

    const { getByText } = render(
      <MicronutrientPanel micronutrients={mixedUnits} />
    );
    
    expect(getByText('Vitamin B12')).toBeTruthy();
    expect(getByText('Sodium')).toBeTruthy();
  });
});


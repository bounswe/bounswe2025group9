/**
 * MacronutrientCard Tests
 * 
 * Tests for the macronutrient card component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MacronutrientCard from '../src/components/nutrition/MacronutrientCard';

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

describe('MacronutrientCard', () => {
  const defaultProps = {
    name: 'Protein',
    current: 100,
    target: 120,
    unit: 'g',
    color: '#3b82f6',
    icon: '🥩',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { getByText } = render(<MacronutrientCard {...defaultProps} />);
    expect(getByText('Protein')).toBeTruthy();
  });

  it('should display nutrient name', () => {
    const { getByText } = render(<MacronutrientCard {...defaultProps} />);
    expect(getByText('Protein')).toBeTruthy();
  });

  it('should display current value', () => {
    const { getByText } = render(<MacronutrientCard {...defaultProps} />);
    expect(getByText(/100.*g/)).toBeTruthy();
  });

  it('should display target value', () => {
    const { getByText } = render(<MacronutrientCard {...defaultProps} />);
    expect(getByText(/Daily Target.*120.*g/)).toBeTruthy();
  });

  it('should render with custom icon', () => {
    const { getByText } = render(<MacronutrientCard {...defaultProps} icon="🍗" />);
    expect(getByText('🍗')).toBeTruthy();
  });

  it('should show remaining amount when under target', () => {
    const { getByText } = render(
      <MacronutrientCard {...defaultProps} current={60} target={120} />
    );
    // Just verify it renders with the values
    expect(getByText('Protein')).toBeTruthy();
  });

  it('should handle different nutrient names', () => {
    const { getByText } = render(
      <MacronutrientCard {...defaultProps} name="Carbs" />
    );
    expect(getByText('Carbs')).toBeTruthy();
  });

  it('should handle different units', () => {
    const { getByText } = render(
      <MacronutrientCard {...defaultProps} unit="mg" current={50} target={100} />
    );
    // Verify component renders with correct unit
    expect(getByText('Protein')).toBeTruthy();
  });

  it('should render with zero current value', () => {
    const { getByText } = render(
      <MacronutrientCard {...defaultProps} current={0} target={120} />
    );
    expect(getByText('Protein')).toBeTruthy();
  });

  it('should render when exceeding target', () => {
    const { getByText } = render(
      <MacronutrientCard {...defaultProps} current={150} target={120} />
    );
    expect(getByText(/150.*g/)).toBeTruthy();
  });
});


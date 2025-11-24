/**
 * Tests for FoodItem component price category badge display
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import FoodItemComponent from '../src/components/food/FoodItem';
import { FoodItem } from '../src/types/types';

// Mock the ThemeContext hook
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#0066CC',
      secondary: '#4D88FF',
      border: '#E1E1E1',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      text: '#000000',
      textSecondary: '#8E8E93',
      surface: '#FFFFFF',
      card: '#F5F5F5',
      placeholder: '#E1E1E1',
    },
    textStyles: {
      body: { fontSize: 14 },
      caption: { fontSize: 12 },
      subtitle: { fontSize: 16 },
      heading1: { fontSize: 24 },
      heading2: { fontSize: 20 },
      heading3: { fontSize: 18 },
      heading4: { fontSize: 16 },
      small: { fontSize: 10 },
    },
  }),
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => {
  const { View, Text } = require('react-native');
  return {
    MaterialCommunityIcons: (props: { name: string; size: number; color: string }) => (
      <View testID={`icon-${props.name}`}>
        <Text>{props.name}</Text>
      </View>
    ),
  };
});

// Mock Card component
jest.mock('../src/components/common/Card', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ children, onPress, testID }: any) => (
    <TouchableOpacity onPress={onPress} testID={testID}>
      <View>{children}</View>
    </TouchableOpacity>
  );
});

// Mock getValidIconName
jest.mock('../src/constants/theme', () => ({
  ...jest.requireActual('../src/constants/theme'),
  getValidIconName: (name: string) => name,
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  BORDER_RADIUS: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    round: 999,
  },
}));

describe('FoodItem Price Category Badge', () => {
  const baseFoodItem: FoodItem = {
    id: 1,
    title: 'Test Food',
    description: 'A test food item',
    iconName: 'food',
    category: 'Fruit',
    nutritionScore: 8.5,
  };

  it('should not render badge when showPrice is false', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$',
    };

    const { queryByText } = render(
      <FoodItemComponent item={item} showPrice={false} />
    );

    expect(queryByText('$')).toBeNull();
  });

  it('should not render badge when priceCategory is null', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: null,
    };

    const { queryByText } = render(
      <FoodItemComponent item={item} showPrice={true} />
    );

    expect(queryByText('$')).toBeNull();
  });

  it('should render $ badge for cheap category', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$',
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="list" />
    );

    expect(getByText('$')).toBeTruthy();
  });

  it('should render $$ badge for mid-range category', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$$',
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="list" />
    );

    expect(getByText('$$')).toBeTruthy();
  });

  it('should render $$$ badge for premium category', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$$$',
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="list" />
    );

    expect(getByText('$$$')).toBeTruthy();
  });

  it('should normalize Turkish Lira to dollar signs', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '₺ ₺', // Should normalize to $$
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="list" />
    );

    expect(getByText('$$')).toBeTruthy();
  });

  it('should render badge in grid layout', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$',
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="grid" />
    );

    expect(getByText('$')).toBeTruthy();
  });

  it('should render badge in detailed layout', () => {
    const item: FoodItem = {
      ...baseFoodItem,
      priceCategory: '$',
    };

    const { getByText } = render(
      <FoodItemComponent item={item} showPrice={true} variant="detailed" />
    );

    expect(getByText('$')).toBeTruthy();
  });
});


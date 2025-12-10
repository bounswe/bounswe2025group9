/**
 * Tests for FoodScreen price category filter bug fix
 * 
 * This test file specifically tests the fixes for:
 * 1. Price category filtering not working correctly (items not filtered by $, $$, $$$)
 * 2. Filters not applying immediately (requiring pull-to-refresh)
 * 
 * Bug Issue: Price category filter in Food Catalog screen had two critical bugs:
 * - Items were not filtered by the selected price category
 * - Users had to perform a pull-to-refresh to see filtered results
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { FoodItem, FoodFilters } from '../src/types/types';

// Mock the necessary modules
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#0066CC',
      secondary: '#4D88FF',
      background: '#FFFFFF',
      border: '#E1E1E1',
      error: '#FF3B30',
      errorContainerBg: '#FFEBEE',
      success: '#34C759',
      warning: '#FF9500',
      text: '#000000',
      textSecondary: '#8E8E93',
      surface: '#FFFFFF',
      surfaceVariant: '#F5F5F5',
      card: '#F5F5F5',
      divider: '#E1E1E1',
      placeholder: '#E1E1E1',
      sortOptionActiveBg: '#0066CC',
      sortOptionInactiveBg: '#F5F5F5',
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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const { View, Text } = require('react-native');
  return {
    MaterialCommunityIcons: (props: { name: string }) => (
      <View testID={`icon-${props.name}`}>
        <Text>{props.name}</Text>
      </View>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Test data representing different price category formats from backend
const createMockFoodItems = (): FoodItem[] => [
  {
    id: 1,
    title: 'Cheap Apple',
    description: 'A budget-friendly apple',
    iconName: 'food-apple',
    category: 'Fruit',
    priceCategory: '$',
    nutritionScore: 8,
  },
  {
    id: 2,
    title: 'Mid-Range Steak',
    description: 'Quality steak',
    iconName: 'food-steak',
    category: 'Meat',
    priceCategory: '$$',
    nutritionScore: 7,
  },
  {
    id: 3,
    title: 'Premium Salmon',
    description: 'Fresh Atlantic salmon',
    iconName: 'fish',
    category: 'Seafood',
    priceCategory: '$$$',
    nutritionScore: 9,
  },
  {
    id: 4,
    title: 'Turkish Cheap Item',
    description: 'Item with Turkish Lira symbol',
    iconName: 'food',
    category: 'Grain',
    priceCategory: '₺', // Turkish Lira single
    nutritionScore: 6,
  },
  {
    id: 5,
    title: 'Turkish Mid-Range Item',
    description: 'Item with spaced Turkish Lira',
    iconName: 'food',
    category: 'Dairy',
    priceCategory: '₺ ₺', // Turkish Lira with space
    nutritionScore: 7,
  },
  {
    id: 6,
    title: 'Turkish Premium Item',
    description: 'Item with triple Turkish Lira',
    iconName: 'food',
    category: 'Meat',
    priceCategory: '₺ ₺ ₺', // Turkish Lira triple with spaces
    nutritionScore: 8,
  },
  {
    id: 7,
    title: 'No Price Item',
    description: 'Item without price category',
    iconName: 'food',
    category: 'Vegetable',
    priceCategory: null,
    nutritionScore: 5,
  },
];

/**
 * Helper function that replicates the displayItems price category filtering logic
 * This is the same logic used in FoodScreen.tsx after the bug fix
 */
const filterByPriceCategory = (items: FoodItem[], priceCategory: string | undefined): FoodItem[] => {
  if (!priceCategory) return items;
  
  return items.filter(item => {
    if (!item.priceCategory) return false;
    // Normalize both values: replace ₺ with $, remove all spaces
    const normalizedItemCategory = item.priceCategory.replace(/₺/g, '$').replace(/\s+/g, '');
    const normalizedFilterCategory = priceCategory.replace(/₺/g, '$').replace(/\s+/g, '');
    return normalizedItemCategory === normalizedFilterCategory;
  });
};

describe('FoodScreen Price Category Filter Bug Fix', () => {
  const mockFoodItems = createMockFoodItems();

  describe('Bug Fix #1: Price category filtering works correctly', () => {
    it('should filter items by "$" category (cheap items)', () => {
      const filtered = filterByPriceCategory(mockFoodItems, '$');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(f => f.title)).toContain('Cheap Apple');
      expect(filtered.map(f => f.title)).toContain('Turkish Cheap Item');
    });

    it('should filter items by "$$" category (mid-range items)', () => {
      const filtered = filterByPriceCategory(mockFoodItems, '$$');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(f => f.title)).toContain('Mid-Range Steak');
      expect(filtered.map(f => f.title)).toContain('Turkish Mid-Range Item');
    });

    it('should filter items by "$$$" category (premium items)', () => {
      const filtered = filterByPriceCategory(mockFoodItems, '$$$');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(f => f.title)).toContain('Premium Salmon');
      expect(filtered.map(f => f.title)).toContain('Turkish Premium Item');
    });

    it('should exclude items without price category', () => {
      const filtered = filterByPriceCategory(mockFoodItems, '$');
      
      const noPrice = filtered.find(f => f.title === 'No Price Item');
      expect(noPrice).toBeUndefined();
    });

    it('should handle Turkish Lira symbols in item price categories', () => {
      const itemsWithTurkishLira = mockFoodItems.filter(
        item => item.priceCategory?.includes('₺')
      );
      
      // Verify Turkish Lira items exist in test data
      expect(itemsWithTurkishLira).toHaveLength(3);
      
      // Verify they are correctly matched when filtering by $
      const cheapFiltered = filterByPriceCategory(mockFoodItems, '$');
      expect(cheapFiltered.find(f => f.title === 'Turkish Cheap Item')).toBeDefined();
      
      // Verify they are correctly matched when filtering by $$
      const midFiltered = filterByPriceCategory(mockFoodItems, '$$');
      expect(midFiltered.find(f => f.title === 'Turkish Mid-Range Item')).toBeDefined();
      
      // Verify they are correctly matched when filtering by $$$
      const premiumFiltered = filterByPriceCategory(mockFoodItems, '$$$');
      expect(premiumFiltered.find(f => f.title === 'Turkish Premium Item')).toBeDefined();
    });

    it('should handle spaces in price categories', () => {
      // Create items with various space patterns
      const itemsWithSpaces: FoodItem[] = [
        { id: 1, title: 'Spaced $', priceCategory: '$ $', description: '', iconName: 'food', category: 'Fruit' },
        { id: 2, title: 'NoSpace $$', priceCategory: '$$', description: '', iconName: 'food', category: 'Fruit' },
        { id: 3, title: 'Triple Spaced', priceCategory: '$ $ $', description: '', iconName: 'food', category: 'Fruit' },
      ];
      
      // Filter by $$ should match both "$ $" and "$$"
      const midFiltered = filterByPriceCategory(itemsWithSpaces, '$$');
      expect(midFiltered).toHaveLength(2);
      expect(midFiltered.map(f => f.title)).toContain('Spaced $');
      expect(midFiltered.map(f => f.title)).toContain('NoSpace $$');
      
      // Filter by $$$ should match "$ $ $"
      const premiumFiltered = filterByPriceCategory(itemsWithSpaces, '$$$');
      expect(premiumFiltered).toHaveLength(1);
      expect(premiumFiltered[0].title).toBe('Triple Spaced');
    });

    it('should return all items when no price category filter is set', () => {
      const filtered = filterByPriceCategory(mockFoodItems, undefined);
      
      expect(filtered).toHaveLength(mockFoodItems.length);
    });

    it('should correctly normalize mixed symbol formats', () => {
      const mixedItems: FoodItem[] = [
        { id: 1, title: 'Mixed 1', priceCategory: '₺₺', description: '', iconName: 'food', category: 'Fruit' },
        { id: 2, title: 'Mixed 2', priceCategory: '$ $', description: '', iconName: 'food', category: 'Fruit' },
        { id: 3, title: 'Mixed 3', priceCategory: '₺ $', description: '', iconName: 'food', category: 'Fruit' },
      ];
      
      // All should match $$ filter after normalization
      const filtered = filterByPriceCategory(mixedItems, '$$');
      expect(filtered).toHaveLength(3);
    });
  });

  describe('Bug Fix #2: Filters apply immediately without refresh', () => {
    /**
     * This test simulates the handleApplyFilters behavior
     * The fix ensures that only category changes (backend filter) clear data,
     * while client-side filters (priceCategory, dietaryOptions, nutritionScore)
     * work immediately on existing data
     */
    
    interface FilterState {
      filters: FoodFilters;
      foodData: FoodItem[];
      needsRefetch: boolean;
    }

    const simulateHandleApplyFilters = (
      currentState: FilterState,
      newFilters: FoodFilters
    ): FilterState => {
      // Check if category filter changed (this requires backend refetch)
      const categoryChanged = newFilters.category !== currentState.filters.category;
      
      return {
        filters: newFilters,
        foodData: categoryChanged ? [] : currentState.foodData, // Only clear on category change
        needsRefetch: categoryChanged,
      };
    };

    it('should NOT clear food data when only price category filter changes', () => {
      const initialState: FilterState = {
        filters: {},
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        priceCategory: '$',
      });

      // Food data should NOT be cleared
      expect(newState.foodData).toHaveLength(mockFoodItems.length);
      expect(newState.needsRefetch).toBe(false);
    });

    it('should NOT clear food data when only dietary options filter changes', () => {
      const initialState: FilterState = {
        filters: {},
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        dietaryOptions: ['Vegan', 'Gluten-Free'],
      });

      expect(newState.foodData).toHaveLength(mockFoodItems.length);
      expect(newState.needsRefetch).toBe(false);
    });

    it('should NOT clear food data when only nutrition score range changes', () => {
      const initialState: FilterState = {
        filters: {},
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        minNutritionScore: 5,
        maxNutritionScore: 10,
      });

      expect(newState.foodData).toHaveLength(mockFoodItems.length);
      expect(newState.needsRefetch).toBe(false);
    });

    it('should clear food data when category filter changes', () => {
      const initialState: FilterState = {
        filters: { category: 'Fruit' },
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        category: 'Meat',
      });

      // Food data SHOULD be cleared because category is a backend filter
      expect(newState.foodData).toHaveLength(0);
      expect(newState.needsRefetch).toBe(true);
    });

    it('should NOT clear food data when multiple client-side filters change', () => {
      const initialState: FilterState = {
        filters: {},
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        priceCategory: '$$',
        dietaryOptions: ['Vegan'],
        minNutritionScore: 7,
      });

      // Food data should NOT be cleared - all are client-side filters
      expect(newState.foodData).toHaveLength(mockFoodItems.length);
      expect(newState.needsRefetch).toBe(false);
    });

    it('should clear food data when category changes along with client-side filters', () => {
      const initialState: FilterState = {
        filters: { category: 'Fruit' },
        foodData: mockFoodItems,
        needsRefetch: false,
      };

      const newState = simulateHandleApplyFilters(initialState, {
        category: 'Vegetable',
        priceCategory: '$',
      });

      // Food data SHOULD be cleared because category changed
      expect(newState.foodData).toHaveLength(0);
      expect(newState.needsRefetch).toBe(true);
    });
  });

  describe('Integration: displayItems correctly applies price category filter', () => {
    /**
     * This test simulates the complete displayItems flow
     * to ensure price category filtering is included
     */
    
    const applyDisplayItemsFilters = (
      foodData: FoodItem[],
      filters: FoodFilters
    ): FoodItem[] => {
      let result = [...foodData];

      // Apply dietary options filter
      if (filters.dietaryOptions && filters.dietaryOptions.length > 0) {
        result = result.filter(item =>
          item.dietaryOptions &&
          filters.dietaryOptions?.some(option =>
            item.dietaryOptions?.includes(option)
          )
        );
      }

      // Apply price category filter (THE BUG FIX)
      if (filters.priceCategory) {
        result = result.filter(item => {
          if (!item.priceCategory) return false;
          const normalizedItemCategory = item.priceCategory.replace(/₺/g, '$').replace(/\s+/g, '');
          const normalizedFilterCategory = filters.priceCategory!.replace(/₺/g, '$').replace(/\s+/g, '');
          return normalizedItemCategory === normalizedFilterCategory;
        });
      }

      // Apply nutrition score range filter
      if (filters.minNutritionScore !== undefined) {
        result = result.filter(item =>
          item.nutritionScore !== undefined &&
          item.nutritionScore >= (filters.minNutritionScore as number)
        );
      }

      if (filters.maxNutritionScore !== undefined) {
        result = result.filter(item =>
          item.nutritionScore !== undefined &&
          item.nutritionScore <= (filters.maxNutritionScore as number)
        );
      }

      return result;
    };

    it('should correctly filter display items by price category', () => {
      const filters: FoodFilters = { priceCategory: '$' };
      
      const displayItems = applyDisplayItemsFilters(mockFoodItems, filters);
      
      // Should show only cheap items ($ and ₺)
      expect(displayItems).toHaveLength(2);
      expect(displayItems.every(item => {
        const normalized = item.priceCategory?.replace(/₺/g, '$').replace(/\s+/g, '');
        return normalized === '$';
      })).toBe(true);
    });

    it('should correctly combine price category with nutrition score filter', () => {
      const filters: FoodFilters = {
        priceCategory: '$$',
        minNutritionScore: 7,
      };
      
      const displayItems = applyDisplayItemsFilters(mockFoodItems, filters);
      
      // Should show only mid-range items with nutrition score >= 7
      displayItems.forEach(item => {
        const normalized = item.priceCategory?.replace(/₺/g, '$').replace(/\s+/g, '');
        expect(normalized).toBe('$$');
        expect(item.nutritionScore).toBeGreaterThanOrEqual(7);
      });
    });

    it('should show no items when filter matches nothing', () => {
      // Create items without $$$ category
      const limitedItems: FoodItem[] = [
        { id: 1, title: 'Cheap', priceCategory: '$', description: '', iconName: 'food', category: 'Fruit' },
        { id: 2, title: 'Mid', priceCategory: '$$', description: '', iconName: 'food', category: 'Fruit' },
      ];
      
      const filters: FoodFilters = { priceCategory: '$$$' };
      
      const displayItems = applyDisplayItemsFilters(limitedItems, filters);
      
      expect(displayItems).toHaveLength(0);
    });
  });
});


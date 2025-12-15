/**
 * Food Filtering Hook
 * 
 * Custom hook for managing food list filtering and sorting.
 * 
 * Usage:
 * ```tsx
 * const {
 *   filters,
 *   sortOption,
 *   filteredItems,
 *   setNameFilter,
 *   setCategoryFilter,
 *   setDietaryOptions,
 *   setPriceRange,
 *   setNutritionScoreRange,
 *   setSortOption,
 *   resetFilters,
 * } = useFoodFilters(foodItems);
 * 
 * // Use filteredItems in your component
 * return (
 *   <FlatList
 *     data={filteredItems}
 *     renderItem={renderItem}
 *     keyExtractor={(item) => item.id.toString()}
 *   />
 * );
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { FoodItem, FoodFilters, FoodCategoryType, DietaryOptionType } from '../types/types';
import { FOOD_SORT_OPTIONS } from '../constants/foodConstants';

/**
 * Custom hook for food filtering and sorting
 */
const useFoodFilters = (items: FoodItem[]) => {
  // Filter state
  const [filters, setFilters] = useState<FoodFilters>({});
  
  // Sort option state (no default sorting)
  const [sortOption, setSortOption] = useState<string>('');
  
  /**
   * Set name filter
   */
  const setNameFilter = useCallback((name: string) => {
    setFilters(prev => ({
      ...prev,
      name: name.trim().length > 0 ? name : undefined,
    }));
  }, []);
  
  /**
   * Set category filter
   */
  const setCategoryFilter = useCallback((category: FoodCategoryType | undefined) => {
    setFilters(prev => ({
      ...prev,
      category: category,
    }));
  }, []);
  
  /**
   * Set dietary options filter
   */
  const setDietaryOptions = useCallback((options: DietaryOptionType[]) => {
    setFilters(prev => ({
      ...prev,
      dietaryOptions: options.length > 0 ? options : undefined,
    }));
  }, []);
  
  /**
   * Set price category filter
   */
  const setPriceCategory = useCallback((category: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      priceCategory: category,
    }));
  }, []);
  
  /**
   * Set nutrition score range filter
   */
  const setNutritionScoreRange = useCallback((min: number | undefined, max: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minNutritionScore: min,
      maxNutritionScore: max,
    }));
  }, []);
  
  /**
   * Reset all filters to default values
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setSortOption('');
  }, []);
  
  /**
   * Apply filters to food items
   */
  const filteredItems = useMemo(() => {
    // Start with all items
    let result = [...items];
    
    // Apply name filter
    if (filters.name) {
      const searchQuery = filters.name.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchQuery) || 
        item.description.toLowerCase().includes(searchQuery)
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(item => 
        item.category === filters.category
      );
    }
    
    // Apply dietary options filter
    if (filters.dietaryOptions && filters.dietaryOptions.length > 0) {
      result = result.filter(item => 
        item.dietaryOptions && 
        filters.dietaryOptions?.some(option => 
          item.dietaryOptions?.includes(option)
        )
      );
    }
    
    // Apply price category filter
    if (filters.priceCategory) {
      result = result.filter(item => {
        if (!item.priceCategory) return false;
        // Normalize category (handle both $ and ₺ symbols, remove spaces)
        const normalizedItemCategory = item.priceCategory.replace(/₺/g, '$').replace(/\s+/g, '').trim();
        const normalizedFilterCategory = filters.priceCategory.replace(/₺/g, '$').replace(/\s+/g, '').trim();
        console.log(`[Filter] Comparing item category "${item.priceCategory}" (normalized: "${normalizedItemCategory}") with filter "${filters.priceCategory}" (normalized: "${normalizedFilterCategory}")`);
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
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case FOOD_SORT_OPTIONS.NAME_A_TO_Z:
          return a.title.localeCompare(b.title);
          
        case FOOD_SORT_OPTIONS.NAME_Z_TO_A:
          return b.title.localeCompare(a.title);
          
        case FOOD_SORT_OPTIONS.NUTRITION_SCORE:
          return ((b.nutritionScore || 0) - (a.nutritionScore || 0));
          
        default:
          return 0;
      }
    });
    
    return result;
  }, [items, filters, sortOption]);
  
  return {
    filters,
    sortOption,
    filteredItems,
    setNameFilter,
    setCategoryFilter,
    setDietaryOptions,
    setPriceCategory,
    setNutritionScoreRange,
    setSortOption,
    resetFilters,
  };
};

export default useFoodFilters;
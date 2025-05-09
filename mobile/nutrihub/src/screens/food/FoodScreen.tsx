/**
 * FoodScreen
 * 
 * Displays a list of food items with filtering and sorting options.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import FoodItemComponent from '../../components/food/FoodItem';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import useFoodFilters from '../../hooks/useFoodFilters';
import { FoodItem, FoodCategoryType, DietaryOptionType } from '../../types/types';
import { FOOD_CATEGORIES, DIETARY_OPTIONS, FOOD_SORT_OPTIONS } from '../../constants/foodConstants';

// Mock data for food items
const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: 1,
    title: 'Organic Apples',
    description: 'Fresh, locally grown organic apples. Rich in fiber and antioxidants.',
    iconName: 'food-apple',
    category: 'Fruit',
    nutritionScore: 8.5,
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free'],
    price: 3.99,
    macronutrients: {
      calories: 52,
      protein: 0.3,
      carbohydrates: 14,
      fat: 0.2,
      fiber: 2.4,
    },
  },
  {
    id: 2,
    title: 'Greek Yogurt',
    description: 'Creamy Greek yogurt with high protein content. Perfect for breakfast or snacks.',
    iconName: 'food-variant',
    category: 'Dairy',
    nutritionScore: 7.8,
    dietaryOptions: ['Vegetarian', 'High-protein'],
    price: 4.99,
    macronutrients: {
      calories: 100,
      protein: 10,
      carbohydrates: 4,
      fat: 5,
    },
  },
  {
    id: 3,
    title: 'Quinoa',
    description: 'Nutrient-rich ancient grain that provides complete protein and complex carbohydrates.',
    iconName: 'barley',
    category: 'Grain',
    nutritionScore: 9.2,
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free', 'High-protein'],
    price: 6.99,
    macronutrients: {
      calories: 120,
      protein: 4.4,
      carbohydrates: 21.3,
      fat: 1.9,
      fiber: 2.8,
    },
  },
  {
    id: 4,
    title: 'Chicken Breast',
    description: 'Lean, skinless chicken breast. Excellent source of high-quality protein.',
    iconName: 'food-drumstick',
    category: 'Meat',
    nutritionScore: 8.7,
    dietaryOptions: ['High-protein', 'Low-fat'],
    price: 7.99,
    macronutrients: {
      calories: 165,
      protein: 31,
      carbohydrates: 0,
      fat: 3.6,
    },
  },
  {
    id: 5,
    title: 'Avocado',
    description: 'Nutrient-dense fruit rich in healthy fats, fiber, and various micronutrients.',
    iconName: 'fruit-pear',
    category: 'Fruit',
    nutritionScore: 9.0,
    dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free'],
    price: 2.49,
    macronutrients: {
      calories: 160,
      protein: 2,
      carbohydrates: 8.5,
      fat: 14.7,
      fiber: 6.7,
    },
  },
  {
    id: 6,
    title: 'Salmon Fillet',
    description: 'Fresh Atlantic salmon rich in omega-3 fatty acids and high-quality protein.',
    iconName: 'fish',
    category: 'Meat',
    nutritionScore: 9.5,
    dietaryOptions: ['High-protein'],
    price: 12.99,
    macronutrients: {
      calories: 208,
      protein: 20,
      carbohydrates: 0,
      fat: 13,
    },
  },
];

/**
 * Food screen component displaying a catalog of food items
 */
const FoodScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  
  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
  
  // Filter modal visibility state
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  
  // Initialize food filters hook
  const {
    filteredItems,
    setNameFilter,
    sortOption,
    setSortOption,
    resetFilters,
    setCategoryFilter
  } = useFoodFilters(MOCK_FOOD_ITEMS);
  
  // Toggle layout mode
  const toggleLayoutMode = () => {
    setLayoutMode(prev => (prev === 'list' ? 'grid' : 'list'));
  };
  
  // Handle food item press
  const handleFoodItemPress = useCallback((item: FoodItem) => {
    // Navigate to food detail screen (to be implemented)
    console.log(`Selected food item: ${item.title}`);
  }, []);
  
  // Render food item
  const renderFoodItem = useCallback(({ item }: ListRenderItemInfo<FoodItem>) => (
    <FoodItemComponent
      item={item}
      onPress={handleFoodItemPress}
      variant={layoutMode}
      showNutritionScore
      showDietaryOptions={false} // 'detailed' layout not implemented in current toggle
      showPrice
      style={layoutMode === 'grid' ? styles.gridItem : styles.listItem}
    />
  ), [layoutMode, handleFoodItemPress]);
  
  // Generate key extractor for list items
  const keyExtractor = useCallback((item: FoodItem) => item.id.toString(), []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, textStyles.heading2]}>Foods Catalog</Text>
        
        {/* Search and filter bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search foods..."
            onChangeText={setNameFilter}
            iconName="magnify"
            clearButton
            containerStyle={styles.searchInput}
          />
          
          <TouchableOpacity
            style={[styles.layoutButton, { backgroundColor: theme.card }]}
            onPress={toggleLayoutMode}
          >
            <Icon 
              name={layoutMode === 'grid' ? 'view-list' : 'view-grid'} 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.card }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="filter-variant" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Sort options */}
        <View style={styles.sortOptionsContainer}>
          <Text style={[styles.sortByText, textStyles.body]}>Sort by:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableOptions}
          >
            {Object.entries(FOOD_SORT_OPTIONS).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: sortOption === value 
                      ? theme.sortOptionActiveBg 
                      : theme.sortOptionInactiveBg,
                  },
                ]}
                onPress={() => setSortOption(value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    textStyles.caption,
                    {
                      color: sortOption === value 
                        ? PALETTE.ACCENT.CONTRAST
                        : theme.text,
                        fontWeight: sortOption === value ? '500' : '400',
                    },
                  ]}
                >
                  {key.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {/* Food list */}
      <FlatList
        data={filteredItems}
        renderItem={renderFoodItem}
        keyExtractor={keyExtractor}
        numColumns={layoutMode === 'grid' ? 2 : 1}
        key={layoutMode} // Force re-render when layout changes
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={layoutMode === 'grid' ? styles.gridColumnWrapper : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="food-off" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, textStyles.body]}>No food items found</Text>
            <Button
              title="Reset Filters"
              onPress={resetFilters}
              variant="outline"
              style={styles.resetButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
  },
  headerTitle: {
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  layoutButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  filterButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortByText: {
    marginRight: SPACING.sm,
  },
  scrollableOptions: {
    paddingRight: SPACING.lg, 
  },
  sortOption: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  sortOptionText: {
    fontSize: 12,
  },
  listContent: {
    padding: SPACING.sm,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  listItem: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  resetButton: {
    marginTop: SPACING.md,
  },
});

export default FoodScreen;
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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import FoodItemComponent from '../../components/food/FoodItem';
import FoodDetailModal from '../../components/food/FoodDetailModal';
import FoodFilterModal from '../../components/food/FoodFilterModal';
import ProposeFoodModal, { FoodProposalData } from '../../components/food/ProposeFoodModal';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import useFoodFilters from '../../hooks/useFoodFilters';
import { FoodItem, FoodCategoryType, DietaryOptionType, FoodFilters } from '../../types/types';
import { FOOD_CATEGORIES, DIETARY_OPTIONS, FOOD_SORT_OPTIONS } from '../../constants/foodConstants';

// Mock data for food items - updated with allergens
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
    allergens: ['Lactose'],
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
    allergens: ['Fish'],
    price: 12.99,
    macronutrients: {
      calories: 208,
      protein: 20,
      carbohydrates: 0,
      fat: 13,
    },
  },
];

// Success notification component
const SuccessNotification: React.FC<{
  visible: boolean;
  message: string;
  onHide: () => void;
}> = ({ visible, message, onHide }) => {
  const { theme } = useTheme();
  
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);
  
  if (!visible) return null;
  
  return (
    <View style={[styles.notification, { backgroundColor: theme.success }]}>
      <Icon name="check-circle" size={24} color="#FFFFFF" />
      <Text style={styles.notificationText}>{message}</Text>
    </View>
  );
};

/**
 * Food screen component displaying a catalog of food items
 */
const FoodScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  
  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
  
  // Loading and refresh states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Modal states
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [proposeFoodModalVisible, setProposeFoodModalVisible] = useState<boolean>(false);
  
  // Notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  
  // Initialize food filters hook
  const {
    filters,
    filteredItems,
    setNameFilter,
    sortOption,
    setSortOption,
    resetFilters,
    setCategoryFilter,
    setDietaryOptions,
    setPriceRange,
    setNutritionScoreRange,
  } = useFoodFilters(MOCK_FOOD_ITEMS);
  
  // Toggle layout mode
  const toggleLayoutMode = () => {
    setLayoutMode(prev => (prev === 'list' ? 'grid' : 'list'));
  };
  
  // Handle food item press
  const handleFoodItemPress = useCallback((item: FoodItem) => {
    setSelectedFood(item);
    setDetailModalVisible(true);
  }, []);
  
  // Handle modal close
  const handleModalClose = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedFood(null);
  }, []);
  
  // Handle filter application
  const handleApplyFilters = useCallback((newFilters: FoodFilters) => {
    setCategoryFilter(newFilters.category);
    setDietaryOptions(newFilters.dietaryOptions || []);
    setPriceRange(newFilters.minPrice, newFilters.maxPrice);
    setNutritionScoreRange(newFilters.minNutritionScore, newFilters.maxNutritionScore);
  }, [setCategoryFilter, setDietaryOptions, setPriceRange, setNutritionScoreRange]);
  
  // Handle propose food submission
  const handleProposeFoodSubmit = useCallback((data: FoodProposalData) => {
    console.log('Proposed food:', data);
    
    // Show loading state briefly (simulate API call)
    setProposeFoodModalVisible(false);
    
    // Simulate API call
    setTimeout(() => {
      // Show success notification
      setNotificationMessage(`Food proposal for "${data.name}" has been submitted for review!`);
      setShowSuccessNotification(true);
      
    }, 500);
  }, []);
  
  // Remove a specific dietary option
  const removeDietaryOption = useCallback((option: DietaryOptionType) => {
    const currentOptions = filters.dietaryOptions || [];
    setDietaryOptions(currentOptions.filter(o => o !== option));
  }, [filters.dietaryOptions, setDietaryOptions]);
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);
  
  // Simulate initial loading
  React.useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Check if filters are active
  const hasActiveFilters = filters.name || filters.category || (filters.dietaryOptions?.length ?? 0) > 0 || 
    filters.minPrice !== undefined || filters.maxPrice !== undefined || 
    filters.minNutritionScore !== undefined || filters.maxNutritionScore !== undefined;
  
  // Render food item
  const renderFoodItem = useCallback(({ item }: ListRenderItemInfo<FoodItem>) => (
    <FoodItemComponent
      item={item}
      onPress={handleFoodItemPress}
      variant={layoutMode}
      showNutritionScore
      showDietaryOptions={false}
      showPrice
      style={layoutMode === 'grid' ? styles.gridItem : styles.listItem}
    />
  ), [layoutMode, handleFoodItemPress]);
  
  // Generate key extractor for list items
  const keyExtractor = useCallback((item: FoodItem) => item.id.toString(), []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Success Notification */}
      <SuccessNotification
        visible={showSuccessNotification}
        message={notificationMessage}
        onHide={() => setShowSuccessNotification(false)}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, textStyles.heading2]}>Foods Catalog</Text>
          <Button
            title="Propose Food"
            variant="primary"
            size="small"
            iconName="plus"
            onPress={() => setProposeFoodModalVisible(true)}
          />
        </View>
        
        {/* Search and filter bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search foods..."
            onChangeText={setNameFilter}
            value={filters.name}
            iconName="magnify"
            clearButton
            onClear={() => setNameFilter('')}
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
            {hasActiveFilters && (
              <View style={[styles.filterBadge, { backgroundColor: theme.error }]} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Active filters display */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <Text style={[styles.activeFiltersLabel, textStyles.caption]}>Active filters:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {filters.category && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => setCategoryFilter(undefined)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    {filters.category}
                  </Text>
                  <Icon name="close" size={16} color={theme.error} style={styles.activeFilterIcon} />
                </TouchableOpacity>
              )}
              {filters.dietaryOptions?.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => removeDietaryOption(option)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    {option}
                  </Text>
                  <Icon name="close" size={16} color={theme.error} style={styles.activeFilterIcon} />
                </TouchableOpacity>
              ))}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => setPriceRange(undefined, undefined)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}
                  </Text>
                  <Icon name="close" size={16} color={theme.error} style={styles.activeFilterIcon} />
                </TouchableOpacity>
              )}
              {(filters.minNutritionScore !== undefined || filters.maxNutritionScore !== undefined) && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => setNutritionScoreRange(undefined, undefined)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    Score: {filters.minNutritionScore || 0} - {filters.maxNutritionScore || 10}
                  </Text>
                  <Icon name="close" size={16} color={theme.error} style={styles.activeFilterIcon} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
        
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
      
      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, textStyles.body]}>Loading foods...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderFoodItem}
          keyExtractor={keyExtractor}
          numColumns={layoutMode === 'grid' ? 2 : 1}
          key={layoutMode} // Force re-render when layout changes
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={layoutMode === 'grid' ? styles.gridColumnWrapper : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="food-off" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, textStyles.heading4]}>No foods found</Text>
              <Text style={[styles.emptyText, textStyles.body]}>
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results'
                  : 'Start by adding some foods to the catalog'}
              </Text>
              <Button
                title={hasActiveFilters ? "Reset Filters" : "Add Food"}
                onPress={hasActiveFilters ? resetFilters : () => setProposeFoodModalVisible(true)}
                variant="primary"
                style={styles.emptyButton}
                iconName={hasActiveFilters ? "filter-remove" : "plus"}
              />
            </View>
          }
        />
      )}
      
      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        visible={detailModalVisible}
        onClose={handleModalClose}
      />
      
      {/* Filter Modal */}
      <FoodFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
      
      {/* Propose Food Modal */}
      <ProposeFoodModal
        visible={proposeFoodModalVisible}
        onClose={() => setProposeFoodModalVisible(false)}
        onSubmit={handleProposeFoodSubmit}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    flex: 1,
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  activeFiltersLabel: {
    marginRight: SPACING.sm,
  },
  activeFiltersScroll: {
    paddingRight: SPACING.md,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginRight: SPACING.xs,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterIcon: {
    marginLeft: SPACING.xs,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    paddingTop: SPACING.xxl * 2,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    zIndex: 1000,
  },
  notificationText: {
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
    flex: 1,
    fontWeight: '500',
  },
});

export default FoodScreen;
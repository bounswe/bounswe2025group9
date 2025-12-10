/**
 * FoodScreen
 * 
 * Displays a list of food items with filtering and sorting options.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { FoodStackParamList } from '../../navigation/types';
import { FOOD_CATEGORIES, DIETARY_OPTIONS, FOOD_SORT_OPTIONS } from '../../constants/foodConstants';
import { getFoodCatalog, submitFoodProposal } from '../../services/api/food.service';
import { API_CONFIG } from '../../config';

type FoodScreenNavigationProp = NativeStackNavigationProp<FoodStackParamList, 'FoodList'>;

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
  const navigation = useNavigation<FoodScreenNavigationProp>();

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');

  // Food data state
  const [foodData, setFoodData] = useState<FoodItem[]>([]);

  // Ref to track if we're already fetching
  const isFetchingRef = React.useRef(false);

  // Initialize pagination state with useRef to prevent race conditions
  const [pagination, setPagination] = useState({
    page: 1,          // Current page (starting at 1)
    limit: 20,        // Items per page
    hasMore: true,    // Whether there are more items to load
    total: 0,         // Total number of items available
    loading: false    // Whether we're currently loading more items
  });

  // Use a ref to track the current page to avoid stale state in callbacks
  const currentPageRef = React.useRef(pagination.page);

  // Update ref when pagination changes
  React.useEffect(() => {
    currentPageRef.current = pagination.page;
  }, [pagination.page]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    filteredItems: clientFilteredItems,
    setNameFilter,
    sortOption,
    setSortOption,
    resetFilters,
    setCategoryFilter,
    setDietaryOptions,
    setPriceCategory,
    setNutritionScoreRange,
  } = useFoodFilters(foodData);
  
  // Helper function to map mobile sort option to backend format
  const mapSortOptionToBackend = (sortOption: string): { sortBy?: string; sortOrder?: 'asc' | 'desc' } => {
    switch (sortOption) {
      case FOOD_SORT_OPTIONS.NAME_A_TO_Z:
        return { sortBy: 'name', sortOrder: 'asc' };
      case FOOD_SORT_OPTIONS.NAME_Z_TO_A:
        return { sortBy: 'name', sortOrder: 'desc' };
      case FOOD_SORT_OPTIONS.PRICE_LOW_TO_HIGH:
        return { sortBy: 'price', sortOrder: 'asc' };
      case FOOD_SORT_OPTIONS.PRICE_HIGH_TO_LOW:
        return { sortBy: 'price', sortOrder: 'desc' };
      case FOOD_SORT_OPTIONS.NUTRITION_SCORE:
        return { sortBy: 'nutritionscore', sortOrder: 'desc' };
      case FOOD_SORT_OPTIONS.COST_TO_NUTRITION_RATIO:
        // Cost-to-nutrition ratio: sort by price/nutritionScore ratio (ascending = best value)
        return { sortBy: 'cost-nutrition-ratio', sortOrder: 'asc' };
      default:
        return {};
    }
  };
  
  // Check if backend sorting is active (all sort options are now handled by backend)
  const isBackendSortingActive = useMemo(() => {
    return Object.values(FOOD_SORT_OPTIONS).includes(sortOption as any);
  }, [sortOption]);
  
  // Apply only client-side filters (dietary, price category, price range, nutrition range) that aren't handled by backend
  // Backend handles: category, name search, and sorting
  const displayItems = useMemo(() => {
    // If backend sorting is active, use the raw foodData (already sorted by backend)
    // and only apply filters that backend doesn't handle
    let result = isBackendSortingActive ? [...foodData] : [...clientFilteredItems];
    
    // Apply dietary options filter (not handled by backend)
    if (filters.dietaryOptions && filters.dietaryOptions.length > 0) {
      result = result.filter(item => 
        item.dietaryOptions && 
        filters.dietaryOptions?.some(option => 
          item.dietaryOptions?.includes(option)
        )
      );
    }
    
    // Apply price category filter (not handled by backend)
    // Normalize category to handle both $ and ₺ symbols, and handle spaces
    if (filters.priceCategory) {
      result = result.filter(item => {
        if (!item.priceCategory) return false;
        // Normalize both values: replace ₺ with $, remove all spaces
        const normalizedItemCategory = item.priceCategory.replace(/₺/g, '$').replace(/\s+/g, '');
        const normalizedFilterCategory = filters.priceCategory!.replace(/₺/g, '$').replace(/\s+/g, '');
        return normalizedItemCategory === normalizedFilterCategory;
      });
    }
    
    // Apply price range filter (not handled by backend)
    if (filters.minPrice !== undefined) {
      result = result.filter(item => 
        item.price !== undefined && item.price >= (filters.minPrice as number)
      );
    }
    
    if (filters.maxPrice !== undefined) {
      result = result.filter(item => 
        item.price !== undefined && item.price <= (filters.maxPrice as number)
      );
    }
    
    // Apply nutrition score range filter (not handled by backend)
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
  }, [foodData, clientFilteredItems, filters, isBackendSortingActive]);
  
  // Fetch food data from API
  const fetchFoodData = useCallback(async (loadMore = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Already fetching data, ignoring request');
      return;
    }

    try {
      isFetchingRef.current = true;

      if (loadMore) {
        if (!pagination.hasMore || pagination.loading) {
          console.log('No more items or already loading, skipping fetch');
          return;
        }
        setPagination(prev => ({ ...prev, loading: true }));
      } else {
        setIsLoading(true);
        setError(null);
        // Reset page when fetching fresh data
        setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
        currentPageRef.current = 1;
      }

      // Convert category filter to array if present
      const categoryFilters = filters.category ? [filters.category] : undefined;
      
      // Map sort option to backend format
      const { sortBy, sortOrder } = mapSortOptionToBackend(sortOption);
      
      // Calculate request parameters
      // Use ref for current page to avoid stale closure issues
      const pageToFetch = loadMore ? currentPageRef.current : 1;
      const offset = (pageToFetch - 1) * pagination.limit;
      
      console.log(`Fetching food data: loadMore=${loadMore}, page=${pageToFetch}, limit=${pagination.limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);
      
      const response = await getFoodCatalog(
        pagination.limit,
        offset,
        categoryFilters,
        filters.name, // Pass the search term
        sortBy,       // Pass the sort field
        sortOrder     // Pass the sort order
      );

      if (response.error) {
        console.error('API Error:', response.error);
        setError(response.error);
        return;
      }

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data:', response.data);
        setError('Invalid response format from server');
        return;
      }

      const responseData = response.data;
      console.log(`Received ${responseData.length} items, hasMore=${response.hasMore}, total=${response.total}`);

      // Log the first few IDs for debugging
      if (responseData.length > 0) {
        console.log('First few item IDs:', responseData.slice(0, 5).map(item => item.id));
      } else {
        console.log('No items received in this batch');
      }

      if (loadMore) {
        // Append new items to existing data
        setFoodData(prevData => {
          // Create a Set of existing IDs for efficient lookups
          const existingIds = new Set(prevData.map(item => item.id));

          // Filter out duplicates
          const newItems = responseData.filter(item => !existingIds.has(item.id));
          console.log(`Adding ${newItems.length} new items to existing ${prevData.length} items`);

          // Always update the page number for next load
          const nextPage = pageToFetch + 1;
          console.log(`Setting next page to ${nextPage}`);

          // Update pagination state
          setPagination(prev => ({
            ...prev,
            page: nextPage,
            hasMore: response.hasMore,
            total: response.total,
            loading: false
          }));

          // Update the ref
          currentPageRef.current = nextPage;

          // Return the combined array
          return [...prevData, ...newItems];
        });
      } else {
        // Replace all data for initial load or refresh
        setFoodData(responseData);

        // Update pagination state for first load
        const nextPage = 2; // Since we just loaded page 1
        setPagination(prev => ({
          ...prev,
          page: nextPage,
          hasMore: response.hasMore,
          total: response.total,
          loading: false
        }));

        // Update the ref
        currentPageRef.current = nextPage;
      }
    } catch (err: any) {
      console.error('Error in fetchFoodData:', err);
      setError(err.message || 'Failed to fetch food data');
      setPagination(prev => ({ ...prev, loading: false }));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  // Only include stable dependencies to prevent infinite loops
  }, [filters.category, filters.name, sortOption, pagination.limit, pagination.hasMore, pagination.loading]);
  
  // Load initial data
  useEffect(() => {
    // Only fetch data on component mount
    const loadInitialData = async () => {
      console.log('Loading initial food data');
      await fetchFoodData(false);
    };

    loadInitialData();
    // We only want this to run once on mount, so no dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create a separate effect to handle category filter changes
  useEffect(() => {
    // Skip on initial mount since we already fetch data in the other useEffect
    if (filters.category !== undefined) {
      console.log('Category filter changed, reloading data');
      fetchFoodData(false);
    }
    // Only depend on category filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category]);
  
  // Create a separate effect to handle sort option changes
  useEffect(() => {
    // Skip on initial mount since we already fetch data in the other useEffect
    // Only refetch if we have already loaded initial data
    if (foodData.length > 0 || !isLoading) {
      console.log('Sort option changed, reloading data');
      // Reset pagination when sorting changes
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      currentPageRef.current = 1;
      // Clear food data to avoid mixing results from different sorts
      setFoodData([]);
      fetchFoodData(false);
    }
    // Only depend on sort option
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]);
  
  // Handle load more when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (!pagination.hasMore || isLoading || pagination.loading || isFetchingRef.current) {
      console.log('Skipping load more:', {
        hasMore: pagination.hasMore,
        isLoading,
        isLoadingMore: pagination.loading,
        isFetching: isFetchingRef.current
      });
      return;
    }

    console.log('Loading more items from page:', currentPageRef.current);
    fetchFoodData(true);
  }, [fetchFoodData, pagination.hasMore, isLoading, pagination.loading]);

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
    // Check if category filter changed (this requires backend refetch)
    const categoryChanged = newFilters.category !== filters.category;
    
    // Update all filters
    setCategoryFilter(newFilters.category);
    setDietaryOptions(newFilters.dietaryOptions || []);
    setPriceCategory(newFilters.priceCategory);
    setNutritionScoreRange(newFilters.minNutritionScore, newFilters.maxNutritionScore);

    // Only reset pagination and clear data when backend-relevant filters change (category)
    // Client-side filters (priceCategory, dietaryOptions, nutritionScoreRange) work immediately
    // on existing data via displayItems, so no need to clear and refetch
    if (categoryChanged) {
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      currentPageRef.current = 1;
      setFoodData([]);
    }
  }, [filters.category, setCategoryFilter, setDietaryOptions, setPriceCategory, setNutritionScoreRange]);

  // Handle propose food submission
  const handleProposeFoodSubmit = useCallback(async (data: FoodProposalData) => {
    setProposeFoodModalVisible(false);
    setIsLoading(true);

    try {
      // Convert micronutrients from strings to numbers
      const micronutrients: Record<string, number> = {};
      if (data.micronutrients) {
        Object.entries(data.micronutrients).forEach(([key, value]) => {
          const numValue = Number(value);
          if (!isNaN(numValue) && value.trim() !== '') {
            micronutrients[key] = numValue;
          }
        });
      }

      // Convert the data to the format expected by the API
      const proposalData = {
        name: data.name,
        category: data.category,
        servingSize: Number(data.servingSize) || 100,
        caloriesPerServing: Number(data.calories) || 0,
        proteinContent: Number(data.protein) || 0,
        fatContent: Number(data.fat) || 0,
        carbohydrateContent: Number(data.carbohydrates) || 0,
        // Optional fields
        dietaryOptions: data.dietaryOptions || [],
        imageUrl: data.imageUrl || undefined,
        basePrice: data.basePrice ? Number(data.basePrice) : undefined,
        priceUnit: data.priceUnit || 'per_100g',
        currency: data.currency || 'TRY',
        micronutrients: Object.keys(micronutrients).length > 0 ? micronutrients : undefined,
      };

      const response = await submitFoodProposal(proposalData);

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setNotificationMessage(`Food proposal for "${data.name}" has been submitted for review!`);
        setShowSuccessNotification(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit food proposal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove a specific dietary option
  const removeDietaryOption = useCallback((option: DietaryOptionType) => {
    const currentOptions = filters.dietaryOptions || [];
    setDietaryOptions(currentOptions.filter(o => o !== option));
  }, [filters.dietaryOptions, setDietaryOptions]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    // Don't try to refresh if we're already fetching
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping refresh');
      return;
    }

    console.log('Refreshing food data');
    setRefreshing(true);

    // Reset pagination state
    setPagination(prev => ({
      ...prev,
      page: 1,
      hasMore: true,
      loading: false
    }));
    currentPageRef.current = 1;

    // Clear food data to avoid mixing results
    setFoodData([]);

    // Fetch fresh data
    fetchFoodData(false)
      .finally(() => {
        setRefreshing(false);
      });
  }, [fetchFoodData]);

  // Check if filters are active
  const hasActiveFilters = filters.name || filters.category || (filters.dietaryOptions?.length ?? 0) > 0 ||
    filters.priceCategory !== undefined ||
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

  // Render footer for infinite loading
  const renderFooter = useCallback(() => {
    return (
      <View style={styles.footerLoader}>
        {pagination.loading ? (
          <>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.footerText, textStyles.caption]}>Loading more items...</Text>
          </>
        ) : pagination.hasMore ? (
          <Text style={[styles.footerText, textStyles.caption]}>
            {`Scroll to load more (${foodData.length}/${pagination.total || '?'} items)`}
          </Text>
        ) : (
          <Text style={[styles.footerText, textStyles.caption]}>
            {foodData.length > 0 ? 'End of list' : 'No items found'}
          </Text>
        )}
      </View>
    );
  }, [pagination.loading, pagination.hasMore, pagination.total, foodData.length, theme.primary, textStyles.caption]);

  // Generate key extractor for list items
  const keyExtractor = useCallback((item: FoodItem) => item.id.toString(), []);

  // Use a ref to track the last onEndReached call time
  const lastEndReachedCallRef = React.useRef<number | null>(null);

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
          <View style={styles.headerButtons}>
            <Button
              title="Compare"
              variant="primary"
              size="small"
              iconName="chart-line"
              onPress={() => navigation.navigate('FoodCompare')}
              style={styles.compareButton}
            />
            <Button
              title="Propose Food"
              variant="primary"
              size="small"
              iconName="plus"
              onPress={() => setProposeFoodModalVisible(true)}
            />
          </View>
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
                  <Icon
                    name="close"
                    size={14}
                    color={theme.error}
                    style={styles.activeFilterIcon}
                  />
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
                  <Icon
                    name="close"
                    size={14}
                    color={theme.error}
                    style={styles.activeFilterIcon}
                  />
                </TouchableOpacity>
              ))}

              {filters.priceCategory && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => setPriceCategory(undefined)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    Price: {filters.priceCategory}
                  </Text>
                  <Icon
                    name="close"
                    size={14}
                    color={theme.error}
                    style={styles.activeFilterIcon}
                  />
                </TouchableOpacity>
              )}

              {(filters.minNutritionScore !== undefined || filters.maxNutritionScore !== undefined) && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, { backgroundColor: theme.errorContainerBg }]}
                  onPress={() => setNutritionScoreRange(undefined, undefined)}
                >
                  <Text style={[styles.activeFilterText, { color: theme.error }]}>
                    Nutrition: {filters.minNutritionScore || 0} - {filters.maxNutritionScore || 10}
                  </Text>
                  <Icon
                    name="close"
                    size={14}
                    color={theme.error}
                    style={styles.activeFilterIcon}
                  />
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
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle" size={64} color={theme.error} />
          <Text style={[styles.emptyTitle, textStyles.heading4]}>Error loading foods</Text>
          <Text style={[styles.emptyText, textStyles.body]}>{error}</Text>
          <Button
            title="Retry"
            onPress={() => fetchFoodData(false)}
            variant="primary"
            style={styles.emptyButton}
            iconName="refresh"
          />
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                "Debug Info",
                `API URL: ${API_CONFIG.BASE_URL}\nEndpoint: /foods\nCategory Filter: ${filters.category || 'None'}`
              );
              fetchFoodData();
            }}
          >
            <Text style={styles.debugText}>Debug API Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayItems}
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
          onEndReached={() => {
            // Prevent edge bounce triggering loads on iOS
            if (foodData.length === 0) return;

            console.log("Reached end of list, debouncing load more call...");
            // Prevent multiple triggers with debouncing
            if (!pagination.loading && pagination.hasMore && !isFetchingRef.current) {
              // Use a ref to track the last onEndReached call time
              if (!lastEndReachedCallRef.current ||
                Date.now() - lastEndReachedCallRef.current > 1000) {
                lastEndReachedCallRef.current = Date.now();
                handleLoadMore();
              } else {
                console.log("Ignoring end reached call, too soon after previous call");
              }
            }
          }}
          onEndReachedThreshold={0.3} // Trigger earlier
          ListFooterComponent={renderFooter}
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
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  compareButton: {
    marginRight: SPACING.xs,
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
  debugButton: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  debugText: {
    color: '#0066CC',
    fontWeight: '500',
  },
  footerLoader: {
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: SPACING.sm,
  },
});

export default FoodScreen;
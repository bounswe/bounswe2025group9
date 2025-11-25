/**
 * FoodSelectorModal
 * 
 * Modal component for searching and selecting food items.
 * Features:
 * - Search functionality with debouncing
 * - Display food items with images and nutrition info
 * - Pagination support
 * - Loading and error states
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  ListRenderItemInfo,
} from 'react-native';
import { PALETTE, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FoodItem } from '../../types/types';
import TextInput from '../common/TextInput';
import { getFoodCatalog } from '../../services/api/food.service';

interface FoodSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
}

const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { theme, textStyles } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getFoodCatalog(20, 0, undefined, searchTerm);
        
        if (response.error) {
          setError(response.error);
          setSearchResults([]);
        } else {
          const foods = response.data || [];
          setSearchResults(foods);
          if (foods.length === 0) {
            setError(`No foods found for "${searchTerm}".`);
          }
        }
      } catch (err) {
        console.error('Error searching foods:', err);
        setError('Error searching for foods.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    onSelect(food);
    handleClose();
  };

  const renderFoodItem = ({ item }: ListRenderItemInfo<FoodItem>) => (
    <TouchableOpacity
      style={[styles.foodItem, { backgroundColor: theme.surface }]}
      onPress={() => handleSelectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodImageContainer}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.foodItemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.foodItemImagePlaceholder, { backgroundColor: theme.card }]}>
            <Icon name={item.iconName} size={32} color={theme.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.foodItemInfo}>
        <Text style={[styles.foodItemName, textStyles.body]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.foodItemCategory, textStyles.caption, { color: theme.textSecondary }]}>
          Category: {item.category}
        </Text>
        
        {item.nutritionScore !== undefined && (
          <View style={styles.nutritionScoreContainer}>
            <Text style={[styles.nutritionScoreLabel, textStyles.caption, { color: theme.textSecondary }]}>
              Nutrition Score:
            </Text>
            <View style={[styles.nutritionScoreBadge, { 
              backgroundColor: getNutritionScoreColor(item.nutritionScore) 
            }]}>
              <Text style={[styles.nutritionScoreValue, { color: PALETTE.NEUTRAL.WHITE }]}>
                {item.nutritionScore.toFixed(1)}
              </Text>
            </View>
          </View>
        )}
        
        {item.macronutrients && (
          <Text style={[styles.foodItemCalories, textStyles.caption, { color: theme.textSecondary }]}>
            {item.macronutrients.calories} kcal
          </Text>
        )}

        {item.dietaryOptions && item.dietaryOptions.length > 0 && (
          <View style={styles.dietaryOptionsContainer}>
            {item.dietaryOptions.slice(0, 3).map((option, index) => (
              <View 
                key={index} 
                style={[styles.dietaryTag, { backgroundColor: theme.primary + '20' }]}
              >
                <Text style={[styles.dietaryTagText, { color: theme.primary }]}>
                  {option}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const getNutritionScoreColor = (score: number): string => {
    if (score >= 8) return PALETTE.SUCCESS.DEFAULT;
    if (score >= 6) return PALETTE.WARNING.DEFAULT;
    return PALETTE.ERROR.DEFAULT;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, textStyles.heading3]}>
              Select Food Item
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search foods..."
              onChangeText={setSearchTerm}
              value={searchTerm}
              iconName="magnify"
              clearButton
              onClear={() => setSearchTerm('')}
            />
          </View>

          {/* Results List */}
          <View style={styles.resultsContainer}>
            {loading && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, textStyles.body, { color: theme.textSecondary }]}>
                  Searching...
                </Text>
              </View>
            )}

            {!loading && searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderFoodItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
              />
            )}

            {!loading && searchResults.length === 0 && searchTerm.trim().length > 0 && (
              <View style={styles.centerContainer}>
                <Icon name="food-off" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                  No foods found matching your search.
                </Text>
              </View>
            )}

            {!loading && searchTerm.trim().length === 0 && (
              <View style={styles.centerContainer}>
                <Icon name="magnify" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                  Start typing to search for foods
                </Text>
              </View>
            )}

            {!loading && error && searchResults.length === 0 && (
              <View style={styles.centerContainer}>
                <Icon name="alert-circle" size={64} color={theme.error} />
                <Text style={[styles.errorText, textStyles.body, { color: theme.error }]}>
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  foodItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodImageContainer: {
    marginRight: SPACING.md,
  },
  foodItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  foodItemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodItemName: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  foodItemCategory: {
    marginBottom: SPACING.xs,
  },
  nutritionScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nutritionScoreLabel: {
    marginRight: SPACING.xs,
  },
  nutritionScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nutritionScoreValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  foodItemCalories: {
    marginBottom: SPACING.xs,
  },
  dietaryOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  dietaryTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dietaryTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  emptyText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default FoodSelectorModal;

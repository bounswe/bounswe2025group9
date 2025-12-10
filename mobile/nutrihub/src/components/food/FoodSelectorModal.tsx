/**
 * FoodSelectorModal
 * 
 * Modal component for searching and selecting food items.
 * Features:
 * - Search functionality with debouncing
 * - Display food items with images and nutrition info
 * - Pagination support
 * - Loading and error states
 * - Private foods tab for user's custom foods
 * - Create private food option
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { PALETTE, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { FoodItem, PrivateFoodItem } from '../../types/types';
import TextInput from '../common/TextInput';
import { getFoodCatalog } from '../../services/api/food.service';
import { privateFoodService } from '../../services/api/privateFood.service';
import PrivateFoodModal from './PrivateFoodModal';

interface FoodSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
}

type TabType = 'all' | 'private';

const FoodSelectorModal: React.FC<FoodSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { theme, textStyles } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [privateFoods, setPrivateFoods] = useState<PrivateFoodItem[]>([]);
  const [filteredPrivateFoods, setFilteredPrivateFoods] = useState<PrivateFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateFoodModal, setShowPrivateFoodModal] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load private foods when modal opens
  useEffect(() => {
    if (visible) {
      loadPrivateFoods();
    }
  }, [visible]);

  const loadPrivateFoods = async () => {
    setLoadingPrivate(true);
    try {
      const foods = await privateFoodService.getPrivateFoods();
      setPrivateFoods(foods);
      setFilteredPrivateFoods(foods);
    } catch (err) {
      console.error('Error loading private foods:', err);
    } finally {
      setLoadingPrivate(false);
    }
  };

  // Filter private foods when search term changes
  useEffect(() => {
    if (activeTab === 'private') {
      if (searchTerm.trim().length === 0) {
        setFilteredPrivateFoods(privateFoods);
      } else {
        const lowerSearch = searchTerm.toLowerCase();
        setFilteredPrivateFoods(
          privateFoods.filter(f => f.title.toLowerCase().includes(lowerSearch))
        );
      }
    }
  }, [searchTerm, privateFoods, activeTab]);

  useEffect(() => {
    // Debounce search for catalog foods
    if (activeTab !== 'all') return;

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
  }, [searchTerm, activeTab]);

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    setActiveTab('all');
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    onSelect(food);
    handleClose();
  };

  const handlePrivateFoodSaved = (food: PrivateFoodItem) => {
    console.log('Private food saved:', food);
    loadPrivateFoods();
    setShowPrivateFoodModal(false);
  };

  const openPrivateFoodModal = () => {
    console.log('Opening private food modal');
    setShowPrivateFoodModal(true);
  };

  const renderFoodItem = ({ item }: ListRenderItemInfo<FoodItem | PrivateFoodItem>) => (
    <TouchableOpacity
      style={[styles.foodItem, { backgroundColor: theme.surface }]}
      onPress={() => handleSelectFood(item as FoodItem)}
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
            <Icon name={(item.iconName || 'food') as any} size={32} color={theme.textSecondary} />
          </View>
        )}
        {/* Private food badge */}
        {item.isPrivate && (
          <View style={[styles.privateBadge, { backgroundColor: theme.primary }]}>
            <Icon name="lock" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.foodItemInfo}>
        <View style={styles.foodItemHeader}>
          <Text style={[styles.foodItemName, textStyles.body]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.isPrivate && (
            <View style={[styles.privateTag, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.privateTagText, { color: theme.primary }]}>Private</Text>
            </View>
          )}
        </View>
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
            {(item.dietaryOptions as string[]).slice(0, 3).map((option, index) => (
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

  const renderEmptyPrivateFoods = () => (
    <View style={styles.centerContainer}>
      <Icon name="food-variant-off" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
        You haven't created any private foods yet.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={openPrivateFoodModal}
      >
        <Icon name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Your First Private Food</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoSearchResults = () => (
    <View style={styles.centerContainer}>
      <Icon name="food-off" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
        No foods found matching your search.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.primary, marginTop: SPACING.lg }]}
        onPress={openPrivateFoodModal}
      >
        <Icon name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create a Private Food</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
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
                onPress={openPrivateFoodModal}
                style={[styles.addPrivateButton, { backgroundColor: theme.primary }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={[styles.tabContainer, { backgroundColor: theme.surfaceVariant }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'all' && styles.activeTab,
                  activeTab === 'all' && { backgroundColor: theme.primary }
                ]}
                onPress={() => setActiveTab('all')}
              >
                <Icon
                  name="food-apple"
                  size={18}
                  color={activeTab === 'all' ? '#FFFFFF' : theme.textSecondary}
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'all' ? '#FFFFFF' : theme.textSecondary }
                ]}>
                  All Foods
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'private' && styles.activeTab,
                  activeTab === 'private' && { backgroundColor: theme.primary }
                ]}
                onPress={() => setActiveTab('private')}
              >
                <Icon
                  name="lock"
                  size={18}
                  color={activeTab === 'private' ? '#FFFFFF' : theme.textSecondary}
                />
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'private' ? '#FFFFFF' : theme.textSecondary }
                ]}>
                  My Private Foods
                </Text>
                {privateFoods.length > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: activeTab === 'private' ? '#FFFFFF' : theme.primary }]}>
                    <Text style={[styles.tabBadgeText, { color: activeTab === 'private' ? theme.primary : '#FFFFFF' }]}>
                      {privateFoods.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                placeholder={activeTab === 'all' ? 'Search foods...' : 'Search private foods...'}
                onChangeText={setSearchTerm}
                value={searchTerm}
                iconName="magnify"
                clearButton
                onClear={() => setSearchTerm('')}
              />
            </View>

            {/* Results List */}
            <View style={styles.resultsContainer}>
              {/* All Foods Tab */}
              {activeTab === 'all' && (
                <>
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

                  {!loading && searchResults.length === 0 && searchTerm.trim().length > 0 && !error && (
                    renderNoSearchResults()
                  )}

                  {!loading && searchTerm.trim().length === 0 && (
                    <View style={styles.centerContainer}>
                      <Icon name="magnify" size={64} color={theme.textSecondary} />
                      <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                        Start typing to search for foods
                      </Text>
                      <Text style={[styles.hintText, textStyles.caption, { color: theme.textSecondary }]}>
                        Or switch to "My Private Foods" tab to use your custom foods
                      </Text>
                    </View>
                  )}

                  {!loading && error && searchResults.length === 0 && searchTerm.trim().length > 0 && (
                    renderNoSearchResults()
                  )}
                </>
              )}

              {/* Private Foods Tab */}
              {activeTab === 'private' && (
                <>
                  {loadingPrivate && (
                    <View style={styles.centerContainer}>
                      <ActivityIndicator size="large" color={theme.primary} />
                      <Text style={[styles.loadingText, textStyles.body, { color: theme.textSecondary }]}>
                        Loading private foods...
                      </Text>
                    </View>
                  )}

                  {!loadingPrivate && filteredPrivateFoods.length > 0 && (
                    <FlatList
                      data={filteredPrivateFoods}
                      renderItem={renderFoodItem}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={styles.listContent}
                      showsVerticalScrollIndicator={true}
                    />
                  )}

                  {!loadingPrivate && filteredPrivateFoods.length === 0 && searchTerm.trim().length > 0 && (
                    <View style={styles.centerContainer}>
                      <Icon name="food-variant-off" size={64} color={theme.textSecondary} />
                      <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
                        No private foods match your search.
                      </Text>
                    </View>
                  )}

                  {!loadingPrivate && privateFoods.length === 0 && searchTerm.trim().length === 0 && (
                    renderEmptyPrivateFoods()
                  )}

                  {!loadingPrivate && privateFoods.length > 0 && filteredPrivateFoods.length === 0 && searchTerm.trim().length === 0 && (
                    <FlatList
                      data={privateFoods}
                      renderItem={renderFoodItem}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={styles.listContent}
                      showsVerticalScrollIndicator={true}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Private Food Modal */}
      <PrivateFoodModal
        visible={showPrivateFoodModal}
        onClose={() => setShowPrivateFoodModal(false)}
        onSave={handlePrivateFoodSaved}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
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
  addPrivateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    position: 'relative',
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
  privateBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  foodItemName: {
    fontWeight: '600',
    flex: 1,
  },
  privateTag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateTagText: {
    fontSize: 10,
    fontWeight: '600',
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
  hintText: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  errorText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default FoodSelectorModal;

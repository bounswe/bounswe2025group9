/**
 * PrivateFoodDetailScreen
 * 
 * Displays detailed information about a private food item.
 * Includes edit and delete functionality.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING, BORDER_RADIUS, getValidIconName } from '../../constants/theme';
import { ProfileStackParamList } from '../../navigation/types';
import { FoodItem } from '../../types/types';
import { PrivateFood } from '../../types/nutrition';
import { getPrivateFoodsAsFoodItems, deletePrivateFood } from '../../services/api/privateFood.service';
import Card from '../../components/common/Card';
import PrivateFoodModal from '../../components/food/PrivateFoodModal';
import { getPriceCategoryText, getPriceCategoryColor } from '../../utils/priceUtils';

type PrivateFoodDetailScreenRouteProp = RouteProp<ProfileStackParamList, 'PrivateFoodDetail'>;
type PrivateFoodDetailScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'PrivateFoodDetail'>;

// Helper function to extract unit from nutrient name (last parentheses only)
const extractUnit = (nutrientName: string): string => {
  const match = nutrientName.match(/\(([^()]+)\)$/);
  return match ? match[1] : '';
};

// Helper function to convert amount to comparable value (in micrograms)
const normalizeAmount = (amount: number, unit: string): number => {
  const unitLower = unit.toLowerCase();
  if (unitLower === 'g') return amount * 1_000_000;
  if (unitLower === 'mg') return amount * 1_000;
  if (unitLower === 'µg' || unitLower === 'ug') return amount;
  return amount;
};

// Define priority micronutrients to display
const priorityMicronutrients = [
  "Water (g)",
  "Niacin (mg)",
  "Thiamin (mg)",
  "Retinol (g)",
  "Zinc, Zn (mg)",
  "Copper, Cu (mg)",
  "Riboflavin (mg)",
  "Sodium, Na (mg)",
  "Calcium, Ca (mg)",
  "Cholesterol (mg)",
  "Total Sugars (g)",
  "Vitamin B-6 (mg)",
  "Potassium, K (mg)",
  "Magnesium, Mg (mg)",
  "Phosphorus, P (mg)",
  "Selenium, Se (g)",
  "Vitamin B-12 (g)",
  "Choline, total (mg)",
  "Carotene, beta (g)",
  "Vitamin A, RAE (g)",
  "Vitamin D (D2 + D3) (g)",
  "Vitamin K (phylloquinone) (g)",
  "Fatty acids, total saturated (g)",
  "Vitamin E (alpha-tocopherol) (mg)",
  "Fatty acids, total monounsaturated (g)",
  "Fatty acids, total polyunsaturated (g)"
];

const PrivateFoodDetailScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<PrivateFoodDetailScreenNavigationProp>();
  const route = useRoute<PrivateFoodDetailScreenRouteProp>();
  const { foodId } = route.params;

  const [food, setFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Convert FoodItem to PrivateFood for editing
  const convertToPrivateFood = useCallback((item: FoodItem): PrivateFood => {
    // Convert negative ID back to positive string for API
    const realId = String(Math.abs(item.id));
    return {
      id: realId,
      name: item.title,
      category: item.category || 'Other',
      servingSize: item.servingSize || 100,
      calories: item.macronutrients?.calories || 0,
      protein: item.macronutrients?.protein || 0,
      carbohydrates: item.macronutrients?.carbohydrates || 0,
      fat: item.macronutrients?.fat || 0,
      fiber: item.macronutrients?.fiber,
      sugar: item.macronutrients?.sugar,
      micronutrients: item.micronutrients,
      dietaryOptions: item.dietaryOptions as string[] | undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceType: 'custom',
    };
  }, []);

  // Handle edit save
  const handleEditSave = useCallback(() => {
    setIsEditModalVisible(false);
    loadFood(); // Reload the food data after editing
  }, [loadFood]);

  // Load food data
  const loadFood = useCallback(async () => {
    setIsLoading(true);
    try {
      const privateFoods = await getPrivateFoodsAsFoodItems();
      const foundFood = privateFoods.find(f => f.id === foodId);
      setFood(foundFood || null);
    } catch (error) {
      console.error('Error loading private food:', error);
      setFood(null);
    } finally {
      setIsLoading(false);
    }
  }, [foodId]);

  useFocusEffect(
    useCallback(() => {
      loadFood();
    }, [loadFood])
  );

  // Get nutrition score color based on value
  const getNutritionScoreColor = (score?: number): string => {
    if (!score) return theme.textSecondary;
    if (score >= 8) return theme.success;
    if (score >= 5) return theme.warning;
    return theme.error;
  };

  // Get nutrition score background color
  const getNutritionScoreBgColor = (score?: number): string => {
    const color = getNutritionScoreColor(score);
    return color + '20';
  };

  // Handle delete
  const handleDelete = async () => {
    if (!food) return;

    Alert.alert(
      t('common.confirm', { defaultValue: 'Confirm' }),
      t('food.deletePrivateFoodConfirm', { 
        defaultValue: `Delete "${food.title}"? This action cannot be undone.`,
        name: food.title 
      }),
      [
        {
          text: t('common.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
        },
        {
          text: t('common.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Convert negative ID back to positive for API call
              const realId = String(Math.abs(food.id));
              const success = await deletePrivateFood(realId);
              if (success) {
                Alert.alert(
                  t('common.success', { defaultValue: 'Success' }),
                  t('food.privateFoodDeleted', { defaultValue: 'Private food deleted successfully.' }),
                  [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert(
                  t('common.error', { defaultValue: 'Error' }),
                  t('food.deleteFailed', { defaultValue: 'Failed to delete food. Please try again.' })
                );
              }
            } catch (error: any) {
              const status = error?.response?.status;
              if (status === 409) {
                Alert.alert(
                  t('common.error', { defaultValue: 'Error' }),
                  t('food.cannotDeleteInUse', { defaultValue: 'This food cannot be deleted because it is currently in use.' })
                );
              } else {
                Alert.alert(
                  t('common.error', { defaultValue: 'Error' }),
                  t('food.deleteFailed', { defaultValue: 'Failed to delete food. Please try again.' })
                );
              }
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Render dietary tag
  const renderDietaryTag = (tag: string, index: number) => (
    <View 
      key={index} 
      style={[styles.dietaryTag, { backgroundColor: theme.badgeBackground }]}
    >
      <Text style={[styles.dietaryTagText, { color: theme.badgeText }]}>
        {tag}
      </Text>
    </View>
  );

  // Render allergen warning
  const renderAllergenWarning = (allergen: string, index: number) => (
    <View 
      key={index} 
      style={[styles.allergenTag, { backgroundColor: theme.errorContainerBg }]}
    >
      <Icon name="alert" size={14} color={theme.error} style={styles.allergenIcon} />
      <Text style={[styles.allergenText, { color: theme.error }]}>
        {allergen}
      </Text>
    </View>
  );

  // Render price category badge
  const renderPriceCategoryBadge = () => {
    if (!food?.priceCategory) return null;
    
    const categoryText = getPriceCategoryText(food.priceCategory);
    const categoryColor = getPriceCategoryColor(food.priceCategory);
    
    return (
      <View style={[styles.priceCategoryBadge, { backgroundColor: categoryColor + '20', borderColor: categoryColor }]}>
        <Text style={[styles.priceCategoryText, { color: categoryColor }]}>
          {categoryText}
        </Text>
      </View>
    );
  };

  // Filter and display micronutrients
  const displayedMicronutrients = food?.micronutrients 
    ? priorityMicronutrients
        .filter(nutrient => food.micronutrients && nutrient in food.micronutrients)
        .map(nutrient => {
          let value = food.micronutrients![nutrient];
          if (typeof value !== 'number' || isNaN(value)) {
            value = 0;
          }
          if (food.servingSize && food.servingSize !== 100) {
            value = (value * 100) / food.servingSize;
          }
          return [nutrient, value] as [string, number];
        })
        .sort((a, b) => {
          const unitA = extractUnit(a[0]);
          const unitB = extractUnit(b[0]);
          const normalizedA = normalizeAmount(a[1], unitA);
          const normalizedB = normalizeAmount(b[1], unitB);
          return normalizedB - normalizedA;
        })
    : [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: SPACING.md }]}>
            {t('common.loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('common.back', { defaultValue: 'Go back' })}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { borderColor: theme.border }]}
          >
            <Icon name="chevron-left" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[textStyles.heading2, { color: theme.text }]}>
            {t('food.privateFoodDetail', { defaultValue: 'Private Food' })}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="food-off" size={64} color={theme.textSecondary} />
          <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: SPACING.md }]}>
            {t('food.foodNotFound', { defaultValue: 'Food not found.' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Go back' })}
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { borderColor: theme.border }]}
        >
          <Icon name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[textStyles.heading2, { color: theme.text }]} numberOfLines={1}>
            {food.title}
          </Text>
          <View style={[styles.privateIndicator, { backgroundColor: `${theme.success}15` }]}>
            <Icon name="lock" size={14} color={theme.success} />
            <Text style={[styles.privateText, { color: theme.success }]}>
              {t('food.private', { defaultValue: 'Private' })}
            </Text>
          </View>
        </View>
        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsEditModalVisible(true)}
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit', { defaultValue: 'Edit' })}
          >
            <Icon name="pencil" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete', { defaultValue: 'Delete' })}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="delete" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Food Icon and Title */}
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.placeholder }]}>
            <Icon 
              name={getValidIconName(food.iconName)} 
              size={48} 
              color={theme.primary} 
            />
          </View>
          <Text style={[styles.foodTitle, textStyles.heading2]}>{food.title}</Text>
          <Text style={[styles.foodDescription, textStyles.body]}>{food.description}</Text>
        </View>

        {/* Basic Information */}
        <Card style={styles.infoCard}>
          <Text style={[styles.sectionTitle, textStyles.subtitle]}>
            {t('food.basicInformation', { defaultValue: 'Basic Information' })}
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, textStyles.bodySecondary]}>
              {t('food.category', { defaultValue: 'Category' })}:
            </Text>
            <Text style={[styles.infoValue, textStyles.body]}>{food.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, textStyles.bodySecondary]}>
              {t('food.nutritionScore', { defaultValue: 'Nutrition Score' })}:
            </Text>
            <View style={[
              styles.nutritionScoreBadge, 
              { backgroundColor: getNutritionScoreBgColor(food.nutritionScore) }
            ]}>
              <Text style={[
                styles.nutritionScoreText, 
                { color: getNutritionScoreColor(food.nutritionScore) }
              ]}>
                {food.nutritionScore?.toFixed(1) || t('common.na', { defaultValue: 'N/A' })}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, textStyles.bodySecondary]}>
              {t('food.perUnit', { defaultValue: 'Per Unit' })}:
            </Text>
            <Text style={[styles.infoValue, textStyles.body]}>
              {t('food.per100gUnit', { defaultValue: 'per 100g' })}
            </Text>
          </View>
          {food.priceCategory && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, textStyles.bodySecondary]}>
                {t('food.priceCategory', { defaultValue: 'Price Category' })}:
              </Text>
              {renderPriceCategoryBadge()}
            </View>
          )}
        </Card>

        {/* Nutrition Information */}
        {food.macronutrients && (
          <Card style={styles.nutritionCard}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>
              {t('food.nutritionInformationPer100g', { defaultValue: 'Nutrition Information (per 100g)' })}
            </Text>
            
            {/* Macronutrients */}
            <View style={styles.macroContainer}>
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Icon name="fire" size={20} color={theme.primary} />
                  <Text style={[styles.macroLabel, textStyles.body]}>
                    {t('food.calories', { defaultValue: 'Calories' })}
                  </Text>
                </View>
                <Text style={[styles.macroValue, textStyles.heading4]}>
                  {food.macronutrients.calories} {t('metrics.kcal', { defaultValue: 'kcal' })}
                </Text>
              </View>
              
              <View style={styles.macroRow}>
                <View style={[styles.macroItem, styles.macroItemHalf]}>
                  <View style={styles.macroHeader}>
                    <Icon name="food-steak" size={20} color={theme.accent} />
                    <Text style={[styles.macroLabel, textStyles.body]}>
                      {t('food.protein', { defaultValue: 'Protein' })}
                    </Text>
                  </View>
                  <Text style={[styles.macroValue, textStyles.subtitle]}>
                    {food.macronutrients.protein}g
                  </Text>
                </View>
                
                <View style={[styles.macroItem, styles.macroItemHalf]}>
                  <View style={styles.macroHeader}>
                    <Icon name="bread-slice" size={20} color={theme.warning} />
                    <Text style={[styles.macroLabel, textStyles.body]}>
                      {t('food.carbs', { defaultValue: 'Carbs' })}
                    </Text>
                  </View>
                  <Text style={[styles.macroValue, textStyles.subtitle]}>
                    {food.macronutrients.carbohydrates}g
                  </Text>
                </View>
              </View>
              
              <View style={styles.macroRow}>
                <View style={[styles.macroItem, styles.macroItemHalf]}>
                  <View style={styles.macroHeader}>
                    <Icon name="oil" size={20} color="#FFA000" />
                    <Text style={[styles.macroLabel, textStyles.body]}>
                      {t('food.fat', { defaultValue: 'Fat' })}
                    </Text>
                  </View>
                  <Text style={[styles.macroValue, textStyles.subtitle]}>
                    {food.macronutrients.fat}g
                  </Text>
                </View>
                
                {food.macronutrients.fiber !== undefined && (
                  <View style={[styles.macroItem, styles.macroItemHalf]}>
                    <View style={styles.macroHeader}>
                      <Icon name="leaf" size={20} color={theme.success} />
                      <Text style={[styles.macroLabel, textStyles.body]}>
                        {t('food.fiber', { defaultValue: 'Fiber' })}
                      </Text>
                    </View>
                    <Text style={[styles.macroValue, textStyles.subtitle]}>
                      {food.macronutrients.fiber}g
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Micronutrients Section */}
        {displayedMicronutrients.length > 0 && (
          <Card style={styles.micronutrientsCard}>
            <View style={styles.micronutrientsHeader}>
              <Icon name="pill" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, textStyles.subtitle, { marginBottom: 0, marginLeft: SPACING.xs }]}>
                {t('food.micronutrientsPer100g', { defaultValue: 'Micronutrients (per 100g)' })}
              </Text>
            </View>
            <View style={styles.micronutrientsContainer}>
              {displayedMicronutrients.map(([nutrient, amount]) => {
                const unit = extractUnit(nutrient);
                const nutrientName = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
                const displayAmount = typeof amount === 'number' && !isNaN(amount) 
                  ? amount.toFixed(2) 
                  : '0.00';
                
                return (
                  <View key={nutrient} style={styles.micronutrientItem}>
                    <Text style={[styles.micronutrientLabel, textStyles.body]}>
                      {nutrientName}
                    </Text>
                    <Text style={[styles.micronutrientValue, textStyles.body]}>
                      {displayAmount}{unit}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Dietary Tags */}
        {food.dietaryOptions && food.dietaryOptions.length > 0 && (
          <Card style={styles.tagsCard}>
            <Text style={[styles.sectionTitle, textStyles.subtitle]}>
              {t('food.dietaryTags', { defaultValue: 'Dietary Tags' })}
            </Text>
            <View style={styles.tagsContainer}>
              {food.dietaryOptions.map((tag, index) => renderDietaryTag(tag, index))}
            </View>
          </Card>
        )}

        {/* Allergen Warnings */}
        {food.allergens && food.allergens.length > 0 && (
          <View style={[styles.allergensCardWrapper, { borderColor: theme.error, borderWidth: 1 }]}>
            <Card style={styles.allergensCard}>
              <View style={styles.allergenHeader}>
                <Icon name="alert-circle" size={20} color={theme.error} />
                <Text style={[styles.sectionTitle, textStyles.subtitle, { color: theme.error, marginBottom: 0, marginLeft: SPACING.xs }]}>
                  {t('allergens.warningsTitle', { defaultValue: 'Allergen Warnings' })}
                </Text>
              </View>
              <View style={styles.allergensContainer}>
                {food.allergens.map((allergen, index) => renderAllergenWarning(allergen, index))}
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      {food && (
        <PrivateFoodModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleEditSave}
          editFood={convertToPrivateFood(food)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  privateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  foodTitle: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  foodDescription: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
  },
  nutritionScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 48,
    alignItems: 'center',
  },
  nutritionScoreText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceCategoryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  priceCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nutritionCard: {
    marginBottom: SPACING.md,
  },
  macroContainer: {
    gap: SPACING.md,
  },
  macroRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  macroItem: {
    marginBottom: SPACING.sm,
  },
  macroItemHalf: {
    flex: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  macroLabel: {
    marginLeft: SPACING.xs,
  },
  macroValue: {
    marginBottom: SPACING.xs,
  },
  tagsCard: {
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  dietaryTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  dietaryTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  allergensCardWrapper: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  allergensCard: {
    marginBottom: 0,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  allergensContainer: {
    gap: SPACING.xs,
  },
  allergenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  allergenIcon: {
    marginRight: SPACING.xs,
  },
  allergenText: {
    fontSize: 14,
    fontWeight: '500',
  },
  micronutrientsCard: {
    marginBottom: SPACING.md,
  },
  micronutrientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  micronutrientsContainer: {
    gap: SPACING.xs,
  },
  micronutrientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  micronutrientLabel: {
    flex: 1,
  },
  micronutrientValue: {
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default PrivateFoodDetailScreen;


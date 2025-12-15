/**
 * FoodDetailModal Component
 * 
 * A modal component that displays detailed information about a food item.
 * Shows nutrition information, dietary tags, allergens, and more.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, SPACING, getValidIconName, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../common/Card';
import { FoodItem } from '../../types/types';
import { getPriceCategoryText, getPriceCategoryColor } from '../../utils/priceUtils';

interface FoodDetailModalProps {
  /**
   * Food item to display
   */
  food: FoodItem | null;
  
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Function to call when closing the modal
   */
  onClose: () => void;
  
  /**
   * Custom testID for testing
   */
  testID?: string;
}

/**
 * Modal component for displaying detailed food information
 */
const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  visible,
  onClose,
  testID,
}) => {
  const { theme, textStyles } = useTheme();
  const { t } = useLanguage();
  
  if (!food) return null;
  
  // Helper function to extract unit from nutrient name (last parentheses only)
  const extractUnit = (nutrientName: string): string => {
    // Match the last set of parentheses at the end of the string
    const match = nutrientName.match(/\(([^()]+)\)$/);
    return match ? match[1] : '';
  };

  // Helper function to convert amount to comparable value (in micrograms)
  const normalizeAmount = (amount: number, unit: string): number => {
    const unitLower = unit.toLowerCase();
    if (unitLower === 'g') return amount * 1_000_000; // g to µg
    if (unitLower === 'mg') return amount * 1_000;    // mg to µg
    if (unitLower === 'µg' || unitLower === 'ug') return amount; // already in µg
    return amount; // fallback for unknown units
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

  // Filter and display only priority micronutrients that exist in the food data, sorted by normalized amount
  // Also normalize values to per 100g if servingSize is available
  const displayedMicronutrients = food.micronutrients 
    ? priorityMicronutrients
        .filter(nutrient => food.micronutrients && nutrient in food.micronutrients)
        .map(nutrient => {
          let value = food.micronutrients![nutrient];
          // Ensure value is a valid number
          if (typeof value !== 'number' || isNaN(value)) {
            value = 0;
          }
          // Normalize to per 100g if servingSize is provided and not already 100g
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
    return color + '20'; // 20% opacity
  };
  
  // Render dietary tag using theme constants
  const renderDietaryTag = (tag: string, index: number) => (
    <View 
      key={index} 
      style={[
        styles.dietaryTag, 
        { backgroundColor: theme.badgeBackground }
      ]}
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
      style={[
        styles.allergenTag, 
        { backgroundColor: theme.errorContainerBg }
      ]}
    >
      <Icon name="alert" size={14} color={theme.error} style={styles.allergenIcon} />
      <Text style={[styles.allergenText, { color: theme.error }]}>
        {allergen}
      </Text>
    </View>
  );

  // Render price category badge
  const renderPriceCategoryBadge = () => {
    if (!food.priceCategory) return null;
    
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

  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose}
          />
          
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
              <View style={styles.dragIndicator} />
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              stickyHeaderIndices={[0]}
            >
              {/* Sticky header background */}
              <View style={[styles.stickyHeaderBackground, { backgroundColor: theme.surface }]} />
              
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
                <Text style={[styles.sectionTitle, textStyles.subtitle]}>{t('food.basicInformation')}</Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, textStyles.bodySecondary]}>{t('food.category')}:</Text>
                  <Text style={[styles.infoValue, textStyles.body]}>{food.category}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, textStyles.bodySecondary]}>{t('food.nutritionScore')}:</Text>
                  <View style={[
                    styles.nutritionScoreBadge, 
                    { backgroundColor: getNutritionScoreBgColor(food.nutritionScore) }
                  ]}>
                    <Text style={[
                      styles.nutritionScoreText, 
                      { color: getNutritionScoreColor(food.nutritionScore) }
                    ]}>
                      {food.nutritionScore?.toFixed(1) || t('common.na')}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, textStyles.bodySecondary]}>{t('food.perUnit')}:</Text>
                  <Text style={[styles.infoValue, textStyles.body]}>{t('food.per100gUnit')}</Text>
                </View>
                {food.priceCategory && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, textStyles.bodySecondary]}>{t('food.priceCategory')}:</Text>
                    {renderPriceCategoryBadge()}
                  </View>
                )}
              </Card>
              
              {/* Nutrition Information */}
              {food.macronutrients && (
                <Card style={styles.nutritionCard}>
                  <Text style={[styles.sectionTitle, textStyles.subtitle]}>
                    {t('food.nutritionInformationPer100g')}
                  </Text>
                  
                  {/* Macronutrients */}
                  <View style={styles.macroContainer}>
                    <View style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Icon name="fire" size={20} color={theme.primary} />
                        <Text style={[styles.macroLabel, textStyles.body]}>{t('food.calories')}</Text>
                      </View>
                      <Text style={[styles.macroValue, textStyles.heading4]}>
                        {food.macronutrients.calories} {t('metrics.kcal')}
                      </Text>
                    </View>
                    
                    <View style={styles.macroRow}>
                      <View style={[styles.macroItem, styles.macroItemHalf]}>
                        <View style={styles.macroHeader}>
                          <Icon name="food-steak" size={20} color={theme.accent} />
                          <Text style={[styles.macroLabel, textStyles.body]}>{t('food.protein')}</Text>
                        </View>
                        <Text style={[styles.macroValue, textStyles.subtitle]}>
                          {food.macronutrients.protein}g
                        </Text>
                      </View>
                      
                      <View style={[styles.macroItem, styles.macroItemHalf]}>
                        <View style={styles.macroHeader}>
                          <Icon name="bread-slice" size={20} color={theme.warning} />
                          <Text style={[styles.macroLabel, textStyles.body]}>{t('food.carbs')}</Text>
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
                          <Text style={[styles.macroLabel, textStyles.body]}>{t('food.fat')}</Text>
                        </View>
                        <Text style={[styles.macroValue, textStyles.subtitle]}>
                          {food.macronutrients.fat}g
                        </Text>
                      </View>
                      
                      {food.macronutrients.fiber && (
                        <View style={[styles.macroItem, styles.macroItemHalf]}>
                          <View style={styles.macroHeader}>
                            <Icon name="leaf" size={20} color={theme.success} />
                            <Text style={[styles.macroLabel, textStyles.body]}>{t('food.fiber')}</Text>
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
                      {t('food.micronutrientsPer100g')}
                    </Text>
                  </View>
                  <View style={styles.micronutrientsContainer}>
                    {displayedMicronutrients.map(([nutrient, amount]) => {
                      const unit = extractUnit(nutrient);
                      // Remove only the unit part (last parentheses) from the name
                      const nutrientName = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
                      
                      // Ensure amount is a valid number
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
                  <Text style={[styles.sectionTitle, textStyles.subtitle]}>{t('food.dietaryTags')}</Text>
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
                        {t('allergens.warningsTitle')}
                      </Text>
                    </View>
                    <View style={styles.allergensContainer}>
                      {food.allergens.map((allergen, index) => renderAllergenWarning(allergen, index))}
                    </View>
                  </Card>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    maxHeight: screenHeight * 0.9,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    ...SHADOWS.large,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.sm,
    paddingTop: SPACING.xs,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    padding: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BORDER_RADIUS.round,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: 60, // Space for the fixed header
  },
  stickyHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: -1,
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
  priceSection: {
    marginTop: SPACING.sm,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  priceValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  priceUnitText: {
    marginLeft: SPACING.xs,
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
  servingSizeContainer: {
    marginTop: SPACING.md,
  },
  servingSizeLabel: {
    marginBottom: SPACING.xs,
  },
  servingSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  servingSizeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  servingSizeButtonText: {
    fontWeight: '500',
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

export default FoodDetailModal;
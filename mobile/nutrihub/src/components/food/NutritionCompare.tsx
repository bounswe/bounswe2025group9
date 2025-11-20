/**
 * NutritionCompare
 * 
 * Wrapper component for displaying nutritional comparison between foods.
 * Includes the MacroRadarChart for visualizing macronutrients.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FoodItem } from '../../types/types';
import MacroRadarChart from './MacroRadarChart';

interface NutritionCompareProps {
  foods: FoodItem[];
}

const NutritionCompare: React.FC<NutritionCompareProps> = ({ foods }) => {
  const { theme, textStyles } = useTheme();

  if (foods.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, textStyles.body, { color: theme.textSecondary }]}>
          Select two foods to compare
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Macronutrient Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
        <MacroRadarChart food1={foods[0]} food2={foods[1]} />
      </View>

      {/* Additional Comparison Details */}
      <View style={[styles.detailsCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.detailsTitle, textStyles.heading4]}>
          Nutritional Details
        </Text>
        
        {foods.map((food, index) => (
          <View key={food.id} style={styles.foodDetail}>
            <Text style={[styles.foodDetailName, textStyles.body]} numberOfLines={1}>
              {index + 1}. {food.title}
            </Text>
            
            {food.macronutrients && (
              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Calories
                  </Text>
                  <Text style={[styles.macroValue, textStyles.body]}>
                    {food.macronutrients.calories} kcal
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Protein
                  </Text>
                  <Text style={[styles.macroValue, textStyles.body]}>
                    {food.macronutrients.protein}g
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Fat
                  </Text>
                  <Text style={[styles.macroValue, textStyles.body]}>
                    {food.macronutrients.fat}g
                  </Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                    Carbs
                  </Text>
                  <Text style={[styles.macroValue, textStyles.body]}>
                    {food.macronutrients.carbohydrates}g
                  </Text>
                </View>

                {food.macronutrients.fiber !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                      Fiber
                    </Text>
                    <Text style={[styles.macroValue, textStyles.body]}>
                      {food.macronutrients.fiber}g
                    </Text>
                  </View>
                )}

                {food.macronutrients.sugar !== undefined && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroLabel, textStyles.caption, { color: theme.textSecondary }]}>
                      Sugar
                    </Text>
                    <Text style={[styles.macroValue, textStyles.body]}>
                      {food.macronutrients.sugar}g
                    </Text>
                  </View>
                )}
              </View>
            )}

            {food.nutritionScore !== undefined && (
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreLabel, textStyles.caption, { color: theme.textSecondary }]}>
                  Nutrition Score:
                </Text>
                <Text style={[styles.scoreValue, textStyles.body, { color: theme.primary }]}>
                  {food.nutritionScore.toFixed(1)}/10
                </Text>
              </View>
            )}

            {index < foods.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  chartCard: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detailsCard: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailsTitle: {
    marginBottom: SPACING.md,
  },
  foodDetail: {
    marginBottom: SPACING.md,
  },
  foodDetailName: {
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  macroItem: {
    minWidth: '30%',
    marginBottom: SPACING.xs,
  },
  macroLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  macroValue: {
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  scoreLabel: {
    fontSize: 12,
  },
  scoreValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginTop: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default NutritionCompare;


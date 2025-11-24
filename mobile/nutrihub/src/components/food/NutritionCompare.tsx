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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface NutritionCompareProps {
  foods: FoodItem[];
}

// Get normalized micronutrient value to per 100g
const getNormalizedMicronutrient = (food: FoodItem, nutrientName: string): number => {
  if (!food.micronutrients || !(nutrientName in food.micronutrients)) {
    return 0;
  }
  
  let value = food.micronutrients[nutrientName];
  
  // Ensure value is valid
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  
  // Normalize to per 100g if servingSize is provided
  if (food.servingSize && food.servingSize !== 100) {
    value = (value * 100) / food.servingSize;
  }
  
  return value;
};

// Circular Progress Component for Micronutrients
const MicroCircularProgress: React.FC<{
  value: number;
  maxValue: number;
  color: string;
  size: number;
  strokeWidth: number;
  label: string;
  unit: string;
}> = ({ value, maxValue, color, size, strokeWidth, label, unit }) => {
  const { theme, textStyles } = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <View style={[styles.microCircularContainer, { width: size + 10, height: size + 38 }]}>
      {/* Circle container */}
      <View style={{ height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {/* Background circle */}
        <View style={[styles.microCircleBackground, { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: theme.border + '30'
        }]} />
        
        {/* Progress arc */}
        <View style={[styles.microProgressOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[
            styles.microProgressArc,
            {
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: percentage >= 1 ? color : 'transparent',
              borderRightColor: percentage >= 26 ? color : 'transparent',
              borderBottomColor: percentage >= 51 ? color : 'transparent',
              borderLeftColor: percentage >= 76 ? color : 'transparent',
              transform: [{ rotate: '-90deg' }],
              opacity: percentage > 0 ? Math.max(0.4, Math.min(1, (percentage + 20) / 100)) : 0,
            }
          ]} />
        </View>
        
        {/* Center content */}
        <View style={styles.microCircleContent}>
          <Text style={[styles.microCircleValue, textStyles.body, { color: color }]}>
            {value.toFixed(1)}
          </Text>
          <Text style={[styles.microCircleUnit, { color: theme.textSecondary, fontSize: 8 }]}>
            {unit}
          </Text>
        </View>
      </View>
      
      {/* Label below circle */}
      <Text style={[styles.microCircleLabel, textStyles.caption, { color: theme.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

// Micro Row Component
const MicroRow: React.FC<{
  label: string;
  icon: string;
  nutrientKey: string;
  food1: FoodItem;
  food2: FoodItem;
  maxValue: number;
  color1: string;
  color2: string;
  unit: string;
}> = ({ label, icon, nutrientKey, food1, food2, maxValue, color1, color2, unit }) => {
  const { theme } = useTheme();
  const value1 = getNormalizedMicronutrient(food1, nutrientKey);
  const value2 = getNormalizedMicronutrient(food2, nutrientKey);
  
  return (
    <View style={styles.microRow}>
      {/* Left Food Circle */}
      <View style={styles.microSide}>
        <MicroCircularProgress
          value={value1}
          maxValue={maxValue}
          color={color1}
          size={60}
          strokeWidth={4}
          label={label}
          unit={unit}
        />
      </View>
      
      {/* Center Icon */}
      <View style={styles.microCenterIcon}>
        <Icon name={icon as any} size={20} color={theme.primary} />
      </View>
      
      {/* Right Food Circle */}
      <View style={styles.microSide}>
        <MicroCircularProgress
          value={value2}
          maxValue={maxValue}
          color={color2}
          size={60}
          strokeWidth={4}
          label={label}
          unit={unit}
        />
      </View>
    </View>
  );
};

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
  
  const food1Color = '#3b82f6'; // Blue
  const food2Color = '#10b981'; // Green

  return (
    <View style={styles.container}>
      {/* Macronutrient Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
        <MacroRadarChart food1={foods[0]} food2={foods[1]} />
      </View>

      {/* Micronutrients Comparison */}
      <View style={[styles.microCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.microTitle, textStyles.heading4]}>
          Micronutrients (per 100g)
        </Text>
        
        <View style={styles.microGrid}>
          <MicroRow
            label="Water"
            icon="water"
            nutrientKey="Water (g)"
            food1={foods[0]}
            food2={foods[1]}
            maxValue={100}
            color1={food1Color}
            color2={food2Color}
            unit="g"
          />
          
          <MicroRow
            label="Cholesterol"
            icon="heart-pulse"
            nutrientKey="Cholesterol (mg)"
            food1={foods[0]}
            food2={foods[1]}
            maxValue={300}
            color1={food1Color}
            color2={food2Color}
            unit="mg"
          />
          
          <MicroRow
            label="Calcium"
            icon="bone"
            nutrientKey="Calcium, Ca (mg)"
            food1={foods[0]}
            food2={foods[1]}
            maxValue={1000}
            color1={food1Color}
            color2={food2Color}
            unit="mg"
          />
          
          <MicroRow
            label="Vitamin B-6"
            icon="pill"
            nutrientKey="Vitamin B-6 (mg)"
            food1={foods[0]}
            food2={foods[1]}
            maxValue={2}
            color1={food1Color}
            color2={food2Color}
            unit="mg"
          />
        </View>
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
  microCard: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  microTitle: {
    marginBottom: SPACING.md,
  },
  microGrid: {
    gap: SPACING.md,
  },
  microRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  microSide: {
    flex: 1,
    alignItems: 'center',
  },
  microCenterIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microCircularContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  microCircleBackground: {
    position: 'absolute',
    top: 0,
  },
  microProgressOverlay: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microProgressArc: {
    position: 'absolute',
  },
  microCircleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: 0,
  },
  microCircleValue: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  microCircleUnit: {
    fontSize: 8,
    marginTop: -2,
  },
  microCircleLabel: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 4,
    paddingHorizontal: 2,
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


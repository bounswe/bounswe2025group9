/**
 * MacroRadarChart
 * 
 * A visually stunning side-by-side macronutrient comparison for 2 foods.
 * Features split-screen layout with stacked macro rows.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FoodItem } from '../../types/types';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface MacroRadarChartProps {
  food1: FoodItem;
  food2: FoodItem;
}

// Format number to 2 significant figures
const toSigFigs = (num: number, sig: number = 2): number => {
  if (num === 0) return 0;
  return parseFloat(num.toPrecision(sig));
};

// Get normalized macronutrients per 100g
const getNormalizedMacros = (food: FoodItem) => {
  const macros = food.macronutrients;
  
  if (!macros) {
    return { protein: 0, fat: 0, carbs: 0, calories: 0, fiber: 0, sugar: 0 };
  }
  
  return {
    protein: toSigFigs(macros.protein || 0),
    fat: toSigFigs(macros.fat || 0),
    carbs: toSigFigs(macros.carbohydrates || 0),
    calories: macros.calories || 0,
    fiber: macros.fiber || 0,
    sugar: macros.sugar || 0,
  };
};

// Circular Progress Component
const CircularProgress: React.FC<{
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
    <View style={[styles.circularProgressContainer, { width: size, height: size + 30 }]}>
      {/* Background circle */}
      <View style={[styles.circleBackground, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: theme.border + '30'
      }]} />
      
      {/* Progress arc */}
      <View style={[styles.progressOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[
          styles.progressArc,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            // Show segments based on percentage quarters
            borderTopColor: percentage >= 1 ? color : 'transparent',
            borderRightColor: percentage >= 26 ? color : 'transparent',
            borderBottomColor: percentage >= 51 ? color : 'transparent',
            borderLeftColor: percentage >= 76 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
            // Opacity based on actual percentage for fine-tuning
            opacity: percentage > 0 ? Math.max(0.4, Math.min(1, (percentage + 20) / 100)) : 0,
          }
        ]} />
      </View>
      
      {/* Center content */}
      <View style={styles.circleContent}>
        <Text style={[styles.circleValue, textStyles.heading4, { color: color }]}>
          {value}
        </Text>
        <Text style={[styles.circleUnit, textStyles.caption, { color: theme.textSecondary }]}>
          {unit}
        </Text>
      </View>
      
      {/* Label below */}
      <Text style={[styles.circleLabel, textStyles.caption, { color: theme.text }]}>
        {label}
      </Text>
    </View>
  );
};

// Macro Row Component - Shows one macro for both foods side by side
const MacroRow: React.FC<{
  label: string;
  icon: string;
  value1: number;
  value2: number;
  maxValue: number;
  color1: string;
  color1Secondary: string;
  color2: string;
  color2Secondary: string;
  unit: string;
}> = ({ label, icon, value1, value2, maxValue, color1, color1Secondary, color2, color2Secondary, unit }) => {
  const { theme } = useTheme();
  const useSecondary = label === 'Fat';
  
  return (
    <View style={styles.macroRow}>
      {/* Left Food Circle */}
      <View style={styles.macroSide}>
        <CircularProgress
          value={value1}
          maxValue={maxValue}
          color={useSecondary ? color1Secondary : color1}
          size={70}
          strokeWidth={5}
          label={label}
          unit={unit}
        />
      </View>
      
      {/* Center Icon */}
      <View style={styles.macroCenterIcon}>
        <Icon name={icon as any} size={24} color={theme.primary} />
      </View>
      
      {/* Right Food Circle */}
      <View style={styles.macroSide}>
        <CircularProgress
          value={value2}
          maxValue={maxValue}
          color={useSecondary ? color2Secondary : color2}
          size={70}
          strokeWidth={5}
          label={label}
          unit={unit}
        />
      </View>
    </View>
  );
};

// Micronutrient Row Component
const MicronutrientRow: React.FC<{
  label: string;
  icon: string;
  value1: number;
  value2: number;
  color1: string;
  color2: string;
  unit: string;
}> = ({ label, icon, value1, value2, color1, color2, unit }) => {
  const { theme, textStyles } = useTheme();
  
  return (
    <View style={styles.microRow}>
      {/* Left Value */}
      <View style={styles.microSide}>
        <Text style={[styles.microValue, textStyles.body, { color: color1 }]}>
          {value1}{unit}
        </Text>
      </View>
      
      {/* Center Label with Icon */}
      <View style={styles.microCenter}>
        <Icon name={icon as any} size={18} color={theme.textSecondary} />
        <Text style={[styles.microLabel, textStyles.caption, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      
      {/* Right Value */}
      <View style={styles.microSide}>
        <Text style={[styles.microValue, textStyles.body, { color: color2 }]}>
          {value2}{unit}
        </Text>
      </View>
    </View>
  );
};

const MacroRadarChart: React.FC<MacroRadarChartProps> = ({ food1, food2 }) => {
  const { theme, textStyles } = useTheme();
  
  // Color schemes
  const leftColor = '#3b82f6'; // Blue
  const leftSecondary = '#60a5fa';
  const rightColor = '#ec4899'; // Pink
  const rightSecondary = '#f472b6';

  // Get macros
  const macros1 = getNormalizedMacros(food1);
  const macros2 = getNormalizedMacros(food2);
  
  // Find max values for scaling
  const maxProtein = Math.max(macros1.protein, macros2.protein, 30);
  const maxFat = Math.max(macros1.fat, macros2.fat, 30);
  const maxCarbs = Math.max(macros1.carbs, macros2.carbs, 30);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* VS Header with Food Info */}
      <View style={styles.header}>
        {/* Left Food */}
        <View style={styles.foodHeaderSection}>
          {food1.imageUrl ? (
            <Image
              source={{ uri: food1.imageUrl }}
              style={[styles.foodImage, { borderColor: leftColor }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.foodImagePlaceholder, { backgroundColor: leftColor + '20', borderColor: leftColor }]}>
              <Icon name={food1.iconName as any} size={40} color={leftColor} />
            </View>
          )}
          <Text style={[styles.foodName, textStyles.body, { color: theme.text }]} numberOfLines={2}>
            {food1.title}
          </Text>
          <View style={[styles.caloriesBadge, { backgroundColor: leftColor }]}>
            <Icon name="fire" size={16} color="#FFFFFF" />
            <Text style={[styles.caloriesText, { color: '#FFFFFF' }]}>
              {macros1.calories} kcal
            </Text>
          </View>
        </View>

        {/* VS Badge */}
        <View style={[styles.vsBadge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.vsText, textStyles.heading3, { color: '#FFFFFF' }]}>VS</Text>
        </View>

        {/* Right Food */}
        <View style={styles.foodHeaderSection}>
          {food2.imageUrl ? (
            <Image
              source={{ uri: food2.imageUrl }}
              style={[styles.foodImage, { borderColor: rightColor }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.foodImagePlaceholder, { backgroundColor: rightColor + '20', borderColor: rightColor }]}>
              <Icon name={food2.iconName as any} size={40} color={rightColor} />
            </View>
          )}
          <Text style={[styles.foodName, textStyles.body, { color: theme.text }]} numberOfLines={2}>
            {food2.title}
          </Text>
          <View style={[styles.caloriesBadge, { backgroundColor: rightColor }]}>
            <Icon name="fire" size={16} color="#FFFFFF" />
            <Text style={[styles.caloriesText, { color: '#FFFFFF' }]}>
              {macros2.calories} kcal
            </Text>
          </View>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, textStyles.caption, { color: theme.textSecondary }]}>
        Per 100g serving
      </Text>

      {/* Macronutrients Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, textStyles.heading4, { color: theme.text }]}>
          Macronutrients
        </Text>
        
        <MacroRow
          label="Protein"
          icon="arm-flex"
          value1={macros1.protein}
          value2={macros2.protein}
          maxValue={maxProtein}
          color1={leftColor}
          color1Secondary={leftSecondary}
          color2={rightColor}
          color2Secondary={rightSecondary}
          unit="g"
        />
        
        <MacroRow
          label="Fat"
          icon="peanut"
          value1={macros1.fat}
          value2={macros2.fat}
          maxValue={maxFat}
          color1={leftColor}
          color1Secondary={leftSecondary}
          color2={rightColor}
          color2Secondary={rightSecondary}
          unit="g"
        />
        
        <MacroRow
          label="Carbs"
          icon="barley"
          value1={macros1.carbs}
          value2={macros2.carbs}
          maxValue={maxCarbs}
          color1={leftColor}
          color1Secondary={leftSecondary}
          color2={rightColor}
          color2Secondary={rightSecondary}
          unit="g"
        />
      </View>

      {/* Micronutrients Section */}
      {(macros1.fiber > 0 || macros2.fiber > 0 || macros1.sugar > 0 || macros2.sugar > 0) && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, textStyles.heading4, { color: theme.text }]}>
            🌾 Micronutrients
          </Text>
          
          {(macros1.fiber > 0 || macros2.fiber > 0) && (
            <MicronutrientRow
              label="Fiber"
              icon="grain"
              value1={macros1.fiber}
              value2={macros2.fiber}
              color1={leftColor}
              color2={rightColor}
              unit="g"
            />
          )}
          
          {(macros1.sugar > 0 || macros2.sugar > 0) && (
            <MicronutrientRow
              label="Sugar"
              icon="candy"
              value1={macros1.sugar}
              value2={macros2.sugar}
              color1={leftColor}
              color2={rightColor}
              unit="g"
            />
          )}
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  foodHeaderSection: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
  },
  foodImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  foodName: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    gap: 4,
  },
  caloriesText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  vsBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  vsText: {
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  macroSide: {
    flex: 1,
    alignItems: 'center',
  },
  macroCenterIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  circleBackground: {
    position: 'absolute',
    top: 0,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArc: {
    position: 'absolute',
  },
  circleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: {
    fontWeight: 'bold',
  },
  circleUnit: {
    fontSize: 9,
  },
  circleLabel: {
    position: 'absolute',
    bottom: 0,
    fontWeight: '600',
    fontSize: 10,
  },
  microRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  microSide: {
    flex: 1,
    alignItems: 'center',
  },
  microCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  microValue: {
    fontWeight: 'bold',
  },
  microLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MacroRadarChart;

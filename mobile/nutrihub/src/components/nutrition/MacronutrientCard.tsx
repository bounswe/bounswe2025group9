import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface MacronutrientCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon?: string; // 'P', 'C', 'F' for Protein, Carbs, Fat
  mealBreakdown?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

const MacronutrientCard: React.FC<MacronutrientCardProps> = ({
  name,
  current,
  target,
  unit,
  color,
  icon,
  mealBreakdown
}) => {
  const { theme, textStyles } = useTheme();
  
  // Format numbers to 1 decimal place if needed
  const formatNumber = (num: number): string => {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  const percentage = Math.round((current / target) * 100);
  const isOverTarget = percentage > 100;
  const isNearTarget = percentage >= 90 && percentage <= 100;
  const remaining = Math.max(0, target - current);
  
  // Under-target severity levels
  const isVeryLow = percentage < 50;  // Less than 50% - concerning
  const isLow = percentage >= 50 && percentage < 70;  // 50-70% - needs attention
  const isFair = percentage >= 70 && percentage < 90;  // 70-90% - fair progress
  
  // Over-target severity levels
  const isMinorOver = percentage > 100 && percentage <= 110;  // 0-10% over
  const isModerateOver = percentage > 110 && percentage <= 130;  // 10-30% over
  const isSevereOver = percentage > 130;  // 30%+ over
  
  // Determine status color and icon based on nutrient type and percentage
  const getStatusColor = () => {
    // On target (90-100%)
    if (isNearTarget) return theme.success;
    
    // Under target scenarios
    if (!isOverTarget) {
      if (isVeryLow) return theme.error;  // Red for very low
      if (isLow) return theme.warning;  // Orange for low
      return theme.warning;  // Orange for fair (70-90%)
    }
    
    // Over target scenarios
    // For Calories, being over is generally not good
    if (name === 'Calories') {
      if (isMinorOver) return theme.warning;
      if (isModerateOver) return theme.error;
      return '#dc2626'; // Dark red for severe
    }
    
    // For Protein, slight over is often acceptable
    if (name === 'Protein') {
      if (isMinorOver) return theme.success; // Still good
      if (isModerateOver) return theme.warning;
      return theme.error;
    }
    
    // For Carbs and Fat
    if (isMinorOver) return theme.warning;
    if (isModerateOver) return theme.error;
    return '#dc2626'; // Dark red for severe
  };
  
  const statusColor = getStatusColor();
  
  const getStatusIcon = () => {
    // Only show checkmark when actually at 100% or met
    if (percentage >= 100 && percentage <= 100) return 'check-circle';
    if (name === 'Protein' && isMinorOver) return 'check-circle'; // Protein met in acceptable range
    
    // 90-99% - close to target but not met
    if (isNearTarget) return 'chart-line'; // Progress indicator instead of checkmark
    
    // Under target icons
    if (!isOverTarget) {
      if (isVeryLow) return 'alert-circle';  // Alert for very low
      if (isLow) return 'alert-outline';  // Outline alert for low
      return 'trending-up';  // Trending for fair
    }
    
    // Over target icons (warnings only)
    if (isMinorOver || isModerateOver) return 'alert-circle';
    return 'close-circle'; // X for severe over
  };
  
  const getStatusMessage = () => {
    if (!isOverTarget) {
      const remainingFormatted = formatNumber(remaining);
      if (isVeryLow) return `Only ${percentage}% of target - ${remainingFormatted}${unit} remaining`;
      return `${remainingFormatted}${unit} remaining to reach goal`;
    }
    
    const overAmount = formatNumber(current - target);
    if (name === 'Protein' && isMinorOver) {
      return `${overAmount}${unit} over target (acceptable range)`;
    }
    if (isMinorOver) return `${overAmount}${unit} slightly over target`;
    if (isModerateOver) return `${overAmount}${unit} moderately over target`;
    return `${overAmount}${unit} significantly over target`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon && (
            <View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: `${color}15`,
                  borderColor: color,
                  borderWidth: 2
                }
              ]}
            >
              <Text style={[styles.iconText, { color }]}>{icon}</Text>
            </View>
          )}
          <View>
            <Text style={[textStyles.heading4, { color: theme.text }]}>{name}</Text>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
              Daily Target: {formatNumber(target)}{unit}
            </Text>
          </View>
        </View>
        
        {/* Status Icon */}
        <Icon 
          name={getStatusIcon()} 
          size={28} 
          color={isOverTarget || isNearTarget ? statusColor : theme.textSecondary} 
          style={!isOverTarget && !isNearTarget ? { opacity: 0.4 } : undefined}
        />
      </View>

      {/* Progress Info */}
      <View style={styles.progressInfo}>
        <Text style={[styles.currentValue, { color: isOverTarget && !isMinorOver ? statusColor : theme.primary }]}>
          {formatNumber(current)}{unit}
        </Text>
        <View style={styles.percentageContainer}>
          <Text 
            style={[
              styles.percentage, 
              { color: statusColor }
            ]}
          >
            {percentage}%
          </Text>
          {(isSevereOver || isVeryLow) && (
            <Icon name="alert" size={16} color={statusColor} style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
          {/* Single progress bar - simple and clear */}
          <View 
            style={[
              styles.progressBar,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverTarget ? statusColor : (isNearTarget ? theme.success : color)
              }
            ]}
          />
        </View>
        
        {/* Visual indicator when over 100% - only for warnings, not acceptable protein */}
        {isOverTarget && !(name === 'Protein' && isMinorOver) && (
          <>
            {/* Small overflow extension beyond the bar */}
            <View 
              style={[
                styles.overflowExtension, 
                { 
                  backgroundColor: statusColor,
                  width: Math.min((percentage - 100) * 0.5, 30) // Max 30px extension
                }
              ]} 
            />
            {/* Clear label showing how much over */}
            <View style={[styles.overflowBadge, { backgroundColor: statusColor }]}>
              <Icon name="arrow-up" size={10} color="#fff" />
              <Text style={[textStyles.small, { color: '#fff', fontWeight: '700', marginLeft: 2 }]}>
                +{percentage - 100}%
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Status Message */}
      <View style={styles.statusMessage}>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.body, { color: theme.textSecondary }]}>
            <Text style={{ color: isOverTarget ? statusColor : theme.text, fontWeight: '600' }}>
              {getStatusMessage()}
            </Text>
          </Text>
          {isSevereOver && (
            <Text style={[textStyles.caption, { color: statusColor, marginTop: 4, fontWeight: '600' }]}>
              ⚠️ Consider reducing intake
            </Text>
          )}
        </View>
        
        {/* Show badge based on status */}
        {percentage === 100 && (
          <View style={[styles.badge, { backgroundColor: theme.success }]}>
            <Text style={[textStyles.small, { color: '#fff' }]}>Met</Text>
          </View>
        )}
        {isNearTarget && percentage < 100 && (
          <View style={[styles.badge, { backgroundColor: theme.success, opacity: 0.8 }]}>
            <Text style={[textStyles.small, { color: '#fff' }]}>Almost</Text>
          </View>
        )}
        {(name === 'Protein' && isMinorOver) && (
          <View style={[styles.badge, { backgroundColor: theme.success }]}>
            <Text style={[textStyles.small, { color: '#fff' }]}>Met</Text>
          </View>
        )}
      </View>

      {/* Meal Breakdown for Calories */}
      {name === 'Calories' && mealBreakdown && (
        <View style={[styles.mealBreakdown, { borderTopColor: theme.border }]}>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Breakfast</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {formatNumber(mealBreakdown.breakfast)} kcal
            </Text>
          </View>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Lunch</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {formatNumber(mealBreakdown.lunch)} kcal
            </Text>
          </View>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Dinner</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {formatNumber(mealBreakdown.dinner)} kcal
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'relative',
    flex: 1,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  overflowExtension: {
    height: 16,
    borderTopRightRadius: BORDER_RADIUS.full,
    borderBottomRightRadius: BORDER_RADIUS.full,
    marginLeft: -1, // Connects to main bar
    opacity: 0.8,
  },
  overflowBadge: {
    position: 'absolute',
    right: -4,
    top: -8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
  },
  mealBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  mealItem: {
    alignItems: 'center',
  },
});

export default MacronutrientCard;



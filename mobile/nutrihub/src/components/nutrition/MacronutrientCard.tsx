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
  
  const percentage = Math.round((current / target) * 100);
  const isOverTarget = percentage > 100;
  const isNearTarget = percentage >= 90 && percentage <= 100;
  const remaining = Math.max(0, target - current);

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
              Daily Target: {target}{unit}
            </Text>
          </View>
        </View>
        
        {/* Status Icon */}
        {isNearTarget ? (
          <Icon name="check-circle" size={28} color={theme.success} />
        ) : isOverTarget ? (
          <Icon name="alert-circle" size={28} color={theme.warning} />
        ) : (
          <Icon name="trending-up" size={28} color={theme.textSecondary} style={{ opacity: 0.4 }} />
        )}
      </View>

      {/* Progress Info */}
      <View style={styles.progressInfo}>
        <Text style={[styles.currentValue, { color: theme.primary }]}>
          {current}{unit}
        </Text>
        <Text 
          style={[
            styles.percentage, 
            { 
              color: isOverTarget ? theme.error : isNearTarget ? theme.success : theme.warning 
            }
          ]}
        >
          {percentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <View 
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color
            }
          ]}
        />
        {/* Overflow indicator */}
        {isOverTarget && (
          <View 
            style={[
              styles.overflowBar,
              {
                width: `${Math.min((percentage - 100) / 2, 50)}%`,
                backgroundColor: theme.error,
              }
            ]}
          />
        )}
      </View>

      {/* Status Message */}
      <View style={styles.statusMessage}>
        {isOverTarget ? (
          <Text style={[textStyles.body, { color: theme.textSecondary }]}>
            <Text style={{ color: theme.error, fontWeight: '600' }}>
              {Math.round(current - target)}{unit} over target
            </Text>
          </Text>
        ) : (
          <Text style={[textStyles.body, { color: theme.textSecondary }]}>
            <Text style={{ fontWeight: '600' }}>{remaining}{unit} remaining</Text> to reach goal
          </Text>
        )}
        
        {isNearTarget && (
          <View style={[styles.badge, { backgroundColor: theme.success }]}>
            <Text style={[textStyles.small, { color: '#fff' }]}>On Track</Text>
          </View>
        )}
      </View>

      {/* Meal Breakdown for Calories */}
      {name === 'Calories' && mealBreakdown && (
        <View style={[styles.mealBreakdown, { borderTopColor: theme.border }]}>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Breakfast</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {mealBreakdown.breakfast} kcal
            </Text>
          </View>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Lunch</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {mealBreakdown.lunch} kcal
            </Text>
          </View>
          <View style={styles.mealItem}>
            <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Dinner</Text>
            <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
              {mealBreakdown.dinner} kcal
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
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  overflowBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    borderTopRightRadius: BORDER_RADIUS.full,
    borderBottomRightRadius: BORDER_RADIUS.full,
    opacity: 0.7,
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


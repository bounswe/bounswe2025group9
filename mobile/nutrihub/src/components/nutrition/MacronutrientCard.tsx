import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  
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

  const renderStatusBadge = (
    label: string,
    color: string,
    iconName?: React.ComponentProps<typeof Icon>['name']
  ) => (
    <View style={styles.badgeRow}>
      {iconName && <Icon name={iconName} size={16} color={color} style={{ marginRight: 4 }} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
  
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

  const getDetailedInfo = () => {
    if (!isOverTarget) {
      if (isVeryLow) {
        return {
          title: `${name} - Very Low (${percentage}%)`,
          message: `You've consumed only ${formatNumber(current)}${unit} out of ${formatNumber(target)}${unit} target. This is significantly below your daily goal. Consider adding ${name.toLowerCase()}-rich foods to your remaining meals today.`
        };
      }
      if (isLow) {
        return {
          title: `${name} - Low (${percentage}%)`,
          message: `You've reached ${formatNumber(current)}${unit} of your ${formatNumber(target)}${unit} target. You still need ${formatNumber(remaining)}${unit} to meet your daily goal. Try to include more ${name.toLowerCase()}-rich foods.`
        };
      }
      if (isFair) {
        return {
          title: `${name} - Fair Progress (${percentage}%)`,
          message: `You're making good progress with ${formatNumber(current)}${unit} consumed. You need ${formatNumber(remaining)}${unit} more to reach your ${formatNumber(target)}${unit} target. You're on the right track!`
        };
      }
      return {
        title: `${name} - Almost There (${percentage}%)`,
        message: `Great job! You've consumed ${formatNumber(current)}${unit}. Just ${formatNumber(remaining)}${unit} more to reach your ${formatNumber(target)}${unit} target.`
      };
    }
    
    const overAmount = formatNumber(current - target);
    if (name === 'Protein' && isMinorOver) {
      return {
        title: `${name} - Target Met (${percentage}%)`,
        message: `You've consumed ${formatNumber(current)}${unit}, which is ${overAmount}${unit} over your ${formatNumber(target)}${unit} target. This is perfectly acceptable for protein as it supports muscle recovery and satiety.`
      };
    }
    if (isMinorOver) {
      return {
        title: `${name} - Slightly Over (${percentage}%)`,
        message: `You've consumed ${formatNumber(current)}${unit}, exceeding your ${formatNumber(target)}${unit} target by ${overAmount}${unit}. This is a minor excess. Consider lighter options for remaining meals.`
      };
    }
    if (isModerateOver) {
      return {
        title: `${name} - Moderately Over (${percentage}%)`,
        message: `You've consumed ${formatNumber(current)}${unit}, which is ${overAmount}${unit} above your ${formatNumber(target)}${unit} target. This is a moderate excess. Try to balance this tomorrow and consider portion control.`
      };
    }
    return {
      title: `${name} - Significantly Over (${percentage}%)`,
      message: `You've consumed ${formatNumber(current)}${unit}, significantly exceeding your ${formatNumber(target)}${unit} target by ${overAmount}${unit}. This is a substantial excess. Focus on lighter meals going forward and increase physical activity if possible.`
    };
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
                  backgroundColor: theme.surface,
                  borderColor: `${color}50`,
                  borderWidth: 1,
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
        
        {/* Status Icon - Clickable for detailed info */}
        <TouchableOpacity 
          onPress={() => setShowInfoModal(true)}
          activeOpacity={0.7}
          style={{ position: 'relative' }}
        >
          <Icon 
            name={getStatusIcon()} 
            size={28} 
            color={isOverTarget || isNearTarget ? statusColor : theme.textSecondary} 
            style={!isOverTarget && !isNearTarget ? { opacity: 0.4 } : undefined}
          />
          <View style={{ 
            position: 'absolute', 
            bottom: -2, 
            right: -2, 
            backgroundColor: theme.surface,
            borderRadius: 8,
            padding: 1
          }}>
            <Icon name="information" size={12} color={theme.primary} style={{ opacity: 0.7 }} />
          </View>
        </TouchableOpacity>
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
        <View style={[styles.progressBarContainer, { backgroundColor: `${color}15` }]}>
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
        {percentage === 100 && renderStatusBadge('Met', theme.success, 'check-circle')}
        {isNearTarget && percentage < 100 && renderStatusBadge('Almost', theme.success, 'chart-line')}
        {(name === 'Protein' && isMinorOver) && renderStatusBadge('Met', theme.success, 'check-circle')}
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

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Icon name={getStatusIcon()} size={32} color={statusColor} />
              <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.md, flex: 1 }]}>
                {getDetailedInfo().title}
              </Text>
            </View>
            
            <Text style={[textStyles.body, { color: theme.textSecondary, lineHeight: 22, marginTop: SPACING.md }]}>
              {getDetailedInfo().message}
            </Text>
            
            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Current</Text>
                <Text style={[textStyles.heading4, { color: theme.primary }]}>
                  {formatNumber(current)}{unit}
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Target</Text>
                <Text style={[textStyles.heading4, { color: theme.text }]}>
                  {formatNumber(target)}{unit}
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                  {isOverTarget ? 'Over' : 'Remaining'}
                </Text>
                <Text style={[textStyles.heading4, { color: statusColor }]}>
                  {isOverTarget ? formatNumber(current - target) : formatNumber(remaining)}{unit}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.8}
            >
              <Text style={[textStyles.body, { color: '#fff', fontWeight: '700' }]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  currentValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  progressBarContainer: {
    position: 'relative',
    flex: 1,
    height: 20,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    // Add subtle inner shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    // Add subtle glow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  overflowExtension: {
    height: 20,
    borderTopRightRadius: BORDER_RADIUS.round,
    borderBottomRightRadius: BORDER_RADIUS.round,
    marginLeft: -1, // Connects to main bar
    opacity: 0.75,
  },
  overflowBadge: {
    position: 'absolute',
    right: -6,
    top: -10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mealBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    borderTopWidth: 1,
  },
  mealItem: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
});

export default MacronutrientCard;



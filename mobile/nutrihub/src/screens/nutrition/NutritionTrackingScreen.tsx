import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import MacronutrientCard from '../../components/nutrition/MacronutrientCard';
import MicronutrientPanel from '../../components/nutrition/MicronutrientPanel';
import { FoodLogEntry, MealTotals, DailyNutritionLog } from '../../types/nutrition';
import { mockTodayLog, mockNutritionTargets, mockHistoricalLogs } from '../../data/mockNutritionData';

const NutritionTrackingScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<{ log: DailyNutritionLog; percentage: number } | null>(null);

  // Format numbers to 1 decimal place
  const formatNumber = (num: number): string => {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1);
  };

  // Mock data - in production, this would come from API
  const todayLog = mockTodayLog;
  const targets = mockNutritionTargets;

  // Group entries by meal type
  const breakfastEntries = todayLog.entries.filter(e => e.meal_type === 'breakfast');
  const lunchEntries = todayLog.entries.filter(e => e.meal_type === 'lunch');
  const dinnerEntries = todayLog.entries.filter(e => e.meal_type === 'dinner');
  const snackEntries = todayLog.entries.filter(e => e.meal_type === 'snack');

  const getMealIcon = (mealType: string): React.ComponentProps<typeof Icon>['name'] => {
    switch (mealType) {
      case 'breakfast': return 'coffee';
      case 'lunch': return 'silverware-fork-knife';
      case 'dinner': return 'weather-night';
      case 'snack': return 'cookie';
      default: return 'food';
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '#f59e0b';
      case 'lunch': return '#10b981';
      case 'dinner': return '#6366f1';
      case 'snack': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const calculateMealTotals = (entries: FoodLogEntry[]): MealTotals => {
    return {
      calories: entries.reduce((sum, e) => sum + e.calories, 0),
      protein: entries.reduce((sum, e) => sum + e.protein, 0),
      carbs: entries.reduce((sum, e) => sum + e.carbohydrates, 0),
      fat: entries.reduce((sum, e) => sum + e.fat, 0)
    };
  };

  const formatDate = (date: Date) => {
    // Format without year to prevent overflow, add year only if not current year
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    
    if (currentYear === dateYear) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const currentYear = new Date().getFullYear();
    
    const startStr = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    // Only add year if not current year
    const yearStr = startDate.getFullYear() !== currentYear ? `, ${startDate.getFullYear()}` : '';
    
    return `${startStr} - ${endStr}${yearStr}`;
  };

  // Get Monday of the current week
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const changeDate = (increment: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'weekly') {
      // Move by 7 days (1 week) when in weekly mode
      newDate.setDate(newDate.getDate() + (increment * 7));
    } else {
      // Move by 1 day when in daily mode
      newDate.setDate(newDate.getDate() + increment);
    }
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isCurrentWeek = viewMode === 'weekly' && 
    getWeekStart(selectedDate).toDateString() === getWeekStart(new Date()).toDateString();

  // Calculate meal breakdown for calories
  const mealBreakdown = {
    breakfast: calculateMealTotals(breakfastEntries).calories,
    lunch: calculateMealTotals(lunchEntries).calories,
    dinner: calculateMealTotals(dinnerEntries).calories,
  };

  const getWeeklyDayDetailedInfo = (log: DailyNutritionLog, percentage: number) => {
    const date = new Date(log.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const isLogToday = date.toDateString() === new Date().toDateString();
    
    const isVeryLow = percentage < 50;
    const isLow = percentage >= 50 && percentage < 70;
    const isFair = percentage >= 70 && percentage < 90;
    const isOnTrack = percentage >= 90 && percentage <= 100;
    const isMinorOver = percentage > 100 && percentage <= 110;
    const isModerateOver = percentage > 110 && percentage <= 130;
    const isSevereOver = percentage > 130;
    
    const remaining = targets.calories - log.total_calories;
    const over = log.total_calories - targets.calories;
    
    if (percentage === 100) {
      return {
        title: `${dayName} - Perfect! 🎉`,
        message: `You hit exactly ${formatNumber(log.total_calories)} calories, meeting your daily target perfectly! This is optimal for maintaining your health goals.${isLogToday ? '\n\nKeep up this excellent balance for the rest of today!' : ''}`,
        icon: 'check-circle',
        color: theme.success,
      };
    }
    
    if (isOnTrack) {
      return {
        title: `${dayName} - Almost There (${percentage}%)`,
        message: `You consumed ${formatNumber(log.total_calories)} calories, which is ${formatNumber(remaining)} calories short of your ${formatNumber(targets.calories)} target. This is still within a healthy range.${isLogToday ? '\n\nJust a bit more to reach your goal!' : ''}`,
        icon: 'chart-line',
        color: theme.success,
      };
    }
    
    if (isFair) {
      return {
        title: `${dayName} - Fair Progress (${percentage}%)`,
        message: `You've consumed ${formatNumber(log.total_calories)} of your ${formatNumber(targets.calories)} calorie target. You need ${formatNumber(remaining)} more calories.${isLogToday ? '\n\nTry to add more nutritious foods to your remaining meals today.' : '\n\nConsider adding more calorie-dense, healthy foods to meet your targets.'}`,
        icon: 'alert',
        color: theme.warning,
      };
    }
    
    if (isLow) {
      return {
        title: `${dayName} - Low (${percentage}%)`,
        message: `You consumed only ${formatNumber(log.total_calories)} of your ${formatNumber(targets.calories)} calorie target. This is significantly low and may affect your energy levels and metabolism.${isLogToday ? '\n\nMake sure to eat substantial meals for the rest of the day.' : '\n\nConsistently low intake can impact your health negatively.'}`,
        icon: 'alert-circle',
        color: theme.error,
      };
    }
    
    if (isVeryLow) {
      return {
        title: `${dayName} - Very Low! (${percentage}%)`,
        message: `You consumed only ${formatNumber(log.total_calories)} calories, which is critically below your ${formatNumber(targets.calories)} target. This level of intake is concerning and can harm your metabolism, energy levels, and overall health.${isLogToday ? '\n\nPlease ensure you eat adequate meals for the rest of today.' : '\n\nConsult a healthcare professional if this pattern continues.'}`,
        icon: 'close-circle',
        color: theme.error,
      };
    }
    
    if (isMinorOver) {
      return {
        title: `${dayName} - Slightly Over (${percentage}%)`,
        message: `You consumed ${formatNumber(log.total_calories)} calories, which is ${formatNumber(over)} over your ${formatNumber(targets.calories)} target. This is a minor excess and shouldn't be a major concern.${isLogToday ? '\n\nConsider lighter options for the rest of the day.' : '\n\nTry to balance this tomorrow with slightly reduced portions.'}`,
        icon: 'alert',
        color: theme.warning,
      };
    }
    
    if (isModerateOver) {
      return {
        title: `${dayName} - Moderately Over (${percentage}%)`,
        message: `You consumed ${formatNumber(log.total_calories)} calories, exceeding your ${formatNumber(targets.calories)} target by ${formatNumber(over)} calories. This is a moderate excess that can impact your health goals.${isLogToday ? '\n\nConsider skipping snacks and choosing lighter options.' : '\n\nBalance this by reducing intake tomorrow and increasing physical activity.'}`,
        icon: 'alert-circle',
        color: theme.error,
      };
    }
    
    // Severe over
    return {
      title: `${dayName} - Significantly Over! (${percentage}%)`,
      message: `You consumed ${formatNumber(log.total_calories)} calories, which is ${formatNumber(over)} over your ${formatNumber(targets.calories)} target. This is a substantial excess that can significantly impact your health goals.${isLogToday ? '\n\nPlease avoid additional meals and snacks for the rest of today.' : '\n\nFocus on portion control, increase physical activity, and aim to balance this over the next few days.'}`,
      icon: 'alert',
      color: '#dc2626',
    };
  };

  const renderWeeklySummary = () => {
    const weekStart = getWeekStart(selectedDate);
    const weekLogs = [...mockHistoricalLogs, todayLog].filter(log => {
      const logDate = new Date(log.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return logDate >= weekStart && logDate <= weekEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <View style={[styles.weeklyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Icon name="chart-line" size={28} color={theme.primary} />
          <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm }]}>
            Weekly Summary
          </Text>
        </View>
        
        {weekLogs.map((log: DailyNutritionLog) => {
          const date = new Date(log.date);
          const caloriePercent = Math.round((log.total_calories / targets.calories) * 100);
          const isLogToday = date.toDateString() === new Date().toDateString();
          
          // Under-target severity levels
          const isVeryLow = caloriePercent < 50;
          const isLow = caloriePercent >= 50 && caloriePercent < 70;
          const isFair = caloriePercent >= 70 && caloriePercent < 90;
          const isOnTrack = caloriePercent >= 90 && caloriePercent <= 100;
          
          // Over-target severity levels
          const isMinorOver = caloriePercent > 100 && caloriePercent <= 110;
          const isModerateOver = caloriePercent > 110 && caloriePercent <= 130;
          const isSevereOver = caloriePercent > 130;
          
          const getDayStatusColor = () => {
            if (isOnTrack) return theme.success;
            
            // Under target
            if (caloriePercent < 100) {
              if (isVeryLow) return theme.error;
              if (isLow) return theme.warning;
              return theme.warning; // Fair
            }
            
            // Over target
            if (isMinorOver) return theme.warning;
            if (isModerateOver) return theme.error;
            return '#dc2626'; // Dark red for severe
          };
          
          const statusColor = getDayStatusColor();
          
          return (
            <View 
              key={log.id} 
              style={[styles.weeklyDayItem, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
            >
              <View style={styles.weeklyDayHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Text style={[textStyles.body, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>
                      {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  {isLogToday && (
                    <View style={[styles.todayBadge, { backgroundColor: theme.success, marginTop: SPACING.sm }]}>
                      <Text style={[textStyles.small, { color: '#fff', fontWeight: '600' }]}>Today</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={{ alignItems: 'flex-end' }}
                  onPress={() => setSelectedWeeklyDay({ log, percentage: caloriePercent })}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text 
                      style={[
                        textStyles.body,
                        { 
                          color: statusColor,
                          fontWeight: '700',
                          fontSize: 16
                        }
                      ]}
                    >
                      {caloriePercent}%
                    </Text>
                    {/* Show warning icon for severe over, otherwise info icon */}
                    {(isSevereOver || isModerateOver) ? (
                      <Icon name="alert-circle" size={16} color={statusColor} style={{ opacity: 0.8 }} />
                    ) : (
                      <Icon name="information-outline" size={16} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                    )}
                  </View>
                  {/* Only show checkmark when actually met (100%) */}
                  {caloriePercent === 100 && (
                    <Icon name="check-circle" size={14} color={theme.success} style={{ marginTop: 2 }} />
                  )}
                  {/* Show progress icon for 90-99% */}
                  {isOnTrack && caloriePercent < 100 && (
                    <Icon name="chart-line" size={14} color={theme.success} style={{ marginTop: 2 }} />
                  )}
                  {/* Show alert for very low */}
                  {isVeryLow && (
                    <Icon name="alert-circle" size={14} color={theme.error} style={{ marginTop: 2 }} />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md, fontWeight: '500' }]}>
                {log.total_calories.toFixed(0)} / {targets.calories.toFixed(0)} kcal
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.progressBarContainer, { backgroundColor: `${theme.primary}10`, height: 10, flex: 1 }]}>
                  <View 
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(caloriePercent, 100)}%`,
                        backgroundColor: caloriePercent > 100 ? statusColor : (isOnTrack ? theme.success : statusColor)
                      }
                    ]}
                  />
                </View>
                {/* Overflow indicator - only for actual warnings (not minor acceptable over) */}
                {caloriePercent > 110 && (
                  <View 
                    style={[
                      styles.weeklyOverflowBadge,
                      { backgroundColor: statusColor }
                    ]}
                  >
                    <Text style={[textStyles.small, { color: '#fff', fontSize: 9, fontWeight: '700' }]}>
                      +{caloriePercent - 100}%
                    </Text>
                  </View>
                )}
                {/* "Met" badge for exactly 100% or minor over (100-110%) */}
                {caloriePercent === 100 && (
                  <View 
                    style={[
                      styles.weeklyOverflowBadge,
                      { backgroundColor: theme.success }
                    ]}
                  >
                    <Text style={[textStyles.small, { color: '#fff', fontSize: 9, fontWeight: '700' }]}>
                      Met
                    </Text>
                  </View>
                )}
                {caloriePercent > 100 && caloriePercent <= 110 && (
                  <View 
                    style={[
                      styles.weeklyOverflowBadge,
                      { backgroundColor: theme.warning }
                    ]}
                  >
                    <Text style={[textStyles.small, { color: '#fff', fontSize: 9, fontWeight: '700' }]}>
                      +{caloriePercent - 100}%
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.weeklyDayMacros}>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Protein</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>
                    {formatNumber(log.total_protein)}g
                  </Text>
                </View>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Carbs</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>
                    {formatNumber(log.total_carbohydrates)}g
                  </Text>
                </View>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Fat</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>
                    {formatNumber(log.total_fat)}g
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMealSection = (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    entries: FoodLogEntry[]
  ) => {
    const totals = calculateMealTotals(entries);
    const mealColor = getMealColor(mealType);

    return (
      <View 
        key={mealType} 
        style={[styles.mealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {/* Meal Header */}
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderLeft}>
            <View 
              style={[
                styles.mealIconContainer,
                { 
                  backgroundColor: theme.surface,
                  borderColor: `${mealColor}50`,
                  borderWidth: 1
                }
              ]}
            >
              <Icon name={getMealIcon(mealType)} size={24} color={mealColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.heading4, { color: theme.text, textTransform: 'capitalize', fontWeight: '700' }]}>
                {mealType}
              </Text>
              <Text style={[textStyles.caption, { color: theme.textSecondary, marginTop: SPACING.xs / 2 }]}>
                {totals.calories.toFixed(0)} kcal • {entries.length} {entries.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setSelectedMeal(mealType);
              setShowAddFood(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={16} color="#fff" />
            <Text style={[textStyles.small, { color: '#fff', marginLeft: 4, fontWeight: '700' }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Food Entries */}
        {entries.length > 0 ? (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <View
                key={entry.id}
                style={[styles.entryItem, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
              >
                {/* Food Image Placeholder */}
                <View style={[styles.foodImagePlaceholder, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }]}>
                  <Icon name="food" size={24} color={theme.textSecondary} />
                </View>

                {/* Food Details Container */}
                <View style={styles.foodDetailsContainer}>
                  {/* Food Info */}
                  <View style={styles.foodInfo}>
                    <Text style={[textStyles.body, { color: theme.text, fontWeight: '500' }]} numberOfLines={1}>
                      {entry.food_name}
                    </Text>
                <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                  {formatNumber(entry.serving_size)} {entry.serving_unit}
                </Text>
                  </View>

                  {/* Nutrition Info */}
                  <View style={styles.nutritionInfo}>
                  <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                    {formatNumber(entry.calories)} kcal
                  </Text>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                    P: {formatNumber(entry.protein)}g • C: {formatNumber(entry.carbohydrates)}g • F: {formatNumber(entry.fat)}g
                  </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.entryActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Icon name="pencil" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Icon name="delete" size={18} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMeal}>
            <Icon name="food" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: SPACING.sm }]}>
              No foods logged for {mealType}
            </Text>
          </View>
        )}

        {/* Meal Totals */}
        {entries.length > 0 && (
          <View style={[styles.mealTotals, { borderTopColor: theme.border }]}>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Calories</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                {formatNumber(totals.calories)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Protein</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '700', fontSize: 15 }]}>
                {formatNumber(totals.protein)}g
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Carbs</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '700', fontSize: 15 }]}>
                {formatNumber(totals.carbs)}g
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary, fontWeight: '500' }]}>Fat</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '700', fontSize: 15 }]}>
                {formatNumber(totals.fat)}g
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[textStyles.heading3, { color: theme.text, fontWeight: '700' }]}>Nutrition Tracking</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Icon name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Navigation Card */}
        <View style={[styles.dateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* View Mode Toggle */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'daily' && { 
                  backgroundColor: theme.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }
              ]}
              onPress={() => setViewMode('daily')}
              activeOpacity={0.8}
            >
              <Text style={[
                textStyles.body,
                { 
                  color: viewMode === 'daily' ? theme.primary : theme.textSecondary,
                  fontWeight: viewMode === 'daily' ? '700' : '500'
                }
              ]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'weekly' && { 
                  backgroundColor: theme.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }
              ]}
              onPress={() => setViewMode('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[
                textStyles.body,
                { 
                  color: viewMode === 'weekly' ? theme.primary : theme.textSecondary,
                  fontWeight: viewMode === 'weekly' ? '700' : '500'
                }
              ]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <View style={[styles.dateSelector]}>
            <TouchableOpacity
              style={[styles.dateArrow]}
              onPress={() => changeDate(-1)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <View style={styles.dateInfo}>
              <Text 
                style={[textStyles.heading4, { color: theme.primary, fontWeight: '700' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {viewMode === 'weekly' ? formatWeekRange(getWeekStart(selectedDate)) : formatDate(selectedDate)}
              </Text>
              {viewMode === 'daily' && isToday && (
                <View style={[styles.todayBadge, { backgroundColor: theme.success }]}>
                  <Text style={[textStyles.small, { color: '#fff', fontWeight: '600' }]}>Today</Text>
                </View>
              )}
              {viewMode === 'weekly' && isCurrentWeek && (
                <View style={[styles.todayBadge, { backgroundColor: theme.success }]}>
                  <Text style={[textStyles.small, { color: '#fff', fontWeight: '600' }]}>This Week</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.dateArrow,
                ((viewMode === 'daily' && isToday) || (viewMode === 'weekly' && isCurrentWeek)) && { opacity: 0.3 }
              ]}
              onPress={() => changeDate(1)}
              disabled={(viewMode === 'daily' && isToday) || (viewMode === 'weekly' && isCurrentWeek)}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'daily' ? (
          <>
            {/* Macronutrients Overview */}
            <View style={styles.macroSection}>
              <MacronutrientCard
                name="Calories"
                current={todayLog.total_calories}
                target={targets.calories}
                unit=""
                color="#f97316"
                mealBreakdown={mealBreakdown}
              />
              <MacronutrientCard
                name="Protein"
                current={todayLog.total_protein}
                target={targets.protein}
                unit="g"
                color="#3b82f6"
                icon="P"
              />
              <MacronutrientCard
                name="Carbohydrates"
                current={todayLog.total_carbohydrates}
                target={targets.carbohydrates}
                unit="g"
                color="#10b981"
                icon="C"
              />
              <MacronutrientCard
                name="Fat"
                current={todayLog.total_fat}
                target={targets.fat}
                unit="g"
                color="#f59e0b"
                icon="F"
              />
            </View>

            {/* Meals Section */}
            <View style={styles.mealsSection}>
              <View style={styles.sectionHeader}>
                <Icon name="silverware-fork-knife" size={28} color={theme.primary} />
                <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm }]}>
                  Today's Meals
                </Text>
              </View>
              
              {renderMealSection('breakfast', breakfastEntries)}
              {renderMealSection('lunch', lunchEntries)}
              {renderMealSection('dinner', dinnerEntries)}
              {renderMealSection('snack', snackEntries)}
            </View>

            {/* Micronutrients Section */}
            <MicronutrientPanel micronutrients={todayLog.micronutrients} />
          </>
        ) : (
          <>
            {/* Weekly Summary View */}
            {renderWeeklySummary()}
          </>
        )}
      </ScrollView>

      {/* Add Food Modal */}
      <Modal
        visible={showAddFood}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFood(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[textStyles.heading3, { color: theme.text, marginBottom: SPACING.md }]}>
              Add Food to {selectedMeal}
            </Text>
            <Text style={[textStyles.body, { color: theme.text, marginBottom: SPACING.lg }]}>
              This would open a food search/selector interface.
              Integration with backend food database needed.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowAddFood(false)}
            >
              <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weekly Day Info Modal */}
      {selectedWeeklyDay && (
        <Modal
          visible={selectedWeeklyDay !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedWeeklyDay(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.weeklyInfoModalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <View style={[
                  styles.modalIconContainer, 
                  { 
                    backgroundColor: theme.surface,
                    borderColor: `${getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).color}50`,
                    borderWidth: 1,
                  }
                ]}>
                  <Icon 
                    name={getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).icon as React.ComponentProps<typeof Icon>['name']} 
                    size={24} 
                    color={getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).color} 
                  />
                </View>
                <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.md, flex: 1 }]}>
                  {getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).title}
                </Text>
              </View>
              
              <Text style={[textStyles.body, { color: theme.textSecondary, lineHeight: 22, marginTop: SPACING.md }]}>
                {getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).message}
              </Text>
              
              <View style={styles.weeklyModalStats}>
                <View style={styles.weeklyModalStatItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Consumed</Text>
                  <Text style={[textStyles.heading4, { color: theme.primary }]}>
                    {formatNumber(selectedWeeklyDay.log.total_calories)} kcal
                  </Text>
                </View>
                <View style={styles.weeklyModalStatItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Target</Text>
                  <Text style={[textStyles.heading4, { color: theme.text }]}>
                    {formatNumber(targets.calories)} kcal
                  </Text>
                </View>
                <View style={styles.weeklyModalStatItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                    {selectedWeeklyDay.percentage > 100 ? 'Over' : 'Remaining'}
                  </Text>
                  <Text style={[textStyles.heading4, { color: getWeeklyDayDetailedInfo(selectedWeeklyDay.log, selectedWeeklyDay.percentage).color }]}>
                    {selectedWeeklyDay.percentage > 100 
                      ? formatNumber(selectedWeeklyDay.log.total_calories - targets.calories)
                      : formatNumber(targets.calories - selectedWeeklyDay.log.total_calories)
                    } kcal
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setSelectedWeeklyDay(null)}
                activeOpacity={0.8}
              >
                <Text style={[textStyles.body, { color: '#fff', fontWeight: '700' }]}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: 0,
    minHeight: 48,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  dateCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    padding: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(128, 128, 128, 0.1)', // Subtle gray background for the toggle track
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    // Default transparent
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(128, 128, 128, 0.05)', // Very subtle background
  },
  dateArrow: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(128, 128, 128, 0.1)', // Restore background with better styling
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  todayBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  macroSection: {
    marginBottom: SPACING.xl,
  },
  mealsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  mealCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  mealIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999, // Ensure fully rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entriesList: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  foodImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  foodDetailsContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  foodInfo: {
    marginBottom: SPACING.xs,
  },
  nutritionInfo: {
    alignItems: 'flex-start',
  },
  entryActions: {
    flexDirection: 'column',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  emptyMeal: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  mealTotals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 0,
    borderRadius: BORDER_RADIUS.md,
  },
  totalItem: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  modalButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  weeklyInfoModalContent: {
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
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyModalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  weeklyModalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  weeklyDayItem: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  weeklyDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  weeklyDayMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 0,
    borderRadius: BORDER_RADIUS.md,
  },
  weeklyMacroItem: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 10,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  weeklyOverflowBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
});

export default NutritionTrackingScreen;


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
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startStr = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${startStr} - ${endStr}`;
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
          
          return (
            <View 
              key={log.id} 
              style={[styles.weeklyDayItem, { backgroundColor: `${theme.surface}99` }]}
            >
              <View style={styles.weeklyDayHeader}>
                <View>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                  {isLogToday && (
                    <View style={[styles.todayBadge, { backgroundColor: theme.success, marginTop: SPACING.xs }]}>
                      <Text style={[textStyles.small, { color: '#fff' }]}>Today</Text>
                    </View>
                  )}
                </View>
                <Text 
                  style={[
                    textStyles.body,
                    { 
                      color: caloriePercent > 100 ? theme.error : caloriePercent >= 90 ? theme.success : theme.warning,
                      fontWeight: '600'
                    }
                  ]}
                >
                  {caloriePercent}%
                </Text>
              </View>
              
              <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.sm }]}>
                {log.total_calories} / {targets.calories} kcal
              </Text>
              
              <View style={[styles.progressBarContainer, { backgroundColor: theme.border, height: 8 }]}>
                <View 
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(caloriePercent, 100)}%`,
                      backgroundColor: caloriePercent > 100 ? theme.error : theme.success
                    }
                  ]}
                />
              </View>
              
              <View style={styles.weeklyDayMacros}>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Protein</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                    {log.total_protein}g
                  </Text>
                </View>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Carbs</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                    {log.total_carbohydrates}g
                  </Text>
                </View>
                <View style={styles.weeklyMacroItem}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Fat</Text>
                  <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                    {log.total_fat}g
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
                { backgroundColor: `${mealColor}20` }
              ]}
            >
              <Icon name={getMealIcon(mealType)} size={24} color={mealColor} />
            </View>
            <View>
              <Text style={[textStyles.heading4, { color: theme.text, textTransform: 'capitalize' }]}>
                {mealType}
              </Text>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                {totals.calories} kcal • {entries.length} items
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setSelectedMeal(mealType);
              setShowAddFood(true);
            }}
          >
            <Icon name="plus" size={18} color="#fff" />
            <Text style={[textStyles.body, { color: '#fff', marginLeft: SPACING.xs }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Food Entries */}
        {entries.length > 0 ? (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <View
                key={entry.id}
                style={[styles.entryItem, { backgroundColor: `${theme.surface}99` }]}
              >
                {/* Food Image Placeholder */}
                <View style={[styles.foodImagePlaceholder, { backgroundColor: theme.border }]}>
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
                      {entry.serving_size} {entry.serving_unit}
                    </Text>
                  </View>

                  {/* Nutrition Info */}
                  <View style={styles.nutritionInfo}>
                    <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                      {entry.calories} kcal
                    </Text>
                    <Text style={[textStyles.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                      P: {entry.protein}g • C: {entry.carbohydrates}g • F: {entry.fat}g
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
                {totals.calories}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Protein</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                {totals.protein}g
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Carbs</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                {totals.carbs}g
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Fat</Text>
              <Text style={[textStyles.body, { color: theme.primary, fontWeight: '600' }]}>
                {totals.fat}g
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[textStyles.heading3, { color: theme.text }]}>Nutrition Tracking</Text>
        <TouchableOpacity>
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
                viewMode === 'daily' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('daily')}
            >
              <Text style={[
                textStyles.body,
                { color: viewMode === 'daily' ? '#fff' : theme.text }
              ]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'weekly' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[
                textStyles.body,
                { color: viewMode === 'weekly' ? '#fff' : theme.text }
              ]}>
                Weekly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <View style={[styles.dateSelector, { backgroundColor: `${theme.surface}99` }]}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => changeDate(-1)}
            >
              <Icon name="chevron-left" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.dateInfo}>
              <Text style={[textStyles.heading4, { color: theme.primary }]}>
                {viewMode === 'weekly' ? formatWeekRange(getWeekStart(selectedDate)) : formatDate(selectedDate)}
              </Text>
              {viewMode === 'daily' && isToday && (
                <View style={[styles.todayBadge, { backgroundColor: theme.success }]}>
                  <Text style={[textStyles.small, { color: '#fff' }]}>Today</Text>
                </View>
              )}
              {viewMode === 'weekly' && isCurrentWeek && (
                <View style={[styles.todayBadge, { backgroundColor: theme.success }]}>
                  <Text style={[textStyles.small, { color: '#fff' }]}>This Week</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.dateArrow, ((viewMode === 'daily' && isToday) || (viewMode === 'weekly' && isCurrentWeek)) && { opacity: 0.3 }]}
              onPress={() => changeDate(1)}
              disabled={(viewMode === 'daily' && isToday) || (viewMode === 'weekly' && isCurrentWeek)}
            >
              <Icon name="chevron-right" size={24} color={theme.text} />
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
                color="#22c55e"
                icon="C"
              />
              <MacronutrientCard
                name="Fat"
                current={todayLog.total_fat}
                target={targets.fat}
                unit="g"
                color="#eab308"
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  dateCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  dateArrow: {
    padding: SPACING.xs,
  },
  dateInfo: {
    alignItems: 'center',
  },
  todayBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.xs,
  },
  macroSection: {
    marginBottom: SPACING.lg,
  },
  mealsSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mealCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  entriesList: {
    marginBottom: SPACING.sm,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  foodImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
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
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  totalItem: {
    alignItems: 'center',
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
  weeklyCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  weeklyDayItem: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  weeklyDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  weeklyDayMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  weeklyMacroItem: {
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});

export default NutritionTrackingScreen;


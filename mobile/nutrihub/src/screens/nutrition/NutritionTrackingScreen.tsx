import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import MacronutrientCard from '../../components/nutrition/MacronutrientCard';
import MicronutrientPanel from '../../components/nutrition/MicronutrientPanel';
import UserMetricsModal from '../../components/nutrition/UserMetricsModal';
import FoodSelectorModal from '../../components/food/FoodSelectorModal';
import PrivateFoodModal from '../../components/food/PrivateFoodModal';
import TextInput from '../../components/common/TextInput';
import { FoodLogEntry, MealTotals, DailyNutritionLog, NutritionTargets, UserMetrics, MicroNutrient, PrivateFood } from '../../types/nutrition';
import { FoodItem } from '../../types/types';
import { nutritionService } from '../../services/api/nutrition.service';
import { privateFoodService } from '../../services/api/privateFood.service';

// Helper functions to categorize and extract info from micronutrient keys (matching frontend logic)
const extractUnit = (key: string): string => {
  // Extract unit from key name (e.g., "Vitamin A, RAE (µg)" -> "µg")
  const match = key.match(/\(([^)]+)\)$/);
  return match ? match[1] : '';
};

const extractName = (key: string): string => {
  // Extract name without unit and without parenthetical clarifications
  // Examples:
  // "Vitamin K (phylloquinone) (µg)" -> "Vitamin K"
  // "Vitamin A, RAE (µg)" -> "Vitamin A, RAE"
  // "Vitamin D (D2 + D3) (µg)" -> "Vitamin D"
  // "Vitamin E (alpha-tocopherol) (mg)" -> "Vitamin E"

  // First, remove the unit (last parentheses)
  let name = key.replace(/\s*\([^)]+\)$/, '').trim();

  // Then, remove any remaining parenthetical clarifications
  // This handles cases like "Vitamin K (phylloquinone)" -> "Vitamin K"
  name = name.replace(/\s*\([^)]+\)/g, '').trim();

  return name;
};

const isVitamin = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return lowerName.includes('vitamin') ||
    lowerName.includes('thiamin') ||
    lowerName.includes('riboflavin') ||
    lowerName.includes('niacin') ||
    lowerName.includes('folate') ||
    lowerName.includes('folic acid') ||
    lowerName.includes('choline') ||
    lowerName.includes('carotene') ||
    lowerName.includes('lycopene') ||
    lowerName.includes('lutein');
};

const isMineral = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return lowerName.includes('calcium') ||
    lowerName.includes('iron') ||
    lowerName.includes('magnesium') ||
    lowerName.includes('phosphorus') ||
    lowerName.includes('potassium') ||
    lowerName.includes('sodium') ||
    lowerName.includes('zinc') ||
    lowerName.includes('copper') ||
    lowerName.includes('manganese') ||
    lowerName.includes('selenium');
};

const NutritionTrackingScreen: React.FC = () => {
  const { theme, textStyles } = useTheme();
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<{ log: DailyNutritionLog; percentage: number } | null>(null);

  // Food entry management state
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showServingDialog, setShowServingDialog] = useState(false);
  const [servingSize, setServingSize] = useState<number | string>(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [isSelectedFoodPrivate, setIsSelectedFoodPrivate] = useState(false);
  const [selectedPrivateFoodData, setSelectedPrivateFoodData] = useState<PrivateFood | null>(null);

  // Data state
  const [dailyLog, setDailyLog] = useState<DailyNutritionLog | null>(null);
  const [privateFoodEntries, setPrivateFoodEntries] = useState<FoodLogEntry[]>([]); // Separate state for private food entries
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyNutritionLog[]>([]);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showPrivateFoodModal, setShowPrivateFoodModal] = useState(false);

  // Format numbers to 1 decimal place
  const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) {
      return '0';
    }
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) {
      return '0';
    }
    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
  };

  // Fetch initial data (metrics and targets)
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Try to fetch metrics first
      let userMetrics: UserMetrics | null = null;
      try {
        userMetrics = await nutritionService.getUserMetrics();
        setMetrics(userMetrics);
      } catch (metricsError: any) {
        console.error('Error fetching user metrics:', metricsError);
        // If 404 on metrics, show modal and don't try to fetch targets
        const is404 =
          metricsError.status === 404 ||
          metricsError.response?.status === 404 ||
          (typeof metricsError.message === 'string' && (metricsError.message.includes('404') || metricsError.message.includes('Not found'))) ||
          (typeof metricsError.error === 'string' && (metricsError.error.includes('404') || metricsError.error.includes('Not found')));

        if (is404) {
          setMetrics(null);
          setTargets(null);
          setShowMetricsModal(true);
          setLoading(false);
          return;
        } else {
          Alert.alert('Error', 'Failed to load user metrics. Please try again.');
        }
      }

      // Only fetch targets if metrics exist
      if (userMetrics) {
        try {
          const userTargets = await nutritionService.getTargets();
          setTargets(userTargets);
        } catch (targetsError: any) {
          console.error('Error fetching nutrition targets:', targetsError);
          // If 404 on targets, it might mean metrics need to be set
          if (targetsError.status === 404 || targetsError.response?.status === 404 || targetsError.message?.includes('404') || targetsError.message?.includes('Not found')) {
            setTargets(null);
            // Show modal if we don't have metrics
            if (!userMetrics) {
              setShowMetricsModal(true);
            }
          } else {
            Alert.alert('Error', 'Failed to load nutrition targets. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load nutrition data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch daily log for selected date
  const fetchDailyLog = useCallback(async () => {
    if (!metrics) return; // Don't fetch log if metrics aren't set

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Load private food entries from AsyncStorage for this date
      const storedPrivateEntries = await privateFoodService.getPrivateFoodEntries(dateStr);
      setPrivateFoodEntries(storedPrivateEntries as FoodLogEntry[]);

      const log = await nutritionService.getDailyLog(dateStr);

      // Merge backend entries with local private food entries
      if (log && storedPrivateEntries.length > 0) {
        const mergedEntries = [...(log.entries || []), ...(storedPrivateEntries as FoodLogEntry[])];

        // Recalculate totals including private food entries
        const privateTotals = storedPrivateEntries.reduce(
          (acc, entry) => ({
            calories: acc.calories + (entry.calories || 0),
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbohydrates || 0),
            fat: acc.fat + (entry.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        setDailyLog({
          ...log,
          entries: mergedEntries,
          total_calories: parseFloat(String(log.total_calories || 0)) + privateTotals.calories,
          total_protein: parseFloat(String(log.total_protein || 0)) + privateTotals.protein,
          total_carbohydrates: parseFloat(String(log.total_carbohydrates || 0)) + privateTotals.carbs,
          total_fat: parseFloat(String(log.total_fat || 0)) + privateTotals.fat,
        });
      } else {
        setDailyLog(log);
      }
    } catch (error) {
      console.error('Error fetching daily log:', error);
    }
  }, [selectedDate, metrics]);

  // Fetch weekly logs
  const fetchWeeklyLogs = useCallback(async () => {
    if (!metrics) return;

    try {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      const logs = await nutritionService.getLogsForRange(startStr, endStr);
      // Ensure logs is always an array
      const logsArray = Array.isArray(logs) ? logs : [];
      setWeeklyLogs(logsArray);
    } catch (error) {
      console.error('Error fetching weekly logs:', error);
      setWeeklyLogs([]); // Set to empty array on error
    }
  }, [selectedDate, metrics]);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  // Fetch logs when date or metrics change
  useEffect(() => {
    if (metrics) {
      fetchDailyLog();
      if (viewMode === 'weekly') {
        fetchWeeklyLogs();
      }
    }
  }, [fetchDailyLog, fetchWeeklyLogs, viewMode, metrics]);

  // Refresh weekly logs when switching to weekly view
  useEffect(() => {
    if (metrics && viewMode === 'weekly') {
      fetchWeeklyLogs();
    }
  }, [viewMode, metrics, fetchWeeklyLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchInitialData(),
      fetchDailyLog(),
      viewMode === 'weekly' ? fetchWeeklyLogs() : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  const handleMetricsSaved = async (newMetrics: UserMetrics) => {
    setMetrics(newMetrics);
    setShowMetricsModal(false);
    // Refresh targets as they might have changed
    try {
      const newTargets = await nutritionService.getTargets();
      setTargets(newTargets);
      // Refresh daily log and weekly logs with new targets
      await fetchDailyLog();
      if (viewMode === 'weekly') {
        await fetchWeeklyLogs();
      }
    } catch (error) {
      console.error('Error refreshing targets after saving metrics:', error);
    }
  };

  // Handle food selection from FoodSelectorModal
  const handleFoodSelect = (food: FoodItem, isPrivate?: boolean, privateFoodData?: PrivateFood) => {
    setSelectedFood(food);
    setIsSelectedFoodPrivate(isPrivate || false);
    setSelectedPrivateFoodData(privateFoodData || null);
    setServingSize(1); // Default to 1 serving
    setServingUnit('serving');
    setShowAddFood(false);
    setShowServingDialog(true);
  };

  // Handle confirming serving size and adding food entry
  const handleConfirmServing = async () => {
    if (!selectedFood) return;

    // Validate serving size
    const numServingSize = typeof servingSize === 'string' ? parseFloat(servingSize) : servingSize;
    if (!numServingSize || numServingSize <= 0 || isNaN(numServingSize)) {
      Alert.alert('Invalid Serving Size', 'Please enter a valid serving size greater than 0');
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Calculate multiplier based on unit
      let multiplier = numServingSize;
      if (servingUnit === 'g') {
        // Convert grams to multiplier using the food's actual serving size
        const foodServingSize = selectedFood.servingSize || 100;
        multiplier = numServingSize / foodServingSize;
      }

      // Round to 6 decimal places
      multiplier = Math.round(multiplier * 1000000) / 1000000;

      // Validate multiplier
      if (multiplier > 9999.999999) {
        Alert.alert('Serving Size Too Large', 'The serving size is too large. Please reduce the amount.');
        setLoading(false);
        return;
      }

      // Check if this is a private food (negative ID)
      if (isSelectedFoodPrivate || selectedFood.id < 0) {
        // Private foods can't be sent to backend - save to AsyncStorage
        const macros = selectedFood.macronutrients;
        const dateStr = selectedDate.toISOString().split('T')[0];

        const entryData = {
          food_id: selectedFood.id,
          food_name: selectedFood.title + ' (Private)',
          serving_size: numServingSize,
          serving_unit: servingUnit,
          meal_type: selectedMeal,
          calories: Math.round((macros?.calories || 0) * multiplier),
          protein: Math.round((macros?.protein || 0) * multiplier * 10) / 10,
          carbohydrates: Math.round((macros?.carbohydrates || 0) * multiplier * 10) / 10,
          fat: Math.round((macros?.fat || 0) * multiplier * 10) / 10,
          logged_at: new Date().toISOString(),
          date: dateStr,
        };

        // Save to AsyncStorage
        const savedEntry = await privateFoodService.addPrivateFoodEntry(entryData);

        // Update local state and UI
        const newEntry = savedEntry as FoodLogEntry;
        setPrivateFoodEntries(prev => [...prev, newEntry]);

        // Also update dailyLog immediately for instant UI feedback
        if (dailyLog) {
          const updatedEntries = [...(dailyLog.entries || []), newEntry];
          setDailyLog({
            ...dailyLog,
            entries: updatedEntries,
            total_calories: parseFloat(String(dailyLog.total_calories || 0)) + newEntry.calories,
            total_protein: parseFloat(String(dailyLog.total_protein || 0)) + newEntry.protein,
            total_carbohydrates: parseFloat(String(dailyLog.total_carbohydrates || 0)) + newEntry.carbohydrates,
            total_fat: parseFloat(String(dailyLog.total_fat || 0)) + newEntry.fat,
          });
        }

        Alert.alert(
          'Private Food Added',
          'Private food saved to your log.',
          [{ text: 'OK' }]
        );
      } else {
        // Regular food - send to backend
        await nutritionService.addFoodEntry({
          date: dateStr,
          food_id: selectedFood.id,
          serving_size: multiplier,
          serving_unit: servingUnit,
          meal_type: selectedMeal,
        });

        // Refresh both daily and weekly logs to keep them in sync
        await Promise.all([
          fetchDailyLog(),
          fetchWeeklyLogs()
        ]);
      }

      setShowServingDialog(false);
      setSelectedFood(null);
      setIsSelectedFoodPrivate(false);
      setSelectedPrivateFoodData(null);
      setServingSize(1); // Reset to default 1 serving
      setServingUnit('serving');
      setEditingEntry(null);
    } catch (error: any) {
      console.error('Error adding food entry:', error);
      Alert.alert('Error', error?.message || 'Failed to add food entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle editing an existing entry
  const handleEditEntry = (entry: FoodLogEntry) => {
    setEditingEntry(entry);

    // Convert multiplier back to display value
    let displaySize = entry.serving_size;
    // For food_serving_size, we need to calculate it from the entry data
    // Backend doesn't provide this, so we'll use 100g as default
    const foodServingSize = 100;

    if (entry.serving_unit === 'g') {
      displaySize = entry.serving_size * foodServingSize;
    }

    setServingSize(displaySize);
    setServingUnit(entry.serving_unit);
    setSelectedMeal(entry.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack');

    // Set a placeholder food object for display in the dialog
    // Using type assertion since we only need minimal properties
    setSelectedFood({
      id: entry.food_id,
      title: entry.food_name,
      description: '',
      iconName: 'food',
      category: 'Other' as any,
    } as FoodItem);

    setShowServingDialog(true);
  };

  // Handle updating an existing entry
  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    // Validate serving size
    const numServingSize = typeof servingSize === 'string' ? parseFloat(servingSize) : servingSize;
    if (!numServingSize || numServingSize <= 0 || isNaN(numServingSize)) {
      Alert.alert('Invalid Serving Size', 'Please enter a valid serving size greater than 0');
      return;
    }

    try {
      setLoading(true);

      // Calculate multiplier
      let multiplier = numServingSize;
      if (servingUnit === 'g') {
        // Use food's actual serving size from database, otherwise default to 100g
        const foodServingSize = selectedFood?.servingSize || 100;
        multiplier = numServingSize / foodServingSize;
      }

      // Round to 6 decimal places
      multiplier = Math.round(multiplier * 1000000) / 1000000;

      // Validate multiplier
      if (multiplier > 9999.999999) {
        Alert.alert('Serving Size Too Large', 'The serving size is too large. Please reduce the amount.');
        setLoading(false);
        return;
      }

      await nutritionService.updateFoodEntry(editingEntry.id, {
        serving_size: multiplier,
        serving_unit: servingUnit,
        meal_type: selectedMeal,
      });

      // Refresh both daily and weekly logs to keep them in sync
      // Use Promise.all to ensure both refresh before continuing
      await Promise.all([
        fetchDailyLog(),
        fetchWeeklyLogs()
      ]);

      setShowServingDialog(false);
      setEditingEntry(null);
      setSelectedFood(null);
      setServingSize(1); // Reset to default 1 serving
      setServingUnit('serving');
    } catch (error: any) {
      console.error('Error updating entry:', error);
      Alert.alert('Error', error?.message || 'Failed to update entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting an entry
  const handleDeleteEntry = (entryId: number) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await nutritionService.deleteFoodEntry(entryId);

              // Refresh both daily and weekly logs to keep them in sync
              // Use Promise.all to ensure both refresh before continuing
              await Promise.all([
                fetchDailyLog(),
                fetchWeeklyLogs()
              ]);
            } catch (error: any) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', error?.message || 'Failed to delete entry. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


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

  // Group entries by meal type
  const breakfastEntries = dailyLog?.entries?.filter(e => e.meal_type === 'breakfast') || [];
  const lunchEntries = dailyLog?.entries?.filter(e => e.meal_type === 'lunch') || [];
  const dinnerEntries = dailyLog?.entries?.filter(e => e.meal_type === 'dinner') || [];
  const snackEntries = dailyLog?.entries?.filter(e => e.meal_type === 'snack') || [];

  // Calculate meal breakdown for calories
  const mealBreakdown = {
    breakfast: calculateMealTotals(breakfastEntries).calories,
    lunch: calculateMealTotals(lunchEntries).calories,
    dinner: calculateMealTotals(dinnerEntries).calories,
  };

  const getWeeklyDayDetailedInfo = (log: DailyNutritionLog, percentage: number) => {
    if (!targets || !log) {
      return {
        title: 'Loading...',
        message: 'Please wait while we load your targets.',
        icon: 'dots-horizontal',
        color: theme.textSecondary,
      };
    }

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

    const logCalories = log.total_calories || 0;
    const targetCalories = targets.calories || 0;
    const remaining = targetCalories - logCalories;
    const over = logCalories - targetCalories;

    if (percentage === 100) {
      return {
        title: `${dayName} - Perfect! 🎉`,
        message: `You hit exactly ${formatNumber(logCalories)} calories, meeting your daily target perfectly! This is optimal for maintaining your health goals.${isLogToday ? '\n\nKeep up this excellent balance for the rest of today!' : ''}`,
        icon: 'check-circle',
        color: theme.success,
      };
    }

    if (isOnTrack) {
      return {
        title: `${dayName} - Almost There (${percentage}%)`,
        message: `You consumed ${formatNumber(logCalories)} calories, which is ${formatNumber(remaining)} calories short of your ${formatNumber(targetCalories)} target. This is still within a healthy range.${isLogToday ? '\n\nJust a bit more to reach your goal!' : ''}`,
        icon: 'chart-line',
        color: theme.success,
      };
    }

    if (isFair) {
      return {
        title: `${dayName} - Fair Progress (${percentage}%)`,
        message: `You've consumed ${formatNumber(logCalories)} of your ${formatNumber(targetCalories)} calorie target. You need ${formatNumber(remaining)} more calories.${isLogToday ? '\n\nTry to add more nutritious foods to your remaining meals today.' : '\n\nConsider adding more calorie-dense, healthy foods to meet your targets.'}`,
        icon: 'alert',
        color: theme.warning,
      };
    }

    if (isLow) {
      return {
        title: `${dayName} - Low (${percentage}%)`,
        message: `You consumed only ${formatNumber(logCalories)} of your ${formatNumber(targetCalories)} calorie target. This is significantly low and may affect your energy levels and metabolism.${isLogToday ? '\n\nMake sure to eat substantial meals for the rest of the day.' : '\n\nConsistently low intake can impact your health negatively.'}`,
        icon: 'alert-circle',
        color: theme.error,
      };
    }

    if (isVeryLow) {
      return {
        title: `${dayName} - Very Low! (${percentage}%)`,
        message: `You consumed only ${formatNumber(logCalories)} calories, which is critically below your ${formatNumber(targetCalories)} target. This level of intake is concerning and can harm your metabolism, energy levels, and overall health.${isLogToday ? '\n\nPlease ensure you eat adequate meals for the rest of today.' : '\n\nConsult a healthcare professional if this pattern continues.'}`,
        icon: 'close-circle',
        color: theme.error,
      };
    }

    if (isMinorOver) {
      return {
        title: `${dayName} - Slightly Over (${percentage}%)`,
        message: `You consumed ${formatNumber(logCalories)} calories, which is ${formatNumber(over)} over your ${formatNumber(targetCalories)} target. This is a minor excess and shouldn't be a major concern.${isLogToday ? '\n\nConsider lighter options for the rest of the day.' : '\n\nTry to balance this tomorrow with slightly reduced portions.'}`,
        icon: 'alert',
        color: theme.warning,
      };
    }

    if (isModerateOver) {
      return {
        title: `${dayName} - Moderately Over (${percentage}%)`,
        message: `You consumed ${formatNumber(logCalories)} calories, exceeding your ${formatNumber(targetCalories)} target by ${formatNumber(over)} calories. This is a moderate excess that can impact your health goals.${isLogToday ? '\n\nConsider skipping snacks and choosing lighter options.' : '\n\nBalance this by reducing intake tomorrow and increasing physical activity.'}`,
        icon: 'alert-circle',
        color: theme.error,
      };
    }

    // Severe over
    return {
      title: `${dayName} - Significantly Over! (${percentage}%)`,
      message: `You consumed ${formatNumber(logCalories)} calories, which is ${formatNumber(over)} over your ${formatNumber(targetCalories)} target. This is a substantial excess that can significantly impact your health goals.${isLogToday ? '\n\nPlease avoid additional meals and snacks for the rest of today.' : '\n\nFocus on portion control, increase physical activity, and aim to balance this over the next few days.'}`,
      icon: 'alert',
      color: '#dc2626',
    };
  };

  const getMicronutrientsList = useCallback((): MicroNutrient[] => {
    if (!dailyLog?.micronutrients_summary || !targets?.micronutrients) return [];

    // Get all micronutrients from targets (like frontend does)
    return Object.entries(targets.micronutrients)
      .map(([key, targetValue]) => {
        const currentValue = dailyLog.micronutrients_summary[key] || 0;
        const name = extractName(key);
        const unit = extractUnit(key) || '';

        // Categorize based on name (matching frontend logic)
        let category: 'vitamin' | 'mineral' = 'vitamin'; // Default
        if (isMineral(name)) {
          category = 'mineral';
        } else if (isVitamin(name)) {
          category = 'vitamin';
        }

        return {
          name,
          current: currentValue,
          target: targetValue || 0,
          unit,
          category,
        };
      })
      .filter(nutrient => nutrient.target > 0); // Only show nutrients with targets set
  }, [dailyLog, targets]);

  const renderWeeklySummary = () => {
    if (!targets || !metrics) return null;

    // Ensure weeklyLogs is an array before spreading
    const logsArray = Array.isArray(weeklyLogs) ? weeklyLogs : [];
    // Sort logs by date descending
    const sortedLogs = [...logsArray].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <View style={[styles.weeklyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Icon name="chart-line" size={28} color={theme.primary} />
          <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm }]}>
            Weekly Summary
          </Text>
        </View>

        {sortedLogs.length === 0 ? (
          <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
            <Text style={[textStyles.body, { color: theme.textSecondary }]}>No logs found for this week.</Text>
          </View>
        ) : (
          sortedLogs.map((log: DailyNutritionLog) => {
            const date = new Date(log.date);
            const logCalories = log.total_calories || 0;
            const targetCalories = targets.calories || 1; // Avoid division by zero
            const caloriePercent = targetCalories > 0 ? Math.round((logCalories / targetCalories) * 100) : 0;
            const isLogToday = date.toDateString() === new Date().toDateString();

            // Under-target severity levels
            const isVeryLow = caloriePercent < 50;
            const isLow = caloriePercent >= 50 && caloriePercent < 70;
            const isOnTrack = caloriePercent >= 90 && caloriePercent <= 100;

            // Over-target severity levels
            const isMinorOver = caloriePercent > 100 && caloriePercent <= 110;
            const isModerateOver = caloriePercent > 110 && caloriePercent <= 130;

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
                key={log.date}
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
                      <Icon name="information-outline" size={16} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.md, fontWeight: '500' }]}>
                  {formatNumber(logCalories)} / {formatNumber(targetCalories)} kcal
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
                </View>
              </View>
            );
          })
        )}
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
                {formatNumber(totals.calories)} kcal • {entries.length} {entries.length === 1 ? 'item' : 'items'}
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
            <View style={styles.addButtonContent}>
              <Icon name="plus-circle" size={20} color="#fff" />
              <Text style={[textStyles.body, { color: '#fff', marginLeft: 6, fontWeight: '600', fontSize: 14 }]}>Add Food</Text>
            </View>
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
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}
                    onPress={() => handleEditEntry(entry)}
                    activeOpacity={0.7}
                  >
                    <Icon name="pencil" size={18} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}30` }]}
                    onPress={() => handleDeleteEntry(entry.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="delete-outline" size={18} color={theme.error} />
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

  // Show loading state
  if (loading && !refreshing && !dailyLog && !metrics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[textStyles.body, { color: theme.textSecondary, marginTop: SPACING.md }]}>Loading nutrition data...</Text>
      </View>
    );
  }

  // Show message if metrics are not set (but don't show if modal is already showing)
  if (!metrics && !loading && !showMetricsModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
        <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }]}>
          <Icon name="chart-line" size={64} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: SPACING.lg }} />
          <Text style={[textStyles.heading3, { color: theme.text, marginBottom: SPACING.md, textAlign: 'center' }]}>
            Setup Required
          </Text>
          <Text style={[textStyles.body, { color: theme.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }]}>
            To track your nutrition, we need some basic information about you. Please set up your metrics to get started.
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md }]}
            onPress={() => setShowMetricsModal(true)}
          >
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '700' }]}>Set Up Metrics</Text>
          </TouchableOpacity>
        </View>
        {/* User Metrics Modal - render even on setup screen */}
        <UserMetricsModal
          visible={showMetricsModal}
          onClose={() => {
            // Only allow closing if metrics exist (editing mode)
            // If metrics don't exist, user must set them
            if (metrics) {
              setShowMetricsModal(false);
            } else {
              // If no metrics, show alert that metrics are required
              Alert.alert(
                'Metrics Required',
                'You need to set up your metrics to use nutrition tracking. Please fill in the form and save.',
                [{ text: 'OK' }]
              );
            }
          }}
          onSave={handleMetricsSaved}
          initialMetrics={metrics || undefined}
        />
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowMetricsModal(true)}
        >
          <Icon name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
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
              onPress={async () => {
                setViewMode('weekly');
                // Force refresh weekly logs when switching to weekly view
                if (metrics) {
                  await fetchWeeklyLogs();
                }
              }}
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
            {dailyLog && targets && metrics ? (
              <View style={styles.macroSection}>
                <MacronutrientCard
                  name="Calories"
                  current={dailyLog.total_calories}
                  target={targets.calories}
                  unit=""
                  color="#f97316"
                  mealBreakdown={mealBreakdown}
                />
                <MacronutrientCard
                  name="Protein"
                  current={dailyLog.total_protein}
                  target={targets.protein}
                  unit="g"
                  color="#3b82f6"
                  icon="P"
                />
                <MacronutrientCard
                  name="Carbohydrates"
                  current={dailyLog.total_carbohydrates}
                  target={targets.carbohydrates}
                  unit="g"
                  color="#10b981"
                  icon="C"
                />
                <MacronutrientCard
                  name="Fat"
                  current={dailyLog.total_fat}
                  target={targets.fat}
                  unit="g"
                  color="#f59e0b"
                  icon="F"
                />
              </View>
            ) : (
              <View style={[styles.macroSection, { alignItems: 'center', padding: SPACING.xl }]}>
                <Text style={[textStyles.body, { color: theme.textSecondary }]}>
                  {!metrics ? 'Please set up your metrics first.' : !targets ? 'Please set your nutrition targets.' : 'No data for this day.'}
                </Text>
              </View>
            )}

            {/* Meals Section */}
            <View style={styles.mealsSection}>
              <View style={styles.sectionHeader}>
                <Icon name="silverware-fork-knife" size={28} color={theme.primary} />
                <Text style={[textStyles.heading3, { color: theme.text, marginLeft: SPACING.sm, flex: 1 }]}>
                  {isToday ? "Today's Meals" : "Meals"}
                </Text>
              </View>

              {renderMealSection('breakfast', breakfastEntries)}
              {renderMealSection('lunch', lunchEntries)}
              {renderMealSection('dinner', dinnerEntries)}
              {renderMealSection('snack', snackEntries)}
            </View>

            {/* Micronutrients Section */}
            {dailyLog && dailyLog.micronutrients_summary && (
              <MicronutrientPanel micronutrients={getMicronutrientsList()} />
            )}
          </>
        ) : (
          <>
            {/* Weekly Summary View */}
            {renderWeeklySummary()}
          </>
        )}
      </ScrollView>

      {/* Food Selector Modal */}
      <FoodSelectorModal
        visible={showAddFood}
        onClose={() => setShowAddFood(false)}
        onSelect={handleFoodSelect}
      />

      {/* Private Food Modal */}
      <PrivateFoodModal
        visible={showPrivateFoodModal}
        onClose={() => setShowPrivateFoodModal(false)}
      />

      {/* Serving Size Dialog */}
      <Modal
        visible={showServingDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowServingDialog(false);
          setEditingEntry(null);
          setSelectedFood(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[textStyles.heading3, { color: theme.text, flex: 1 }]}>
                {editingEntry ? 'Edit Entry' : 'Add Food'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowServingDialog(false);
                  setEditingEntry(null);
                  setSelectedFood(null);
                }}
                style={{ padding: SPACING.xs }}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {selectedFood && (
                <View style={{ marginBottom: SPACING.lg }}>
                  <Text style={[textStyles.heading4, { color: theme.primary, marginBottom: SPACING.xs }]}>
                    {selectedFood.title}
                  </Text>
                  {selectedFood.macronutrients && (
                    <Text style={[textStyles.caption, { color: theme.textSecondary }]}>
                      Per {selectedFood.servingSize || 100}g: {selectedFood.macronutrients.calories} kcal • P: {selectedFood.macronutrients.protein}g • C: {selectedFood.macronutrients.carbohydrates}g • F: {selectedFood.macronutrients.fat}g
                    </Text>
                  )}
                </View>
              )}

              <View style={{ marginBottom: SPACING.lg }}>
                <TextInput
                  label="Serving Size"
                  value={servingSize.toString()}
                  onChangeText={setServingSize}
                  keyboardType="numeric"
                  placeholder={servingUnit === 'g' ? (selectedFood?.servingSize ? String(selectedFood.servingSize) : '100') : '1'}
                  helperText={`Enter the amount consumed in ${servingUnit === 'g' ? 'grams' : 'servings'}`}
                />

                <Text style={[textStyles.body, { color: theme.text, marginBottom: SPACING.xs, marginTop: SPACING.sm }]}>
                  Unit
                </Text>
                <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      servingUnit === 'g' && { backgroundColor: theme.primary, borderColor: theme.primary },
                      servingUnit !== 'g' && { borderColor: theme.border }
                    ]}
                    onPress={() => {
                      setServingUnit('g');
                      // Update serving size to food's actual serving size in grams from database
                      const defaultGrams = selectedFood?.servingSize || 100;
                      setServingSize(defaultGrams);
                    }}
                  >
                    <Text style={[
                      textStyles.body,
                      { color: servingUnit === 'g' ? '#fff' : theme.text }
                    ]}>
                      Grams (g)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      servingUnit === 'serving' && { backgroundColor: theme.primary, borderColor: theme.primary },
                      servingUnit !== 'serving' && { borderColor: theme.border }
                    ]}
                    onPress={() => {
                      setServingUnit('serving');
                      // Update serving size to default for servings (1)
                      setServingSize(1);
                    }}
                  >
                    <Text style={[
                      textStyles.body,
                      { color: servingUnit === 'serving' ? '#fff' : theme.text }
                    ]}>
                      Servings
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nutrition Preview */}
              {selectedFood && !isNaN(Number(servingSize)) && Number(servingSize) > 0 && (
                <View style={{
                  backgroundColor: theme.background,
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  marginBottom: SPACING.lg
                }}>
                  <Text style={[textStyles.caption, { color: theme.textSecondary, marginBottom: SPACING.sm }]}>
                    Nutrition Preview ({servingSize} {servingUnit})
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Calories</Text>
                      <Text style={[textStyles.body, { color: theme.primary, fontWeight: '700' }]}>
                        {(() => {
                          const size = Number(servingSize);
                          let multiplier = size;
                          if (servingUnit === 'g') {
                            const foodServingSize = selectedFood?.servingSize || 100;
                            multiplier = size / foodServingSize;
                          }
                          const cals = (selectedFood.macronutrients?.calories || 0) * multiplier;
                          return Math.round(cals);
                        })()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Protein</Text>
                      <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                        {(() => {
                          const size = Number(servingSize);
                          let multiplier = size;
                          if (servingUnit === 'g') {
                            const foodServingSize = selectedFood?.servingSize || 100;
                            multiplier = size / foodServingSize;
                          }
                          const protein = (selectedFood.macronutrients?.protein || 0) * multiplier;
                          return protein.toFixed(1);
                        })()}g
                      </Text>
                    </View>
                    <View>
                      <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Carbs</Text>
                      <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                        {(() => {
                          const size = Number(servingSize);
                          let multiplier = size;
                          if (servingUnit === 'g') {
                            const foodServingSize = selectedFood?.servingSize || 100;
                            multiplier = size / foodServingSize;
                          }
                          const carbs = (selectedFood.macronutrients?.carbohydrates || 0) * multiplier;
                          return carbs.toFixed(1);
                        })()}g
                      </Text>
                    </View>
                    <View>
                      <Text style={[textStyles.caption, { color: theme.textSecondary }]}>Fat</Text>
                      <Text style={[textStyles.body, { color: theme.text, fontWeight: '600' }]}>
                        {(() => {
                          const size = Number(servingSize);
                          let multiplier = size;
                          if (servingUnit === 'g') {
                            const foodServingSize = selectedFood?.servingSize || 100;
                            multiplier = size / foodServingSize;
                          }
                          const fat = (selectedFood.macronutrients?.fat || 0) * multiplier;
                          return fat.toFixed(1);
                        })()}g
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={editingEntry ? handleUpdateEntry : handleConfirmServing}
            >
              <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]}>
                {editingEntry ? 'Update Entry' : 'Add Food'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Metrics Modal */}
      <UserMetricsModal
        visible={showMetricsModal}
        onClose={() => {
          // Only allow closing if metrics exist (editing mode)
          // If metrics don't exist, user must set them
          if (metrics) {
            setShowMetricsModal(false);
          } else {
            // If no metrics, show alert that metrics are required
            Alert.alert(
              'Metrics Required',
              'You need to set up your metrics to use nutrition tracking. Please fill in the form and save.',
              [{ text: 'OK' }]
            );
          }
        }}
        onSave={handleMetricsSaved}
        initialMetrics={metrics || undefined}
      />

      {/* Weekly Day Info Modal */}
      {selectedWeeklyDay && targets && (
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
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
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
    flexDirection: 'row',
    gap: SPACING.sm,
    flexShrink: 0,
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editButton: {
    // Additional styles can be added here if needed
  },
  deleteButton: {
    // Additional styles can be added here if needed
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
  unitButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPrivateFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
});

export default NutritionTrackingScreen;


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarBlank,
  Moon,
  Cookie,
  Trash,
  PencilSimple,
  ChartLine,
  CaretLeft,
  CaretRight,
  Plus,
  ForkKnife,
  Coffee,
  Hamburger,
  X,
  ArrowClockwise
} from '@phosphor-icons/react';
import { Dialog } from '@headlessui/react';
import FoodSelector from './FoodSelector';
import { apiClient, Food } from '../lib/apiClient';
import { DailyNutritionLog, NutritionTargets, FoodLogEntry } from '../types/nutrition';

interface NutritionTrackingProps {
  onDateChange?: (date: Date) => void;
  onDataChange?: () => void; // Callback to notify parent when data changes (add/edit/delete)
}

const NutritionTracking = ({ onDateChange, onDataChange }: NutritionTrackingProps = {}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showServingDialog, setShowServingDialog] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingSize, setServingSize] = useState<number | string>(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [editingFoodData, setEditingFoodData] = useState<Food | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const [todayLog, setTodayLog] = useState<DailyNutritionLog | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [historyLogs, setHistoryLogs] = useState<DailyNutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsMissing, setMetricsMissing] = useState(false);
  
  // Cache for food data (servingSize, imageUrl) by food_id
  const [foodCache, setFoodCache] = useState<Map<number, { servingSize: number; imageUrl: string }>>(new Map());

  // Fetch and cache food data for entries
  const fetchFoodData = async (foodId: number, foodName?: string): Promise<{ servingSize: number; imageUrl: string } | null> => {
    // Check cache first
    if (foodCache.has(foodId)) {
      return foodCache.get(foodId)!;
    }

    try {
      // Search by food name (more efficient than pagination)
      if (foodName) {
        // Use first few characters of food name for search
        const searchTerm = foodName.substring(0, 10).toLowerCase();
        const searchResponse = await apiClient.getFoods({ page: 1, search: searchTerm });
        
        // Try to find exact match by ID first, then by name
        let food = searchResponse.results?.find(f => f.id === foodId);
        if (!food) {
          food = searchResponse.results?.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        }
        
        if (food) {
          const foodData = {
            servingSize: food.servingSize,
            imageUrl: food.imageUrl
          };
          // Update cache
          setFoodCache(prev => new Map(prev).set(foodId, foodData));
          return foodData;
        }
      }
    } catch (err) {
      console.error('Error fetching food data:', err);
    }
    
    return null;
  };

  useEffect(() => {
    fetchData();
    // Notify parent component of date change
    if (onDateChange) {
      onDateChange(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewMode]);

  // Fetch missing food data when entries change
  useEffect(() => {
    if (todayLog?.entries && todayLog.entries.length > 0) {
      const fetchMissingFoodData = async () => {
        const foodIdToName = new Map<number, string>();
        todayLog.entries!.forEach(entry => {
          if (!foodIdToName.has(entry.food_id)) {
            foodIdToName.set(entry.food_id, entry.food_name);
          }
        });
        
        const missingFoodIds = todayLog.entries!
          .filter(entry => !foodCache.has(entry.food_id))
          .map(entry => entry.food_id);
        
        const uniqueMissingIds = [...new Set(missingFoodIds)];
        if (uniqueMissingIds.length > 0) {
          const foodPromises = uniqueMissingIds.map(foodId => 
            fetchFoodData(foodId, foodIdToName.get(foodId))
          );
          await Promise.all(foodPromises);
        }
      };
      
      fetchMissingFoodData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLog?.entries]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setMetricsMissing(false);
    try {
      // Fetch data based on view mode
      if (viewMode === 'weekly') {
        // In weekly view, fetch all logs for the week
        // Get Monday to Sunday for the week containing selectedDate
        const getMondayOfWeek = (date: Date) => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          return new Date(d.setDate(diff));
        };
        const monday = getMondayOfWeek(new Date(selectedDate));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6); // Sunday is 6 days after Monday
        
        const history = await apiClient.getDailyLogHistory(
          monday.toISOString().split('T')[0],
          sunday.toISOString().split('T')[0]
        );
        let historyArray = Array.isArray(history) ? history : [];
        
        // Helper to normalize date strings for comparison
        const normalizeDateStr = (dateStr: string): string => {
          return dateStr.split('T')[0];
        };
        
        // Get all date strings for the week
        const weekDateStrings: string[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          weekDateStrings.push(date.toISOString().split('T')[0]);
        }
        
        // Create a map of existing logs by date
        const existingLogsMap = new Map<string, DailyNutritionLog>();
        historyArray.forEach(log => {
          if (log.date) {
            const normalizedDate = normalizeDateStr(log.date);
            existingLogsMap.set(normalizedDate, log);
          }
        });
        
        // Fetch logs for any missing days in the week (this ensures we have logs for all 7 days)
        const missingDates = weekDateStrings.filter(dateStr => !existingLogsMap.has(dateStr));
        const missingLogsPromises = missingDates.map(async (dateStr) => {
          try {
            const log = await apiClient.getDailyLog(dateStr);
            return log;
          } catch (err) {
            console.error(`Error fetching log for ${dateStr}:`, err);
            return null;
          }
        });
        
        const missingLogs = await Promise.all(missingLogsPromises);
        const validMissingLogs = missingLogs.filter(log => log !== null) as DailyNutritionLog[];
        
        // Combine all logs
        historyArray = [...historyArray, ...validMissingLogs];
        
        // Sort by date to ensure consistent order
        historyArray.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          const dateA = normalizeDateStr(a.date);
          const dateB = normalizeDateStr(b.date);
          return dateA.localeCompare(dateB);
        });
        
        // Ensure history is always an array
        setHistoryLogs(historyArray);
        
        // In weekly view, set todayLog to the log for selectedDate (if it exists in history)
        // This allows the daily view to have data when switching from weekly
        const dateStr = selectedDate.toISOString().split('T')[0];
        const selectedDateLog = historyArray.find(h => {
          if (!h.date) return false;
          const normalizeDateStr = (dateStr: string): string => {
            return dateStr.split('T')[0];
          };
          return normalizeDateStr(h.date) === dateStr;
        });
        // Update targets from the selected date log or fetch fresh
        const updateTargetsFromLog = async (log: DailyNutritionLog) => {
          if (log.targets) {
            // Fetch full targets to get micronutrients and other fields, then merge with log targets
            try {
              const fullTargets = await apiClient.getNutritionTargets();
              setTargets({
                ...fullTargets,
                calories: log.targets.calories,
                protein: log.targets.protein,
                carbohydrates: log.targets.carbohydrates,
                fat: log.targets.fat,
              });
            } catch (err) {
              console.error('Error fetching full targets:', err);
              // Fallback: fetch targets separately
              try {
                const targetsData = await apiClient.getNutritionTargets();
                setTargets(targetsData);
              } catch (fallbackErr) {
                console.error('Error fetching targets fallback:', fallbackErr);
              }
            }
          } else {
            // Fallback: fetch targets separately if not in log response
            try {
              const targetsData = await apiClient.getNutritionTargets();
              setTargets(targetsData);
            } catch (err) {
              console.error('Error fetching targets:', err);
            }
          }
        };

        if (selectedDateLog) {
          setTodayLog(selectedDateLog);
          await updateTargetsFromLog(selectedDateLog);
        } else {
          // If no log exists for selectedDate, fetch it separately (creates empty log if needed)
          try {
            const log = await apiClient.getDailyLog(dateStr);
            setTodayLog(log);
            await updateTargetsFromLog(log);
          } catch (err) {
            console.error('Error fetching selected date log:', err);
            // Still try to fetch targets even if log fetch fails
            try {
              const targetsData = await apiClient.getNutritionTargets();
              setTargets(targetsData);
            } catch (targetsErr) {
              console.error('Error fetching targets:', targetsErr);
            }
          }
        }
      } else {
        // In daily view, fetch the daily log for selectedDate
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // Fetch daily log and full targets in parallel for efficiency
        const [log, fullTargets] = await Promise.all([
          apiClient.getDailyLog(dateStr),
          apiClient.getNutritionTargets().catch(() => null) // Don't fail if targets fetch fails
        ]);
        
        setTodayLog(log);

        // Update targets - prioritize values from daily log response (most up-to-date)
        // Merge with full targets to preserve micronutrients and other fields
        if (log.targets && fullTargets) {
          setTargets({
            ...fullTargets,
            calories: log.targets.calories,
            protein: log.targets.protein,
            carbohydrates: log.targets.carbohydrates,
            fat: log.targets.fat,
          });
        } else if (log.targets) {
          // If we have log targets but no full targets, fetch full targets and merge
          try {
            const fetchedTargets = await apiClient.getNutritionTargets();
            setTargets({
              ...fetchedTargets,
              calories: log.targets.calories,
              protein: log.targets.protein,
              carbohydrates: log.targets.carbohydrates,
              fat: log.targets.fat,
            });
          } catch (err) {
            console.error('Error fetching full targets:', err);
          }
        } else if (fullTargets) {
          // If we have full targets but no log targets, use full targets
          setTargets(fullTargets);
        } else {
          // Last resort: fetch targets separately
          try {
            const targetsData = await apiClient.getNutritionTargets();
            setTargets(targetsData);
          } catch (err) {
            console.error('Error fetching targets:', err);
          }
        }

        // Fetch and cache food data for all entries
        if (log.entries) {
          // Create map of food_id to food_name for better searching
          const foodIdToName = new Map<number, string>();
          log.entries.forEach(entry => {
            if (!foodIdToName.has(entry.food_id)) {
              foodIdToName.set(entry.food_id, entry.food_name);
            }
          });
          
          const uniqueFoodIds = [...new Set(log.entries.map(e => e.food_id))];
          const foodPromises = uniqueFoodIds.map(foodId => 
            fetchFoodData(foodId, foodIdToName.get(foodId))
          );
          await Promise.all(foodPromises);
        }
        
        // Clear history logs when not in weekly view
        setHistoryLogs([]);
      }

    } catch (err: any) {
      console.error('Error fetching nutrition data:', err);
      if (err.status === 404 && err.data?.detail === "No nutrition targets or metrics found. Please set your metrics first.") {
        setMetricsMissing(true);
      } else {
        setError('Failed to load nutrition data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Group entries by meal type
  const breakfastEntries = todayLog?.entries?.filter(e => e.meal_type === 'breakfast') || [];
  const lunchEntries = todayLog?.entries?.filter(e => e.meal_type === 'lunch') || [];
  const dinnerEntries = todayLog?.entries?.filter(e => e.meal_type === 'dinner') || [];
  const snackEntries = todayLog?.entries?.filter(e => e.meal_type === 'snack') || [];

  const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedMeal(mealType);
    setShowAddFood(true);
  };


  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setServingSize(food.servingSize);
    setServingUnit('g');
    setShowAddFood(false);
    setShowServingDialog(true);
  };

  const handleConfirmServing = async () => {
    if (!selectedFood) return;

    // Validate serving size
    const numServingSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize;
    if (!numServingSize || numServingSize <= 0) {
      alert('Please enter a valid serving size');
      return;
    }

    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Convert serving size based on unit
      // Backend expects serving_size as a multiplier
      // If unit is "g", convert grams to multiplier: grams / food.servingSize
      // If unit is "serving", use servingSize directly as multiplier
      let multiplier = numServingSize;
      if (servingUnit === 'g') {
        // Convert grams to multiplier (e.g., 200g / 100g = 2.0 servings)
        multiplier = numServingSize / selectedFood.servingSize;
      }

      // Round to 6 decimal places for precision (backend now supports up to 6 decimal places)
      multiplier = Math.round(multiplier * 1000000) / 1000000;

      // Validate multiplier doesn't exceed backend max_digits=10, decimal_places=6 (max: 9999.999999)
      if (multiplier > 9999.999999) {
        alert(`Serving size is too large. The maximum allowed multiplier is 9999.999999. Please reduce the amount.`);
        setLoading(false);
        return;
      }

      await apiClient.addFoodEntry({
        food_id: selectedFood.id,
        serving_size: multiplier,
        serving_unit: servingUnit,
        meal_type: selectedMeal,
        date: dateStr
      });

      // Refresh daily log and targets to update totals after adding entry
      await fetchData();
      // Notify parent component (Profile) to refresh its nutrition data
      if (onDataChange) {
        onDataChange();
      }
      setShowServingDialog(false);
      setSelectedFood(null);
    } catch (err: any) {
      console.error('Error adding food:', err);
      const errorMessage = err?.data?.serving_size?.[0] || 
                          err?.data?.error || 
                          err?.data?.detail || 
                          err?.message || 
                          'Failed to add food entry';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = async (entry: FoodLogEntry) => {
    setEditingEntry(entry);
    
    // Fetch food data if not in cache
    let foodData = foodCache.get(entry.food_id);
    if (!foodData) {
      const fetchedFoodData = await fetchFoodData(entry.food_id);
      if (fetchedFoodData) {
        foodData = fetchedFoodData;
      }
    }
    
    // Fetch full food object for nutrition calculations
    try {
      const foodsResponse = await apiClient.getFoods({ page: 1, search: entry.food_name });
      const food = foodsResponse.results?.find(f => f.id === entry.food_id);
      if (food) {
        setEditingFoodData(food);
      }
    } catch (err) {
      console.error('Error fetching food for edit:', err);
    }
    
    // Convert serving_size (multiplier) back to display value
    // If unit is "g", convert multiplier back to grams: multiplier * food.servingSize
    // If unit is "serving", use multiplier directly
    let displaySize = entry.serving_size;
    if (entry.serving_unit === 'g' && foodData?.servingSize) {
      displaySize = entry.serving_size * foodData.servingSize;
    }
    setServingSize(displaySize);
    setServingUnit(entry.serving_unit);
    setSelectedMeal(entry.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack');
    setShowServingDialog(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry) return;

    // Validate serving size
    const numServingSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize;
    if (!numServingSize || numServingSize <= 0) {
      alert('Please enter a valid serving size');
      return;
    }

    try {
      setLoading(true);

      // Convert serving size based on unit
      // Backend expects serving_size as a multiplier
      let multiplier = numServingSize;
      
      if (servingUnit === 'g') {
        // If unit is "g", we need to convert grams to multiplier
        // Get the food's servingSize to do the conversion
        try {
          // Fetch the food to get its servingSize
          const foodsResponse = await apiClient.getFoods({ page: 1, search: editingEntry.food_name });
          const food = foodsResponse.results?.find(f => f.id === editingEntry.food_id);
          
          if (food) {
            // Convert grams to multiplier (e.g., 200g / 100g = 2.0 servings)
            multiplier = numServingSize / food.servingSize;
          }
          // If food not found, use servingSize as-is (fallback)
        } catch (err) {
          console.error('Error fetching food for conversion:', err);
          // If conversion fails, use servingSize as-is (fallback)
        }
      }
      // If unit is "serving", multiplier is already correct (servingSize = number of servings)

      // Round to 6 decimal places for precision (backend now supports up to 6 decimal places)
      multiplier = Math.round(multiplier * 1000000) / 1000000;

      // Validate multiplier doesn't exceed backend max_digits=10, decimal_places=6 (max: 9999.999999)
      if (multiplier > 9999.999999) {
        alert(`Serving size is too large. The maximum allowed multiplier is 9999.999999. Please reduce the amount.`);
        setLoading(false);
        return;
      }

      await apiClient.updateFoodEntry(editingEntry.id, {
        serving_size: multiplier,
        serving_unit: servingUnit,
        meal_type: selectedMeal
      });

      // Refresh daily log and targets to update totals after updating entry
      await fetchData();
      // Notify parent component (Profile) to refresh its nutrition data
      if (onDataChange) {
        onDataChange();
      }
      setShowServingDialog(false);
      setEditingEntry(null);
      setEditingFoodData(null);
    } catch (err: any) {
      console.error('Error updating entry:', err);
      const errorMessage = err?.data?.serving_size?.[0] || 
                          err?.data?.error || 
                          err?.data?.detail || 
                          err?.message || 
                          'Failed to update entry';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      setLoading(true);
      await apiClient.deleteFoodEntry(id);
      // Refresh daily log and targets to update totals
      await fetchData();
      // Notify parent component (Profile) to refresh its nutrition data
      if (onDataChange) {
        onDataChange();
      }
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      const errorMessage = err?.data?.error || err?.data?.detail || err?.message || 'Failed to delete entry';
      alert(errorMessage);
      // Still try to refresh data even if delete failed, in case the entry was partially deleted
      try {
        await fetchData();
      } catch (refreshErr) {
        console.error('Error refreshing data after delete:', refreshErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee size={24} weight="fill" />;
      case 'lunch': return <ForkKnife size={24} weight="fill" />;
      case 'dinner': return <Moon size={24} weight="fill" />;
      case 'snack': return <Cookie size={24} weight="fill" />;
      default: return <Hamburger size={24} weight="fill" />;
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

  const calculateMealTotals = (entries: FoodLogEntry[]) => {
    return {
      calories: entries.reduce((sum, e) => sum + Number(e.calories || 0), 0),
      protein: entries.reduce((sum, e) => sum + Number(e.protein || 0), 0),
      carbs: entries.reduce((sum, e) => sum + Number(e.carbohydrates || 0), 0),
      fat: entries.reduce((sum, e) => sum + Number(e.fat || 0), 0)
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

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'weekly') {
      // In weekly mode, change by 7 days (one week)
      newDate.setDate(newDate.getDate() + (days * 7));
    } else {
      // In daily mode, change by 1 day
      newDate.setDate(newDate.getDate() + days);
    }
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const renderMealSection = (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    entries: FoodLogEntry[]
  ) => {
    const totals = calculateMealTotals(entries);
    const mealColor = getMealColor(mealType);

    return (
      <div className="nh-card" key={mealType}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${mealColor}20`,
                color: mealColor
              }}
            >
              {getMealIcon(mealType)}
            </div>
            <div>
              <h3 className="font-semibold text-lg capitalize">{mealType}</h3>
              <p className="text-xs nh-text opacity-70">
                {Math.round(totals.calories)} kcal • {entries.length} items
              </p>
            </div>
          </div>

          <button
            onClick={() => handleAddFood(mealType)}
            className="nh-button nh-button-primary flex items-center gap-2 whitespace-nowrap"
            style={{ padding: '0.5rem 1rem', display: 'flex' }}
          >
            <Plus size={18} weight="bold" />
            <span>Add Food</span>
          </button>
        </div>

        {/* Food Entries */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all"
                style={{ backgroundColor: 'var(--dietary-option-bg)' }}
              >
                {/* Food Image */}
                {(() => {
                  const foodData = foodCache.get(entry.food_id);
                  const imageUrl = foodData?.imageUrl || entry.image_url;
                  
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={entry.food_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--forum-search-border)' }}
                    >
                      <Hamburger size={28} weight="fill" className="opacity-50" />
                    </div>
                  );
                })()}

                {/* Food Info */}
                <div className="flex-1">
                  <h4 className="font-medium">{entry.food_name}</h4>
                  <p className="text-xs nh-text opacity-70">
                    {(() => {
                      // Convert serving_size (multiplier) back to display value
                      // If unit is "g", convert multiplier back to grams: multiplier * food.servingSize
                      // If unit is "serving", display multiplier directly
                      const servingSizeNum = Number(entry.serving_size);
                      const foodData = foodCache.get(entry.food_id);
                      
                      if (entry.serving_unit === 'g') {
                        if (foodData?.servingSize) {
                          // Multiply multiplier by food's serving size to get grams
                          const grams = servingSizeNum * foodData.servingSize;
                          return `${Math.round(grams)} ${entry.serving_unit}`;
                        } else {
                          // Food data not loaded yet, show multiplier (will update when food data loads)
                          return `${Math.round(servingSizeNum)} ${entry.serving_unit}`;
                        }
                      } else {
                        // For "serving" unit, show multiplier directly
                        return `${servingSizeNum.toFixed(2)} ${entry.serving_unit}${servingSizeNum === 1 ? '' : 's'}`;
                      }
                    })()}
                  </p>
                </div>

                {/* Nutrition Info */}
                <div className="text-right">
                  <p className="font-semibold text-primary">{Math.round(Number(entry.calories))} kcal</p>
                  <p className="text-xs nh-text opacity-70">
                    P: {Number(entry.protein).toFixed(2)}g • C: {Number(entry.carbohydrates).toFixed(2)}g • F: {Number(entry.fat).toFixed(2)}g
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Edit"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditEntry(entry);
                    }}
                  >
                    <PencilSimple size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600"
                    title="Delete"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteEntry(entry.id);
                    }}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 nh-text opacity-50">
            <Hamburger size={48} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No foods logged for {mealType}</p>
          </div>
        )}

        {/* Meal Totals */}
        {entries.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="nh-text opacity-70">Calories</p>
                <p className="font-bold">{Math.round(Number(totals.calories))}</p>
              </div>
              <div>
                <p className="nh-text opacity-70">Protein</p>
                <p className="font-bold">{Number(totals.protein).toFixed(2)}g</p>
              </div>
              <div>
                <p className="nh-text opacity-70">Carbs</p>
                <p className="font-bold">{Number(totals.carbs).toFixed(2)}g</p>
              </div>
              <div>
                <p className="nh-text opacity-70">Fat</p>
                <p className="font-bold">{Number(totals.fat).toFixed(2)}g</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && !todayLog) {
    return <div className="p-8 text-center">Loading nutrition data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (metricsMissing) {
    return (
      <div className="nh-card text-center p-12">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChartLine size={32} className="text-primary" weight="fill" />
        </div>
        <h3 className="nh-subtitle mb-3 text-xl">Setup Nutrition Tracking</h3>
        <p className="nh-text mb-8 max-w-md mx-auto opacity-80">
          To track your nutrition and see personalized targets, we first need to know a bit about you (height, weight, age, etc.).
        </p>
        <Link
          to="/profile"
          className="nh-button nh-button-primary inline-flex items-center gap-2 px-6 py-3 text-base"
        >
          <PencilSimple size={20} weight="bold" />
          Set Up My Metrics
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="nh-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarBlank size={32} weight="fill" className="text-primary" />
            <div>
              <h2 className="nh-subtitle">Nutrition Tracking</h2>
              <p className="text-sm nh-text opacity-70">
                Track your daily food intake and nutrients
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('daily')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: viewMode === 'daily' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: viewMode === 'daily' ? 'white' : 'var(--color-light)'
              }}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: viewMode === 'weekly' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: viewMode === 'weekly' ? 'white' : 'var(--color-light)'
              }}
            >
              Weekly
            </button>
            {/* Reset icon - show if viewing a different day/week than current */}
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (viewMode === 'daily') {
                // Show reset icon if not viewing today
                const selectedDateNormalized = new Date(selectedDate);
                selectedDateNormalized.setHours(0, 0, 0, 0);
                if (selectedDateNormalized.getTime() !== today.getTime()) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-light)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      }}
                      title="Reset to today"
                    >
                      <ArrowClockwise size={20} weight="bold" />
                    </button>
                  );
                }
              } else {
                // Weekly view - show reset icon if not viewing current week
                const getMondayOfWeek = (date: Date) => {
                  const d = new Date(date);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  return new Date(d.setDate(diff));
                };
                
                const selectedMonday = getMondayOfWeek(new Date(selectedDate));
                const todayMonday = getMondayOfWeek(today);
                
                selectedMonday.setHours(0, 0, 0, 0);
                todayMonday.setHours(0, 0, 0, 0);
                
                if (selectedMonday.getTime() !== todayMonday.getTime()) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-light)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      }}
                      title="Reset to current week"
                    >
                      <ArrowClockwise size={20} weight="bold" />
                    </button>
                  );
                }
              }
              return null;
            })()}
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <CaretLeft size={24} weight="bold" />
          </button>

          <div className="text-center flex-1">
            {viewMode === 'daily' ? (
              <>
                <p className="text-xl font-bold text-primary">{formatDate(selectedDate)}</p>
                {isToday && (
                  <span className="text-xs px-2 py-1 rounded mt-1 inline-block" style={{
                    backgroundColor: 'var(--color-success)',
                    color: 'white'
                  }}>
                    Today
                  </span>
                )}
              </>
            ) : (
              <div>
                {(() => {
                  const getMondayOfWeek = (date: Date) => {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                    return new Date(d.setDate(diff));
                  };
                  const monday = getMondayOfWeek(new Date(selectedDate));
                  const sunday = new Date(monday);
                  sunday.setDate(monday.getDate() + 6);
                  return (
                    <div>
                      <p className="text-lg font-bold text-primary">
                        {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday && viewMode === 'daily'}
            className={`p-2 rounded-lg transition-colors ${isToday && viewMode === 'daily'
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </div>
      </div>

      {/* Meals Section (Daily View) */}
      {viewMode === 'daily' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ForkKnife size={28} weight="fill" className="text-primary" />
            <h3 className="nh-subtitle">Today's Meals</h3>
          </div>

          <div className="space-y-4">
            {renderMealSection('breakfast', breakfastEntries)}
            {renderMealSection('lunch', lunchEntries)}
            {renderMealSection('dinner', dinnerEntries)}
            {renderMealSection('snack', snackEntries)}
          </div>
        </div>
      )}

      {/* Weekly Calendar View */}
      {viewMode === 'weekly' && targets && (() => {
        // Generate 7 days from Monday to Sunday for the week containing selectedDate
        const getMondayOfWeek = (date: Date) => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          return new Date(d.setDate(diff));
        };
        
        const monday = getMondayOfWeek(new Date(selectedDate));
        const weekDays: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          weekDays.push(date);
        }

        // Helper function to normalize date strings (YYYY-MM-DD format)
        const normalizeDateStr = (date: Date | string): string => {
          if (typeof date === 'string') {
            // If it's already a string, extract just the date part (YYYY-MM-DD)
            return date.split('T')[0];
          }
          // Convert Date to YYYY-MM-DD string
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Create a map of date strings to logs for quick lookup
        const logMap = new Map<string, DailyNutritionLog>();
        // Ensure historyLogs is an array before iterating
        if (Array.isArray(historyLogs)) {
          historyLogs.forEach(log => {
            if (log.date) {
              const normalizedDate = normalizeDateStr(log.date);
              logMap.set(normalizedDate, log);
            }
          });
        }
        // Also include todayLog if it exists, is actually for today, and is in the current week
        if (todayLog && todayLog.date) {
          const todayLogDateStr = normalizeDateStr(todayLog.date);
          const actualToday = new Date();
          const actualTodayStr = normalizeDateStr(actualToday);
          
          // Only use todayLog if it's actually for today (not selectedDate from daily view)
          if (todayLogDateStr === actualTodayStr) {
            // Check if today is in the current week
            const todayDate = new Date(actualTodayStr);
            const weekStart = new Date(monday);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(monday);
            weekEnd.setDate(monday.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            todayDate.setHours(0, 0, 0, 0);
            if (todayDate >= weekStart && todayDate <= weekEnd) {
              logMap.set(actualTodayStr, todayLog);
            }
          }
        }

        return (
          <div className="nh-card">
            <div className="flex items-center gap-2 mb-6">
              <ChartLine size={28} weight="fill" className="text-primary" />
              <h3 className="nh-subtitle">Weekly Overview</h3>
            </div>

            {/* Calendar Grid - 7 days in 2 rows with equal width cards */}
            <div className="space-y-3">
              {/* First row - 4 days */}
              <div className="grid grid-cols-4 gap-3">
                {weekDays.slice(0, 4).map((date) => {
                const dateStr = normalizeDateStr(date);
                const log = logMap.get(dateStr);
                const isToday = date.toDateString() === new Date().toDateString();
                // Only highlight today in weekly view, not selectedDate
                const isSelected = isToday;
                
                const caloriePercent = log ? Math.round((log.total_calories / targets.calories) * 100) : 0;
                const proteinPercent = log ? Math.round((log.total_protein / targets.protein) * 100) : 0;
                const carbsPercent = log ? Math.round((log.total_carbohydrates / targets.carbohydrates) * 100) : 0;
                const fatPercent = log ? Math.round((log.total_fat / targets.fat) * 100) : 0;

                const getDayName = (date: Date) => {
                  return date.toLocaleDateString('en-US', { weekday: 'short' });
                };

                const getDayNumber = (date: Date) => {
                  return date.getDate();
                };

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(new Date(date));
                      setViewMode('daily');
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary-50 dark:bg-primary-900' 
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{
                      backgroundColor: isSelected 
                        ? 'var(--color-primary)' + '20' 
                        : 'var(--dietary-option-bg)'
                    }}
                  >
                    {/* Day Header */}
                    <div className="text-center mb-3">
                      <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'nh-text opacity-70'}`}>
                        {getDayName(date)}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'nh-text'}`}>
                        {getDayNumber(date)}
                      </p>
                      {isToday && (
                        <span className="text-xs px-1 py-0.5 rounded mt-1 inline-block text-primary" style={{
                          backgroundColor: 'var(--color-primary)' + '20'
                        }}>
                          Today
                        </span>
                      )}
                    </div>

                    {/* Calorie Progress */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs nh-text opacity-70">Cal</span>
                          <span className="text-xs font-semibold" style={{
                            color: caloriePercent > 100 
                              ? 'var(--color-error)' 
                              : caloriePercent >= 90 
                                ? '#f97316' // orange-500
                                : '#f97316' // orange-500
                          }}>
                            {caloriePercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(caloriePercent, 100)}%`,
                              backgroundColor: caloriePercent > 100 
                                ? 'var(--color-error)' 
                                : '#f97316' // orange-500
                            }}
                          />
                        </div>
                      </div>

                      {/* Protein, Carbs, Fat */}
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs nh-text opacity-60">P</span>
                            <span className="text-xs font-semibold">
                              {proteinPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all"
                              style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs nh-text opacity-60">C</span>
                            <span className="text-xs font-semibold">
                              {carbsPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-green-500 h-1 rounded-full transition-all"
                              style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs nh-text opacity-60">F</span>
                            <span className="text-xs font-semibold">
                              {fatPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-yellow-500 h-1 rounded-full transition-all"
                              style={{ width: `${Math.min(fatPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      
                    </div>
                  </div>
                );
                })}
              </div>
              
              {/* Second row - 3 days (centered equally) */}
              <div className="flex justify-center gap-3">
                {weekDays.slice(4, 7).map((date) => {
                  const dateStr = normalizeDateStr(date);
                  const log = logMap.get(dateStr);
                  const isToday = date.toDateString() === new Date().toDateString();
                  // Only highlight today in weekly view, not selectedDate
                  const isSelected = isToday;
                  
                  const caloriePercent = log ? Math.round((log.total_calories / targets.calories) * 100) : 0;
                  const proteinPercent = log ? Math.round((log.total_protein / targets.protein) * 100) : 0;
                  const carbsPercent = log ? Math.round((log.total_carbohydrates / targets.carbohydrates) * 100) : 0;
                  const fatPercent = log ? Math.round((log.total_fat / targets.fat) * 100) : 0;

                  const getDayName = (date: Date) => {
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  };

                  const getDayNumber = (date: Date) => {
                    return date.getDate();
                  };

                  return (
                    <div
                      key={dateStr}
                      className={`w-[calc((100%-0.75rem*3)/4)] p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? 'border-primary bg-primary-50 dark:bg-primary-900' 
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      style={{
                        backgroundColor: isSelected 
                          ? 'var(--color-primary)' + '20' 
                          : 'var(--dietary-option-bg)'
                      }}
                      onClick={() => {
                        setSelectedDate(new Date(date));
                        setViewMode('daily');
                      }}
                    >
                      {/* Day Header */}
                      <div className="text-center mb-3">
                        <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary font-bold' : 'nh-text opacity-70'}`}>
                          {getDayName(date)}
                        </p>
                        <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'nh-text'}`}>
                          {getDayNumber(date)}
                        </p>
                        {isToday && (
                          <span className="text-xs px-1 py-0.5 rounded mt-1 inline-block text-primary" style={{
                            backgroundColor: 'var(--color-primary)' + '20'
                          }}>
                            Today
                          </span>
                        )}
                      </div>

                      {/* Calorie Progress */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs nh-text opacity-70">Cal</span>
                            <span className="text-xs font-semibold" style={{
                              color: caloriePercent > 100 
                                ? 'var(--color-error)' 
                                : caloriePercent >= 90 
                                  ? '#f97316' // orange-500
                                  : '#f97316' // orange-500
                            }}>
                              {caloriePercent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(caloriePercent, 100)}%`,
                                backgroundColor: caloriePercent > 100 
                                  ? 'var(--color-error)' 
                                  : '#f97316' // orange-500
                              }}
                            />
                          </div>
                       
                        </div>

                        {/* Protein, Carbs, Fat */}
                        <div className="space-y-1.5">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs nh-text opacity-60">P</span>
                              <span className="text-xs font-semibold">
                                {proteinPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all"
                                style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs nh-text opacity-60">C</span>
                              <span className="text-xs font-semibold">
                                {carbsPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-green-500 h-1 rounded-full transition-all"
                                style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs nh-text opacity-60">F</span>
                              <span className="text-xs font-semibold">
                                {fatPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-yellow-500 h-1 rounded-full transition-all"
                                style={{ width: `${Math.min(fatPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Food Modal */}
      {showAddFood && (
        <FoodSelector
          open={showAddFood}
          onClose={() => setShowAddFood(false)}
          onSelect={handleFoodSelect}
        />
      )}

      {/* Serving Size Dialog */}
      <Dialog open={showServingDialog} onClose={() => {
        setShowServingDialog(false);
        setSelectedFood(null);
        setEditingEntry(null);
        setEditingFoodData(null);
      }} className="relative z-50">
        <div 
          className="fixed inset-0" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          aria-hidden="true" 
        />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel 
            className="mx-auto max-w-md w-full rounded-xl shadow-lg p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--dietary-option-border)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="nh-subtitle">
                {editingEntry ? 'Edit Food Entry' : 'Set Serving Size'}
              </Dialog.Title>
              <button 
                onClick={() => {
                  setShowServingDialog(false);
                  setSelectedFood(null);
                  setEditingEntry(null);
                }}
                className="p-1 rounded-full transition-all"
                style={{
                  color: 'var(--color-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={24} />
              </button>
            </div>

            {selectedFood && !editingEntry && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  {selectedFood.imageUrl ? (
                    <img
                      src={selectedFood.imageUrl}
                      alt={selectedFood.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--forum-search-border)' }}
                    >
                      <Hamburger size={20} weight="fill" className="opacity-50" />
                    </div>
                  )}
                  <div>
                    <p className="nh-text font-medium">{selectedFood.name}</p>
                    <p className="text-xs nh-text opacity-70">
                      {selectedFood.caloriesPerServing} kcal per {selectedFood.servingSize}g
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editingEntry && (
              <div className="mb-4">
                <p className="nh-text font-medium">{editingEntry.food_name}</p>
              </div>
            )}

            {/* Meal Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Meal Type</label>
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
                className="w-full px-4 py-2 rounded-lg border focus:ring-primary focus:border-primary"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--dietary-option-border)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Serving Size Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Serving Size</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={servingSize === '' ? '' : servingSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string for clearing the input
                    if (value === '') {
                      setServingSize('');
                    } else {
                      const numValue = Number(value);
                      // Only update if it's a valid number and >= 0
                      if (!isNaN(numValue) && numValue >= 0) {
                        setServingSize(numValue);
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border focus:ring-primary focus:border-primary"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--dietary-option-border)',
                    color: 'var(--color-text)'
                  }}
                  min="0"
                />
                <select
                  value={servingUnit}
                  onChange={async (e) => {
                    const newUnit = e.target.value;
                    const oldUnit = servingUnit;
                    const currentSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize;
                    
                    if (editingEntry) {
                      // When editing, convert the current serving size based on unit change
                      // Get food data for servingSize
                      let foodServingSize = 100; // default fallback
                      const foodData = foodCache.get(editingEntry.food_id);
                      if (foodData?.servingSize) {
                        foodServingSize = foodData.servingSize;
                      } else {
                        // Try to fetch if not in cache
                        const fetchedFoodData = await fetchFoodData(editingEntry.food_id, editingEntry.food_name);
                        if (fetchedFoodData?.servingSize) {
                          foodServingSize = fetchedFoodData.servingSize;
                        }
                      }
                      
                      if (oldUnit === 'g' && newUnit === 'serving') {
                        // Convert grams to servings: currentGrams / servingSize
                        setServingSize(currentSize / foodServingSize);
                      } else if (oldUnit === 'serving' && newUnit === 'g') {
                        // Convert servings to grams: currentServings * servingSize
                        setServingSize(currentSize * foodServingSize);
                      }
                    } else if (selectedFood) {
                      // When adding new entry
                      if (oldUnit === 'g' && newUnit === 'serving') {
                        setServingSize(1);
                      } else if (oldUnit === 'serving' && newUnit === 'g') {
                        setServingSize(selectedFood.servingSize);
                      }
                    }
                    
                    setServingUnit(newUnit);
                  }}
                  className="px-4 py-2 rounded-lg border focus:ring-primary focus:border-primary"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--dietary-option-border)',
                    color: 'var(--color-text)'
                  }}
                >
                  <option value="g">grams (g)</option>
                  <option value="serving">serving</option>
                </select>
              </div>
            </div>

            {/* Calculated Nutrition (for edit entries) */}
            {editingEntry && editingFoodData && (() => {
              const numServingSize = typeof servingSize === 'string' ? (servingSize === '' ? 0 : Number(servingSize)) : servingSize;
              const calculateNutrition = (valuePerServing: number) => {
                if (numServingSize <= 0 || isNaN(numServingSize)) {
                  return 0;
                }
                if (servingUnit === 'serving') {
                  // If serving unit, multiply directly (e.g., 2 servings = 2 * valuePerServing)
                  return valuePerServing * numServingSize;
                } else {
                  // If gram unit, convert: (value per servingSize grams / servingSize) * entered grams
                  return (valuePerServing / editingFoodData.servingSize) * numServingSize;
                }
              };

              // Calculate total grams
              const totalGrams = servingUnit === 'g' 
                ? numServingSize 
                : numServingSize * editingFoodData.servingSize;

              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-2">{Math.round(totalGrams)}g of {editingEntry.food_name}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center">
                    <div>
                      <p className="nh-text opacity-70">Calories</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(editingFoodData.caloriesPerServing))}
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Protein</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(editingFoodData.proteinContent))}g
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Carbs</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(editingFoodData.carbohydrateContent))}g
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Fat</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(editingFoodData.fatContent))}g
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Calculated Nutrition (for new entries) */}
            {selectedFood && !editingEntry && (() => {
              // Calculate nutrition based on unit type
              // Food data shows nutrition for 1 serving (which equals food.servingSize grams)
              // If unit is "serving": nutrition = valuePerServing * servingSize (e.g., 2 servings = 2 * value)
              // If unit is "g": nutrition = (valuePerServing / food.servingSize) * enteredGrams
              const numServingSize = typeof servingSize === 'string' ? (servingSize === '' ? 0 : Number(servingSize)) : servingSize;
              const calculateNutrition = (valuePerServing: number) => {
                if (numServingSize <= 0 || isNaN(numServingSize)) {
                  return 0;
                }
                if (servingUnit === 'serving') {
                  // If serving unit, multiply directly (e.g., 2 servings = 2 * valuePerServing)
                  return valuePerServing * numServingSize;
                } else {
                  // If gram unit, convert: (value per servingSize grams / servingSize) * entered grams
                  // This gives us the nutrition for the entered grams
                  return (valuePerServing / selectedFood.servingSize) * numServingSize;
                }
              };

              // Calculate total grams
              const totalGrams = servingUnit === 'g' 
                ? numServingSize 
                : numServingSize * selectedFood.servingSize;

              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-2">{Math.round(totalGrams)}g of {selectedFood.name}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center">
                    <div>
                      <p className="nh-text opacity-70">Calories</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(selectedFood.caloriesPerServing))}
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Protein</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(selectedFood.proteinContent))}g
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Carbs</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(selectedFood.carbohydrateContent))}g
                      </p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Fat</p>
                      <p className="font-semibold">
                        {Math.round(calculateNutrition(selectedFood.fatContent))}g
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowServingDialog(false);
                  setSelectedFood(null);
                  setEditingEntry(null);
                  setEditingFoodData(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'var(--dietary-option-border)',
                  color: 'var(--color-text)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingEntry ? handleUpdateEntry : handleConfirmServing}
                className="flex-1 nh-button nh-button-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingEntry ? 'Update' : 'Add to Log'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default NutritionTracking;


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
  X
} from '@phosphor-icons/react';
import { Dialog } from '@headlessui/react';
import FoodSelector from './FoodSelector';
import { apiClient, Food } from '../lib/apiClient';
import { DailyNutritionLog, NutritionTargets, FoodLogEntry } from '../types/nutrition';

interface NutritionTrackingProps {
  onDateChange?: (date: Date) => void;
}

const NutritionTracking = ({ onDateChange }: NutritionTrackingProps = {}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showServingDialog, setShowServingDialog] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingSize, setServingSize] = useState<number | string>(100);
  const [servingUnit, setServingUnit] = useState('g');
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
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
  }, [selectedDate]);

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
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Fetch daily log
      const log = await apiClient.getDailyLog(dateStr);
      setTodayLog(log);

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

      // Fetch targets if not already loaded (or refresh them)
      const targetsData = await apiClient.getNutritionTargets();
      setTargets(targetsData);

      // Fetch history if in weekly view
      if (viewMode === 'weekly') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const history = await apiClient.getDailyLogHistory(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        setHistoryLogs(history);
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

      await apiClient.addFoodEntry({
        food_id: selectedFood.id,
        serving_size: multiplier,
        serving_unit: servingUnit,
        meal_type: selectedMeal,
        date: dateStr
      });

      // Refresh data
      await fetchData();
      setShowServingDialog(false);
      setSelectedFood(null);
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food entry');
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

      await apiClient.updateFoodEntry(editingEntry.id, {
        serving_size: multiplier,
        meal_type: selectedMeal
      });

      // Refresh data
      await fetchData();
      setShowServingDialog(false);
      setEditingEntry(null);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await apiClient.deleteFoodEntry(id);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      const errorMessage = err?.data?.error || err?.data?.detail || err?.message || 'Failed to delete entry';
      alert(errorMessage);
      // Don't navigate or redirect - stay on current page
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
    newDate.setDate(newDate.getDate() + days);
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
                          return `${grams.toFixed(2)} ${entry.serving_unit}`;
                        } else {
                          // Food data not loaded yet, show multiplier (will update when food data loads)
                          return `${servingSizeNum.toFixed(2)} ${entry.serving_unit}`;
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'daily'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'weekly'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
                }`}
            >
              Weekly
            </button>
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

          <div className="text-center">
            <p className="text-xl font-bold text-primary">{formatDate(selectedDate)}</p>
            {isToday && (
              <span className="text-xs px-2 py-1 rounded mt-1 inline-block" style={{
                backgroundColor: 'var(--color-success)',
                color: 'white'
              }}>
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors ${isToday
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </div>
      </div>

      {/* Meals Section */}
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

      {/* Weekly Summary (if weekly view is selected) */}
      {viewMode === 'weekly' && targets && (
        <div className="nh-card">
          <div className="flex items-center gap-2 mb-6">
            <ChartLine size={28} weight="fill" className="text-primary" />
            <h3 className="nh-subtitle">Weekly Summary</h3>
          </div>

          <div className="space-y-4">
            {historyLogs.map((log) => {
              const date = new Date(log.date);
              const caloriePercent = Math.round((log.total_calories / targets.calories) * 100);

              return (
                <div
                  key={log.date}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs nh-text opacity-70">
                        {log.total_calories} / {targets.calories} kcal
                      </p>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: caloriePercent > 100 ? 'var(--color-error)' : caloriePercent >= 90 ? 'var(--color-success)' : 'var(--color-warning)'
                      }}
                    >
                      {caloriePercent}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(caloriePercent, 100)}%`,
                        backgroundColor: caloriePercent > 100 ? 'var(--color-error)' : 'var(--color-success)'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center">
                    <div>
                      <p className="nh-text opacity-70">Protein</p>
                      <p className="font-semibold">{log.total_protein}g</p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Carbs</p>
                      <p className="font-semibold">{log.total_carbohydrates}g</p>
                    </div>
                    <div>
                      <p className="nh-text opacity-70">Fat</p>
                      <p className="font-semibold">{log.total_fat}g</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <p className="nh-text font-medium">{selectedFood.name}</p>
                <p className="text-xs nh-text opacity-70">
                  {selectedFood.caloriesPerServing} kcal per {selectedFood.servingSize}g
                </p>
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
                  onChange={(e) => {
                    const newUnit = e.target.value;
                    const oldUnit = servingUnit;
                    
                    // When switching from grams to serving, set serving size to 1
                    if (oldUnit === 'g' && newUnit === 'serving') {
                      setServingSize(1);
                    }
                    // When switching from serving to grams, set serving size to food's servingSize
                    else if (oldUnit === 'serving' && newUnit === 'g' && selectedFood) {
                      setServingSize(selectedFood.servingSize);
                    }
                    
                    setServingUnit(newUnit);
                  }}
                  className="px-4 py-2 rounded-lg border focus:ring-primary focus:border-primary"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--dietary-option-border)',
                    color: 'var(--color-text)'
                  }}
                  disabled={editingEntry !== null}
                >
                  <option value="g">grams (g)</option>
                  <option value="serving">serving</option>
                </select>
              </div>
            </div>

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

              return (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-2">Estimated Nutrition:</p>
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


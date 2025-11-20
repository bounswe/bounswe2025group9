import { useState } from 'react';
import { 
  CalendarBlank, 
  Plus, 
  ForkKnife, 
  Coffee, 
  Hamburger,
  Moon,
  Cookie,
  Trash,
  PencilSimple,
  ChartLine,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import MacronutrientCard from './MacronutrientCard';
import MicronutrientPanel from './MicronutrientPanel';
import { mockTodayLog, mockNutritionTargets, mockHistoricalLogs } from '../lib/mockNutritionData';
import { FoodLogEntry } from '../types/nutrition';

const NutritionTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Mock data
  const todayLog = mockTodayLog;
  const targets = mockNutritionTargets;

  // Group entries by meal type
  const breakfastEntries = todayLog.entries.filter(e => e.meal_type === 'breakfast');
  const lunchEntries = todayLog.entries.filter(e => e.meal_type === 'lunch');
  const dinnerEntries = todayLog.entries.filter(e => e.meal_type === 'dinner');
  const snackEntries = todayLog.entries.filter(e => e.meal_type === 'snack');

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
                {totals.calories} kcal • {entries.length} items
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedMeal(mealType);
              setShowAddFood(true);
            }}
            className="nh-button nh-button-primary flex items-center gap-2"
            style={{ padding: '0.5rem 1rem' }}
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
                {entry.image_url ? (
                  <img
                    src={entry.image_url}
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
                )}

                {/* Food Info */}
                <div className="flex-1">
                  <h4 className="font-medium">{entry.food_name}</h4>
                  <p className="text-xs nh-text opacity-70">
                    {entry.serving_size} {entry.serving_unit}
                  </p>
                </div>

                {/* Nutrition Info */}
                <div className="text-right">
                  <p className="font-semibold text-primary">{entry.calories} kcal</p>
                  <p className="text-xs nh-text opacity-70">
                    P: {entry.protein}g • C: {entry.carbohydrates}g • F: {entry.fat}g
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <PencilSimple size={18} />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600"
                    title="Delete"
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
          <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-2 text-center text-sm" style={{ borderColor: 'var(--forum-search-border)' }}>
            <div>
              <p className="nh-text opacity-70 text-xs">Calories</p>
              <p className="font-semibold text-primary">{totals.calories}</p>
            </div>
            <div>
              <p className="nh-text opacity-70 text-xs">Protein</p>
              <p className="font-semibold text-primary">{totals.protein}g</p>
            </div>
            <div>
              <p className="nh-text opacity-70 text-xs">Carbs</p>
              <p className="font-semibold text-primary">{totals.carbs}g</p>
            </div>
            <div>
              <p className="nh-text opacity-70 text-xs">Fat</p>
              <p className="font-semibold text-primary">{totals.fat}g</p>
            </div>
          </div>
        )}
      </div>
    );
  };

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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'daily' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'weekly' 
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
            className={`p-2 rounded-lg transition-colors ${
              isToday 
                ? 'opacity-30 cursor-not-allowed' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </div>
      </div>

      {/* Macronutrients Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MacronutrientCard
          name="Calories"
          current={todayLog.total_calories}
          target={targets.calories}
          unit=""
          color="#f97316"
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

      {/* Micronutrients Section */}
      <MicronutrientPanel micronutrients={todayLog.micronutrients} />

      {/* Weekly Summary (if weekly view is selected) */}
      {viewMode === 'weekly' && (
        <div className="nh-card">
          <div className="flex items-center gap-2 mb-6">
            <ChartLine size={28} weight="fill" className="text-primary" />
            <h3 className="nh-subtitle">Weekly Summary</h3>
          </div>
          
          <div className="space-y-4">
            {[...mockHistoricalLogs, todayLog].reverse().map((log) => {
              const date = new Date(log.date);
              const caloriePercent = Math.round((log.total_calories / targets.calories) * 100);
              
              return (
                <div 
                  key={log.id} 
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

      {/* Add Food Modal Placeholder */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="nh-subtitle mb-4">Add Food to {selectedMeal}</h3>
            <p className="nh-text mb-4">
              This would open a food search/selector interface.
              Integration with backend food database needed.
            </p>
            <button
              onClick={() => setShowAddFood(false)}
              className="nh-button nh-button-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionTracking;


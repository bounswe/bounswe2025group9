import { ChartLineUp, Flame, TrendUp } from '@phosphor-icons/react';
import { mockTodayLog, mockNutritionTargets } from '../lib/mockNutritionData';

interface NutritionSummaryProps {
  compact?: boolean;
}

const NutritionSummary = ({ compact = false }: NutritionSummaryProps) => {
  const todayLog = mockTodayLog;
  const targets = mockNutritionTargets;

  const caloriesPercent = Math.round((todayLog.total_calories / targets.calories) * 100);
  const proteinPercent = Math.round((todayLog.total_protein / targets.protein) * 100);
  const carbsPercent = Math.round((todayLog.total_carbohydrates / targets.carbohydrates) * 100);
  const fatPercent = Math.round((todayLog.total_fat / targets.fat) * 100);

  if (compact) {
    return (
      <div className="nh-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Today's Nutrition</h3>
          <ChartLineUp size={24} weight="fill" className="text-primary" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Calories */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Flame size={18} weight="fill" className="text-orange-500" />
              <span className="text-sm font-medium">Calories</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{todayLog.total_calories}</span>
              <span className="text-sm nh-text opacity-70">/ {targets.calories}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(caloriesPercent, 100)}%`,
                  backgroundColor: caloriesPercent > 100 ? 'var(--color-error)' : 'var(--color-primary)'
                }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendUp size={18} weight="fill" className="text-blue-500" />
              <span className="text-sm font-medium">Protein</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{todayLog.total_protein}g</span>
              <span className="text-sm nh-text opacity-70">/ {targets.protein}g</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(proteinPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Carbs</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{todayLog.total_carbohydrates}g</span>
              <span className="text-xs nh-text opacity-70">/ {targets.carbohydrates}g</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(carbsPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Fat</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{todayLog.total_fat}g</span>
              <span className="text-xs nh-text opacity-70">/ {targets.fat}g</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(fatPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
          <p className="text-xs nh-text opacity-70 text-center">
            {todayLog.entries.length} food items logged today
          </p>
        </div>
      </div>
    );
  }

  // Full version (not compact)
  return (
    <div className="nh-card">
      <h3 className="nh-subtitle mb-6">Today's Nutrition Summary</h3>
      
      {/* Macronutrients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Calories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={24} weight="fill" className="text-orange-500" />
              <span className="font-semibold">Calories</span>
            </div>
            <span className="text-sm font-medium" style={{
              color: caloriesPercent > 100 ? 'var(--color-error)' : 'var(--color-success)'
            }}>
              {caloriesPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{todayLog.total_calories}</span>
            <span className="text-lg nh-text opacity-70">/ {targets.calories} kcal</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all"
              style={{
                width: `${Math.min(caloriesPercent, 100)}%`,
                backgroundColor: caloriesPercent > 100 ? 'var(--color-error)' : '#f97316'
              }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">P</span>
              </div>
              <span className="font-semibold">Protein</span>
            </div>
            <span className="text-sm font-medium" style={{
              color: proteinPercent >= 90 ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {proteinPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{todayLog.total_protein}g</span>
            <span className="text-lg nh-text opacity-70">/ {targets.protein}g</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(proteinPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-green-100 dark:bg-green-900">
                <span className="text-xs font-bold text-green-600 dark:text-green-300">C</span>
              </div>
              <span className="font-semibold">Carbohydrates</span>
            </div>
            <span className="text-sm font-medium" style={{
              color: carbsPercent >= 90 ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {carbsPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{todayLog.total_carbohydrates}g</span>
            <span className="text-lg nh-text opacity-70">/ {targets.carbohydrates}g</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(carbsPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-yellow-100 dark:bg-yellow-900">
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-300">F</span>
              </div>
              <span className="font-semibold">Fat</span>
            </div>
            <span className="text-sm font-medium" style={{
              color: fatPercent >= 90 ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {fatPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{todayLog.total_fat}g</span>
            <span className="text-lg nh-text opacity-70">/ {targets.fat}g</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-yellow-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(fatPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meals Summary */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm nh-text opacity-70">
            {todayLog.entries.length} items logged across {new Set(todayLog.entries.map(e => e.meal_type)).size} meals
          </span>
          <span className="text-sm font-medium text-primary">View Details →</span>
        </div>
      </div>
    </div>
  );
};

export default NutritionSummary;


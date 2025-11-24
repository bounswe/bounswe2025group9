import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChartLineUp, Flame, TrendUp, Cookie, Drop } from '@phosphor-icons/react';
import { apiClient } from '../lib/apiClient';
import { DailyNutritionLog, NutritionTargets } from '../types/nutrition';

interface NutritionSummaryProps {
  compact?: boolean;
  onNavigateToNutrition?: () => void;
}

const NutritionSummary = ({ compact = false, onNavigateToNutrition }: NutritionSummaryProps) => {
  const [todayLog, setTodayLog] = useState<DailyNutritionLog | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsMissing, setMetricsMissing] = useState(false);

  // Helper function to format date as YYYY-MM-DD in local timezone (not UTC)
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight local time
        const dateStr = formatDateString(today);
        const [log, targetsData] = await Promise.all([
          apiClient.getDailyLog(dateStr),
          apiClient.getNutritionTargets()
        ]);
        setTodayLog(log);
        setTargets(targetsData);
      } catch (err: any) {
        console.error('Error fetching nutrition summary:', err);
        if (err.status === 404 && err.data?.detail === "No nutrition targets or metrics found. Please set your metrics first.") {
          setMetricsMissing(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="nh-card animate-pulse">
        <div 
          className="h-6 rounded w-1/3 mb-4"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        ></div>
        <div className="space-y-3">
          <div 
            className="h-4 rounded w-full"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          ></div>
          <div 
            className="h-4 rounded w-full"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          ></div>
          <div 
            className="h-4 rounded w-full"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          ></div>
        </div>
      </div>
    );
  }

  if (metricsMissing) {
    if (compact) {
      return (
        <div className="nh-card flex flex-col items-center justify-center p-6 text-center">
          <ChartLineUp size={32} className="text-primary mb-2" weight="fill" />
          <p className="text-sm font-medium mb-3">Setup Nutrition</p>
          {onNavigateToNutrition ? (
            <button 
              onClick={onNavigateToNutrition}
              className="text-xs text-primary hover:underline"
            >
              Set Metrics →
            </button>
          ) : (
            <Link to="/profile?tab=nutrition" className="text-xs text-primary hover:underline">Set Metrics →</Link>
          )}
        </div>
      );
    }
    return (
      <div className="nh-card text-center p-8">
        <h3 className="nh-subtitle mb-4">Nutrition Summary</h3>
        <p className="nh-text mb-4 text-sm">Set up your metrics to see your daily nutrition summary.</p>
        {onNavigateToNutrition ? (
          <button 
            onClick={onNavigateToNutrition}
            className="nh-button nh-button-primary text-sm"
          >
            Set Up Metrics
          </button>
        ) : (
          <Link to="/profile?tab=nutrition" className="nh-button nh-button-primary text-sm">Set Up Metrics</Link>
        )}
      </div>
    );
  }

  if (!todayLog || !targets) {
    return null;
  }

  const caloriesPercent = Math.round((todayLog.total_calories / targets.calories) * 100);
  const proteinPercent = Math.round((todayLog.total_protein / targets.protein) * 100);
  const carbsPercent = Math.round((todayLog.total_carbohydrates / targets.carbohydrates) * 100);
  const fatPercent = Math.round((todayLog.total_fat / targets.fat) * 100);

  if (compact) {
    const cardContent = (
      <div className="nh-card hover:shadow-lg transition-shadow cursor-pointer">
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
            <div 
              className="w-full rounded-full h-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(caloriesPercent, 100)}%`
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
            <div 
              className="w-full rounded-full h-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(proteinPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cookie size={18} weight="fill" className="text-green-500" />
              <span className="text-sm font-medium">Carbs</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{todayLog.total_carbohydrates}g</span>
              <span className="text-xs nh-text opacity-70">/ {targets.carbohydrates}g</span>
            </div>
            <div 
              className="w-full rounded-full h-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(carbsPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Drop size={18} weight="fill" className="text-yellow-500" />
              <span className="text-sm font-medium">Fat</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">{todayLog.total_fat}g</span>
              <span className="text-xs nh-text opacity-70">/ {targets.fat}g</span>
            </div>
            <div 
              className="w-full rounded-full h-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(fatPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-center nh-text opacity-70">
          Click to view details →
        </div>
      </div>
    );

    if (onNavigateToNutrition) {
      return (
        <div onClick={onNavigateToNutrition} className="block">
          {cardContent}
        </div>
      );
    } else {
      return (
        <Link to="/profile?tab=nutrition" className="block">
          {cardContent}
        </Link>
      );
    }
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
          <div 
            className="w-full rounded-full h-3"
            style={{
              backgroundColor: 'var(--color-bg-secondary)'
            }}
          >
            <div
              className="bg-orange-500 h-3 rounded-full transition-all"
              style={{
                width: `${Math.min(caloriesPercent, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <span 
                  className="text-xs font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >P</span>
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
          <div 
            className="w-full rounded-full h-3"
            style={{
              backgroundColor: 'var(--color-bg-secondary)'
            }}
          >
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
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <span 
                  className="text-xs font-bold"
                  style={{ color: 'var(--color-success)' }}
                >C</span>
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
          <div 
            className="w-full rounded-full h-3"
            style={{
              backgroundColor: 'var(--color-bg-secondary)'
            }}
          >
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
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <span 
                  className="text-xs font-bold"
                  style={{ color: 'var(--color-warning)' }}
                >F</span>
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
          <div 
            className="w-full rounded-full h-3"
            style={{
              backgroundColor: 'var(--color-bg-secondary)'
            }}
          >
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
            {todayLog.entries?.length || 0} items logged across {new Set(todayLog.entries?.map(e => e.meal_type) || []).size} meals
          </span>
          <span className="text-sm font-medium text-primary">View Details →</span>
        </div>
      </div>
    </div>
  );
};

export default NutritionSummary;


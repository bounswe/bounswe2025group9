import { useState, useEffect } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { apiClient } from '../lib/apiClient';
import { DailyNutritionLog, NutritionTargets } from '../types/nutrition';

const DailyTargets = () => {
  const [todayLog, setTodayLog] = useState<DailyNutritionLog | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsMissing, setMetricsMissing] = useState(false);
  const [showVitamins, setShowVitamins] = useState(false);
  const [showMinerals, setShowMinerals] = useState(false);

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
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight local time
        const dateStr = formatDateString(today);
        const [log, targetsData] = await Promise.all([
          apiClient.getDailyLog(dateStr),
          apiClient.getNutritionTargets()
        ]);
        setTodayLog(log);
        setTargets(targetsData);
        setMetricsMissing(false);
      } catch (err: any) {
        console.error('Error fetching daily targets:', err);
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
      <div className="nh-card rounded-lg shadow-md animate-pulse">
        <div className="h-5 w-24 rounded mb-3" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}></div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
              <div className="h-4 w-full rounded mb-1" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}></div>
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (metricsMissing || !todayLog || !targets) {
    return (
      <div className="nh-card rounded-lg shadow-md text-center p-4">
        <p className="text-xs nh-text opacity-70">Setup nutrition tracking to see daily targets</p>
      </div>
    );
  }

  const caloriesPercent = Math.min(
    ((todayLog.total_calories || 0) / (targets.calories || 1)) * 100,
    100
  );
  const proteinPercent = Math.min(
    ((todayLog.total_protein || 0) / (targets.protein || 1)) * 100,
    100
  );
  const carbsPercent = Math.min(
    ((todayLog.total_carbohydrates || 0) / (targets.carbohydrates || 1)) * 100,
    100
  );
  const fatPercent = Math.min(
    ((todayLog.total_fat || 0) / (targets.fat || 1)) * 100,
    100
  );

  return (
    <div className="nh-card rounded-lg shadow-md">
      <h3 className="nh-subtitle mb-3 text-sm">Daily Targets</h3>
      <div className="space-y-2">
        {/* Calories */}
        <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Calories</span>
            <span className="text-xs font-bold text-orange-600">
              {Math.round(todayLog.total_calories || 0)} / {targets.calories || 0}
            </span>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${caloriesPercent}%`
              }}
            ></div>
          </div>
        </div>

        {/* Protein */}
        <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Protein</span>
            <span className="text-xs font-bold text-blue-600">
              {Math.round(todayLog.total_protein || 0)}g / {targets.protein || 0}g
            </span>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${proteinPercent}%`
              }}
            ></div>
          </div>
        </div>

        {/* Carbs */}
        <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Carbs</span>
            <span className="text-xs font-bold text-green-600">
              {Math.round(todayLog.total_carbohydrates || 0)}g / {targets.carbohydrates || 0}g
            </span>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${carbsPercent}%`
              }}
            ></div>
          </div>
        </div>

        {/* Fat */}
        <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Fat</span>
            <span className="text-xs font-bold text-yellow-600">
              {Math.round(todayLog.total_fat || 0)}g / {targets.fat || 0}g
            </span>
          </div>
          <div 
            className="w-full rounded-full h-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${fatPercent}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Micronutrients Section */}
      {targets?.micronutrients && Object.keys(targets.micronutrients).length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
          {/* Helper functions to categorize and format micronutrients */}
          {(() => {
            // Get all micronutrients from targets
            const targetMicronutrients = targets.micronutrients || {};
            // Get current values from log (if available)
            const logMicronutrients = todayLog?.micronutrients_summary || {};
            
            // Extract unit from key name (e.g., "Vitamin A, RAE (µg)" -> "µg")
            const extractUnit = (key: string): string => {
              const match = key.match(/\(([^)]+)\)$/);
              return match ? match[1] : '';
            };
            
            // Extract name without unit (e.g., "Vitamin A, RAE (µg)" -> "Vitamin A, RAE")
            const extractName = (key: string): string => {
              return key.replace(/\s*\([^)]+\)$/, '');
            };
            
            // Categorize micronutrients
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
            
            // Get all vitamins from targets
            const vitamins = Object.entries(targetMicronutrients)
              .filter(([name]) => isVitamin(name))
              .sort(([a], [b]) => a.localeCompare(b));
            
            // Get all minerals from targets
            const minerals = Object.entries(targetMicronutrients)
              .filter(([name]) => isMineral(name))
              .sort(([a], [b]) => a.localeCompare(b));
            
            return (
              <>
                {/* Vitamins */}
                {vitamins.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={() => setShowVitamins(!showVitamins)}
                      className="w-full flex items-center justify-between p-2 rounded transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-xs font-semibold">Vitamins</span>
                      {showVitamins ? <CaretDown size={14} /> : <CaretRight size={14} />}
                    </button>
                    {showVitamins && (
                      <div className="mt-2 space-y-1.5 pl-2">
                        {vitamins.map(([key, target]) => {
                          const name = extractName(key);
                          const unit = extractUnit(key);
                          // Get current value from log (if available), otherwise 0
                          const currentValue = typeof logMicronutrients[key] === 'number' 
                            ? logMicronutrients[key] 
                            : 0;
                          // Get target value
                          let targetValue = 0;
                          if (typeof target === 'number') {
                            targetValue = target;
                          } else if (target && typeof target === 'object' && 'target' in target) {
                            targetValue = (target as { target: number }).target;
                          }
                          
                          return (
                            <div key={key} className="p-2 rounded text-xs" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="capitalize">{name}</span>
                                <span className="font-medium">
                                  {currentValue.toFixed(1)}{unit ? ` ${unit}` : ''} 
                                  {targetValue > 0 ? ` / ${targetValue.toFixed(1)}${unit ? ` ${unit}` : ''}` : ''}
                                </span>
                              </div>
                              {targetValue > 0 && (
                                <div 
                                  className="w-full rounded-full h-1"
                                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                                >
                                  <div
                                    className="bg-purple-500 h-1 rounded-full transition-all"
                                    style={{ width: `${Math.min((currentValue / targetValue) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Minerals */}
                {minerals.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowMinerals(!showMinerals)}
                      className="w-full flex items-center justify-between p-2 rounded transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-xs font-semibold">Minerals</span>
                      {showMinerals ? <CaretDown size={14} /> : <CaretRight size={14} />}
                    </button>
                    {showMinerals && (
                      <div className="mt-2 space-y-1.5 pl-2">
                        {minerals.map(([key, target]) => {
                          const name = extractName(key);
                          const unit = extractUnit(key);
                          // Get current value from log (if available), otherwise 0
                          const currentValue = typeof logMicronutrients[key] === 'number' 
                            ? logMicronutrients[key] 
                            : 0;
                          // Get target value
                          let targetValue = 0;
                          if (typeof target === 'number') {
                            targetValue = target;
                          } else if (target && typeof target === 'object' && 'target' in target) {
                            targetValue = (target as { target: number }).target;
                          }
                          
                          return (
                            <div key={key} className="p-2 rounded text-xs" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="capitalize">{name}</span>
                                <span className="font-medium">
                                  {currentValue.toFixed(1)}{unit ? ` ${unit}` : ''} 
                                  {targetValue > 0 ? ` / ${targetValue.toFixed(1)}${unit ? ` ${unit}` : ''}` : ''}
                                </span>
                              </div>
                              {targetValue > 0 && (
                                <div 
                                  className="w-full rounded-full h-1"
                                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                                >
                                  <div
                                    className="bg-teal-500 h-1 rounded-full transition-all"
                                    style={{ width: `${Math.min((currentValue / targetValue) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DailyTargets;


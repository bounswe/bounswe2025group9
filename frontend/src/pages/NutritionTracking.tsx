import { useState, useEffect, useCallback } from 'react'
import { CaretDown, CaretRight, Lightbulb, Info } from '@phosphor-icons/react'
import NutritionTracking from '../components/NutritionTracking'
import { apiClient } from '../lib/apiClient'
import { DailyNutritionLog, NutritionTargets } from '../types/nutrition'

const NutritionTrackingPage = () => {
  const [nutritionData, setNutritionData] = useState<{
    todayLog: DailyNutritionLog | null;
    targets: NutritionTargets | null;
  }>({ todayLog: null, targets: null })
  const [showVitamins, setShowVitamins] = useState(false)
  const [showMinerals, setShowMinerals] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showHydrationInfo, setShowHydrationInfo] = useState(false)

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch nutrition data for sidebar
  const fetchNutritionData = useCallback(async (date?: Date) => {
    try {
      const dateToUse = date || selectedDate || new Date()
      dateToUse.setHours(0, 0, 0, 0);
      const dateStr = formatDateString(dateToUse)
      const [log, targets] = await Promise.all([
        apiClient.getDailyLog(dateStr),
        apiClient.getNutritionTargets()
      ])
      setNutritionData({ todayLog: log, targets })
    } catch (error) {
      console.error('Error fetching nutrition data:', error)
    }
  }, [selectedDate])

  // Handle date change from NutritionTracking component
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    fetchNutritionData(date)
  }, [fetchNutritionData])

  // Initial fetch
  useEffect(() => {
    fetchNutritionData()
  }, [fetchNutritionData])

  const waterTarget = (() => {
    const raw = nutritionData.targets?.micronutrients?.['Water (g)'] as any;
    if (typeof raw === 'number') return raw;
    if (raw && typeof raw === 'object' && 'target' in raw) return raw.target as number;
    return 0;
  })();
  const waterActual = nutritionData.todayLog?.micronutrients_summary?.['Water (g)'] ?? 0;
  const waterRatio = waterTarget > 0 ? waterActual / waterTarget : 0;
  const waterBarColor =
    waterRatio === 0
      ? 'var(--color-text-secondary)'
      : waterRatio >= 1
        ? 'var(--color-success)'
        : 'var(--color-primary)';

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - Tips */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20 flex flex-col gap-4">
              {/* Tips */}
              <div className="nh-card">
                <h3 className="nh-subtitle mb-3 text-sm flex items-center gap-2">
                  <Lightbulb size={18} weight="fill" className="text-primary" />
                  Tracking Tips
                </h3>
                <ul className="nh-text text-xs space-y-2">
                  <li>• Log meals as you eat them</li>
                  <li>• Be consistent with serving sizes</li>
                  <li>• Review weekly trends</li>
                  <li>• Update your metrics regularly</li>
                  <li>• Track snacks and beverages too</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main content - Nutrition Tracking */}
          <div className="w-full md:w-3/5">
            <NutritionTracking 
              onDateChange={handleDateChange}
              onDataChange={fetchNutritionData}
            />
          </div>

          {/* Right sidebar - Daily Targets */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20 flex flex-col gap-4">
              <div className="nh-card rounded-lg shadow-md">
                {nutritionData.targets ? (
                  <>
                <h3 className="nh-subtitle mb-3 text-sm">Daily Targets</h3>
                    <div className="space-y-2">
                      {/* Hydration inside Daily Targets (matches macro rows) */}
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Hydration</span>
                            <button
                              className="p-1 rounded text-[var(--color-text-secondary)]"
                              onClick={() => setShowHydrationInfo(true)}
                              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                              title="How hydration target is calculated"
                            >
                              <Info size={12} />
                            </button>
                          </div>
                          <span className="text-xs font-bold" style={{ color: waterBarColor }}>
                            {waterActual.toFixed(1)}/ {waterTarget.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full rounded-full h-1.5" 
                        style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, waterRatio * 100))}%`,
                              backgroundColor: 'var(--color-primary)'
                            }}
                          ></div>
                        </div>
                      </div>
                      {/* Calories */}
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Calories</span>
                          <span className="text-xs font-bold text-orange-600">
                            {nutritionData.todayLog?.total_calories || 0} / {nutritionData.targets?.calories || 0}
                          </span>
                        </div>
                        <div 
                          className="w-full rounded-full h-1.5"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          <div
                            className="bg-orange-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_calories || 0) / (nutritionData.targets?.calories || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Protein */}
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Protein</span>
                          <span className="text-xs font-bold text-blue-600">
                            {nutritionData.todayLog?.total_protein || 0}g / {nutritionData.targets?.protein || 0}g
                          </span>
                        </div>
                        <div 
                          className="w-full rounded-full h-1.5"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_protein || 0) / (nutritionData.targets?.protein || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Carbs</span>
                          <span className="text-xs font-bold text-green-600">
                            {nutritionData.todayLog?.total_carbohydrates || 0}g / {nutritionData.targets?.carbohydrates || 0}g
                          </span>
                        </div>
                        <div 
                          className="w-full rounded-full h-1.5"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_carbohydrates || 0) / (nutritionData.targets?.carbohydrates || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Fat */}
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Fat</span>
                          <span className="text-xs font-bold text-yellow-600">
                            {nutritionData.todayLog?.total_fat || 0}g / {nutritionData.targets?.fat || 0}g
                          </span>
                        </div>
                        <div 
                          className="w-full rounded-full h-1.5"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          <div
                            className="bg-yellow-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_fat || 0) / (nutritionData.targets?.fat || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Micronutrients Section */}
                    {nutritionData.targets?.micronutrients && Object.keys(nutritionData.targets.micronutrients).length > 0 && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
                        {(() => {
                          const targetMicronutrients = nutritionData.targets.micronutrients || {};
                          const logMicronutrients = nutritionData.todayLog?.micronutrients_summary || {};
                          
                          const extractUnit = (key: string): string => {
                            const match = key.match(/\(([^)]+)\)$/);
                            return match ? match[1] : '';
                          };
                          
                          const extractName = (key: string): string => {
                            return key.replace(/\s*\([^)]+\)$/, '');
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
                          
                          const vitamins = Object.entries(targetMicronutrients)
                            .filter(([name]) => isVitamin(name))
                            .sort(([a], [b]) => a.localeCompare(b));
                          
                          const minerals = Object.entries(targetMicronutrients)
                            .filter(([name]) => isMineral(name))
                            .sort(([a], [b]) => a.localeCompare(b));
                          
                          return (
                            <>
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
                                        const currentValue = typeof logMicronutrients[name] === 'number' 
                                          ? logMicronutrients[name] 
                                          : 0;
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
                                        const currentValue = typeof logMicronutrients[name] === 'number' 
                                          ? logMicronutrients[name] 
                                          : 0;
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
                  </>
                ) : (
                  <>
                    <h3 className="nh-subtitle mb-3 text-sm">Setup Required</h3>
                    <p className="nh-text text-xs mb-3">
                      Set your body metrics in your profile to see your daily nutrition targets.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* Hydration info modal */}
    {showHydrationInfo && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
        <div className="nh-card max-w-lg w-full relative">
          <button
            className="absolute top-3 right-3 text-[var(--color-text-secondary)] hover:text-white"
            onClick={() => setShowHydrationInfo(false)}
          >
            ✕
          </button>
          <h3 className="nh-subtitle mb-2">Hydration target</h3>
          <p className="nh-text text-sm mb-2">
            Your daily water target comes from Nutrition Targets (Adequate Intake defaults: ~3700 g for males, ~2700 g for females).
          </p>
          <p className="nh-text text-sm mb-2">
            Meeting or exceeding the target keeps your nutrition score stable. Being under target can reduce the score by up to -2.00.
          </p>
          <p className="nh-text text-sm">
            Log water by adding foods that include “Water (g)” (e.g., plain water). To adjust your target, edit Nutrition Targets.
          </p>
          <div className="mt-4 flex justify-end">
            <button className="nh-button nh-button-primary px-4 py-2 text-sm" onClick={() => setShowHydrationInfo(false)}>
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

export default NutritionTrackingPage


import { useState, useEffect, useCallback } from 'react'
import { CaretDown, CaretRight, Info, Plus, Trash, CalendarPlus, ForkKnife, Coffee, Moon, Cookie, X, Hamburger, FloppyDiskBack } from '@phosphor-icons/react'
import { Dialog } from '@headlessui/react'
import NutritionTracking from '../components/NutritionTracking'
import FoodSelector from '../components/FoodSelector'
import { apiClient, Food } from '../lib/apiClient'
import { DailyNutritionLog, NutritionTargets, SavedMealPlan } from '../types/nutrition'

const NutritionTrackingPage = () => {
  const [nutritionData, setNutritionData] = useState<{
    todayLog: DailyNutritionLog | null;
    targets: NutritionTargets | null;
  }>({ todayLog: null, targets: null })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showVitamins, setShowVitamins] = useState(false)
  const [showMinerals, setShowMinerals] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showHydrationInfo, setShowHydrationInfo] = useState(false)
  
  // Meal Plan Manager state
  const [savedMealPlansExpanded, setSavedMealPlansExpanded] = useState(false)
  const [savedMealPlans, setSavedMealPlans] = useState<SavedMealPlan[]>([])
  const [mealPlansLoading, setMealPlansLoading] = useState(false)
  const [showCreateMealPlanDialog, setShowCreateMealPlanDialog] = useState(false)
  const [showMealPlanDetailDialog, setShowMealPlanDetailDialog] = useState(false)
  const [selectedMealPlan, setSelectedMealPlan] = useState<SavedMealPlan | null>(null)
  const [newMealPlanName, setNewMealPlanName] = useState('')
  
  // For adding foods to meal plan
  const [showAddFoodToMealPlan, setShowAddFoodToMealPlan] = useState(false)
  const [addingFoodMealType, setAddingFoodMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  // Default all meal sections to collapsed
  const [collapsedMealSections, setCollapsedMealSections] = useState<{ [key: string]: boolean }>({
    'create-breakfast': true,
    'create-lunch': true,
    'create-dinner': true,
    'create-snack': true,
    'detail-breakfast': true,
    'detail-lunch': true,
    'detail-dinner': true,
    'detail-snack': true
  })
  
  const toggleMealSection = (mealType: string) => {
    setCollapsedMealSections(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }))
  }
  const [showServingDialog, setShowServingDialog] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [servingSize, setServingSize] = useState<number | string>(1)
  const [servingUnit, setServingUnit] = useState('serving')
  const [pendingEntries, setPendingEntries] = useState<Array<{
    food_id: number;
    food_name: string;
    image_url: string;
    food_serving_size: number;
    serving_size: number;
    serving_unit: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    source_entry_id?: string; // Track which log/plan entry this came from
  }>>([])
  
  // Fetch saved meal plans
  const fetchSavedMealPlans = useCallback(async () => {
    setMealPlansLoading(true)
    try {
      const response = await apiClient.getSavedMealPlans()
      setSavedMealPlans(response.results || [])
    } catch (error) {
      console.error('Error fetching saved meal plans:', error)
    } finally {
      setMealPlansLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchSavedMealPlans()
  }, [fetchSavedMealPlans])

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

  // Calculate planned entries totals
  const plannedTotals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0
  };
  const plannedMicronutrients: { [key: string]: number } = {};
  
  if (nutritionData.todayLog?.planned_entries) {
    nutritionData.todayLog.planned_entries.forEach(entry => {
      plannedTotals.calories += Number(entry.calories) || 0;
      plannedTotals.protein += Number(entry.protein) || 0;
      plannedTotals.carbohydrates += Number(entry.carbohydrates) || 0;
      plannedTotals.fat += Number(entry.fat) || 0;
      // Sum micronutrients from planned entries
      if (entry.micronutrients) {
        Object.entries(entry.micronutrients).forEach(([key, value]) => {
          plannedMicronutrients[key] = (plannedMicronutrients[key] || 0) + (Number(value) || 0);
        });
      }
    });
  }

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - Meal Planner */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20 flex flex-col gap-4">
              {/* Meal Planner */}
              <div className="nh-card">
                {/* Header */}
                <div 
                  className="flex items-center gap-3 pb-3 mb-3 border-b"
                  style={{ borderColor: 'var(--forum-search-border)' }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <ForkKnife size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Meal Planner</h3>
                    <p className="text-xs opacity-60">Save & reuse meals</p>
                  </div>
                </div>
                
                {/* Saved Meal Plans - Collapsible Section */}
                <div>
                  <button
                    onClick={() => setSavedMealPlansExpanded(!savedMealPlansExpanded)}
                    className="w-full flex items-center justify-between py-1 transition-colors"
                  >
                    <span className="text-xs font-medium opacity-70 flex items-center gap-1.5">
                      {savedMealPlansExpanded ? (
                        <CaretDown size={12} />
                      ) : (
                        <CaretRight size={12} />
                      )}
                      {savedMealPlans.length} saved
                    </span>
                  </button>

                  {savedMealPlansExpanded && (
                    <div className="mt-2">
                      {mealPlansLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse p-2 rounded" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                              <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}></div>
                              <div className="h-3 w-1/2 rounded mt-1" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}></div>
                            </div>
                          ))}
                        </div>
                      ) : savedMealPlans.length === 0 ? (
                        <div 
                          className="text-center py-4 px-3 rounded-lg"
                          style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                        >
                          <p className="text-xs opacity-50 mb-1">No saved meal plans</p>
                          <p className="text-xs opacity-40">Create one below</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                          {savedMealPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={async () => {
                                try {
                                  const fullPlan = await apiClient.getSavedMealPlan(plan.id)
                                  setSelectedMealPlan(fullPlan)
                                  setShowMealPlanDetailDialog(true)
                                } catch (error) {
                                  console.error('Error fetching meal plan details:', error)
                                }
                              }}
                              className="w-full p-3 rounded-lg text-left transition-all"
                              style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--dietary-option-bg)'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: 0.8 }}
                                >
                                  <ForkKnife size={12} weight="fill" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{plan.name}</p>
                                  <p className="text-xs opacity-60">
                                    {Math.round(plan.total_calories)} kcal • {plan.entry_count || plan.entries?.length || 0} items
                                  </p>
                                </div>
                              </div>
                              {/* Food image previews */}
                              {plan.entries && plan.entries.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {plan.entries.slice(0, 5).map((entry, idx) => (
                                    entry.image_url ? (
                                      <img 
                                        key={idx}
                                        src={entry.image_url} 
                                        alt={entry.food_name} 
                                        className="w-7 h-7 rounded object-cover"
                                      />
                                    ) : (
                                      <div 
                                        key={idx}
                                        className="w-7 h-7 rounded flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--forum-search-border)' }}
                                      >
                                        <Hamburger size={12} className="opacity-50" />
                                      </div>
                                    )
                                  ))}
                                  {plan.entries.length > 5 && (
                                    <div 
                                      className="w-7 h-7 rounded flex items-center justify-center text-xs opacity-70"
                                      style={{ backgroundColor: 'var(--forum-search-border)' }}
                                    >
                                      +{plan.entries.length - 5}
                                    </div>
                                  )}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Create New Meal Plan Button */}
                <button
                  onClick={() => {
                    setNewMealPlanName('')
                    setPendingEntries([])
                    setShowCreateMealPlanDialog(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors mt-3"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  <Plus size={18} weight="bold" />
                  Create Meal Plan
                </button>
              </div>
            </div>
          </div>

          {/* Main content - Nutrition Tracking */}
          <div className="w-full md:w-3/5">
            <NutritionTracking 
              onDateChange={handleDateChange}
              onDataChange={fetchNutritionData}
              refreshTrigger={refreshTrigger}
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
                          className="w-full rounded-full h-1.5 relative overflow-hidden"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          {/* Logged bar */}
                          <div
                            className={`bg-orange-500 h-1.5 transition-all absolute left-0 top-0 ${plannedTotals.calories > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_calories || 0) / (nutritionData.targets?.calories || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                          {/* Planned bar (stacked) */}
                          {plannedTotals.calories > 0 && (
                            <div
                              className="bg-purple-500 h-1.5 rounded-r-full transition-all absolute top-0"
                              style={{
                                left: `${Math.min(
                                  ((nutritionData.todayLog?.total_calories || 0) / (nutritionData.targets?.calories || 1)) * 100,
                                  100
                                )}%`,
                                width: `${Math.min(
                                  (plannedTotals.calories / (nutritionData.targets?.calories || 1)) * 100,
                                  100 - ((nutritionData.todayLog?.total_calories || 0) / (nutritionData.targets?.calories || 1)) * 100
                                )}%`
                              }}
                            ></div>
                          )}
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
                          className="w-full rounded-full h-1.5 relative overflow-hidden"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          {/* Logged bar */}
                          <div
                            className={`bg-blue-500 h-1.5 transition-all absolute left-0 top-0 ${plannedTotals.protein > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_protein || 0) / (nutritionData.targets?.protein || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                          {/* Planned bar (stacked) */}
                          {plannedTotals.protein > 0 && (
                            <div
                              className="bg-purple-500 h-1.5 rounded-r-full transition-all absolute top-0"
                              style={{
                                left: `${Math.min(
                                  ((nutritionData.todayLog?.total_protein || 0) / (nutritionData.targets?.protein || 1)) * 100,
                                  100
                                )}%`,
                                width: `${Math.min(
                                  (plannedTotals.protein / (nutritionData.targets?.protein || 1)) * 100,
                                  100 - ((nutritionData.todayLog?.total_protein || 0) / (nutritionData.targets?.protein || 1)) * 100
                                )}%`
                              }}
                            ></div>
                          )}
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
                          className="w-full rounded-full h-1.5 relative overflow-hidden"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          {/* Logged bar */}
                          <div
                            className={`bg-green-500 h-1.5 transition-all absolute left-0 top-0 ${plannedTotals.carbohydrates > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_carbohydrates || 0) / (nutritionData.targets?.carbohydrates || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                          {/* Planned bar (stacked) */}
                          {plannedTotals.carbohydrates > 0 && (
                            <div
                              className="bg-purple-500 h-1.5 rounded-r-full transition-all absolute top-0"
                              style={{
                                left: `${Math.min(
                                  ((nutritionData.todayLog?.total_carbohydrates || 0) / (nutritionData.targets?.carbohydrates || 1)) * 100,
                                  100
                                )}%`,
                                width: `${Math.min(
                                  (plannedTotals.carbohydrates / (nutritionData.targets?.carbohydrates || 1)) * 100,
                                  100 - ((nutritionData.todayLog?.total_carbohydrates || 0) / (nutritionData.targets?.carbohydrates || 1)) * 100
                                )}%`
                              }}
                            ></div>
                          )}
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
                          className="w-full rounded-full h-1.5 relative overflow-hidden"
                          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                        >
                          {/* Logged bar */}
                          <div
                            className={`bg-yellow-500 h-1.5 transition-all absolute left-0 top-0 ${plannedTotals.fat > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                            style={{
                              width: `${Math.min(
                                ((nutritionData.todayLog?.total_fat || 0) / (nutritionData.targets?.fat || 1)) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                          {/* Planned bar (stacked) */}
                          {plannedTotals.fat > 0 && (
                            <div
                              className="bg-purple-500 h-1.5 rounded-r-full transition-all absolute top-0"
                              style={{
                                left: `${Math.min(
                                  ((nutritionData.todayLog?.total_fat || 0) / (nutritionData.targets?.fat || 1)) * 100,
                                  100
                                )}%`,
                                width: `${Math.min(
                                  (plannedTotals.fat / (nutritionData.targets?.fat || 1)) * 100,
                                  100 - ((nutritionData.todayLog?.total_fat || 0) / (nutritionData.targets?.fat || 1)) * 100
                                )}%`
                              }}
                            ></div>
                          )}
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
                                        const plannedValue = plannedMicronutrients[name] || 0;
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
                                                className="w-full rounded-full h-1 relative overflow-hidden"
                                                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                                              >
                                                {/* Logged bar */}
                                                <div
                                                  className={`bg-blue-500 h-1 transition-all absolute left-0 top-0 ${plannedValue > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                                                  style={{ width: `${Math.min((currentValue / targetValue) * 100, 100)}%` }}
                                                ></div>
                                                {/* Planned bar (stacked) */}
                                                {plannedValue > 0 && (
                                                  <div
                                                    className="bg-purple-500 h-1 rounded-r-full transition-all absolute top-0"
                                                    style={{
                                                      left: `${Math.min((currentValue / targetValue) * 100, 100)}%`,
                                                      width: `${Math.min((plannedValue / targetValue) * 100, 100 - (currentValue / targetValue) * 100)}%`
                                                    }}
                                                  ></div>
                                                )}
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
                                        const plannedValue = plannedMicronutrients[name] || 0;
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
                                                className="w-full rounded-full h-1 relative overflow-hidden"
                                                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                                              >
                                                {/* Logged bar */}
                                                <div
                                                  className={`bg-blue-500 h-1 transition-all absolute left-0 top-0 ${plannedValue > 0 ? 'rounded-l-full' : 'rounded-full'}`}
                                                  style={{ width: `${Math.min((currentValue / targetValue) * 100, 100)}%` }}
                                                ></div>
                                                {/* Planned bar (stacked) */}
                                                {plannedValue > 0 && (
                                                  <div
                                                    className="bg-purple-500 h-1 rounded-r-full transition-all absolute top-0"
                                                    style={{
                                                      left: `${Math.min((currentValue / targetValue) * 100, 100)}%`,
                                                      width: `${Math.min((plannedValue / targetValue) * 100, 100 - (currentValue / targetValue) * 100)}%`
                                                    }}
                                                  ></div>
                                                )}
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
            Log water by adding foods that include "Water (g)" (e.g., plain water). To adjust your target, edit Nutrition Targets.
          </p>
          <div className="mt-4 flex justify-end">
            <button className="nh-button nh-button-primary px-4 py-2 text-sm" onClick={() => setShowHydrationInfo(false)}>
              Got it
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create Meal Plan Dialog - Nutrition Tracking Style */}
    <Dialog 
      open={showCreateMealPlanDialog} 
      onClose={() => {
        setShowCreateMealPlanDialog(false)
        setPendingEntries([])
      }} 
      className="relative z-50"
    >
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto max-w-3xl w-full rounded-xl shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--dietary-option-border)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="nh-card mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <FloppyDiskBack size={36} weight="fill" className="text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 opacity-70">Meal Plan Name</label>
                    <input
                      type="text"
                      value={newMealPlanName}
                      onChange={(e) => setNewMealPlanName(e.target.value)}
                      placeholder="Enter meal plan name..."
                      className="w-full text-2xl font-bold bg-transparent outline-none placeholder-opacity-40 px-3 py-2 rounded-lg transition-colors"
                      style={{ 
                        color: 'var(--color-text)',
                        border: '2px solid var(--dietary-option-border)',
                        backgroundColor: 'var(--dietary-option-bg)'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateMealPlanDialog(false)
                    setPendingEntries([])
                  }}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Meals Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ForkKnife size={28} weight="fill" className="text-primary" />
                <h3 className="nh-subtitle">Meals</h3>
              </div>

              <div className="space-y-4">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
                  const entries = pendingEntries.filter(e => e.meal_type === mealType)
                  const mealTotals = entries.reduce((acc, e) => ({
                    calories: acc.calories + e.calories,
                    protein: acc.protein + e.protein,
                    carbs: acc.carbs + e.carbohydrates,
                    fat: acc.fat + e.fat
                  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                  // Get suggestions from today's log for this meal type (filter out already added entries by their source ID)
                  const addedSourceIds = pendingEntries
                    .filter(e => e.source_entry_id)
                    .map(e => e.source_entry_id)
                  const loggedSuggestions = (nutritionData.todayLog?.entries?.filter(e => 
                    e.meal_type === mealType && !addedSourceIds.includes(`log-${e.id}`)
                  ) || [])
                  const plannedSuggestions = (nutritionData.todayLog?.planned_entries?.filter(e => 
                    e.meal_type === mealType && !addedSourceIds.includes(`plan-${e.id}`)
                  ) || [])
                  const hasSuggestions = loggedSuggestions.length > 0 || plannedSuggestions.length > 0

                  const getMealIcon = (type: string) => {
                    switch (type) {
                      case 'breakfast': return <Coffee size={24} weight="fill" />
                      case 'lunch': return <ForkKnife size={24} weight="fill" />
                      case 'dinner': return <Moon size={24} weight="fill" />
                      case 'snack': return <Cookie size={24} weight="fill" />
                      default: return <Hamburger size={24} weight="fill" />
                    }
                  }

                  const getMealColor = (type: string) => {
                    switch (type) {
                      case 'breakfast': return '#f59e0b'
                      case 'lunch': return '#10b981'
                      case 'dinner': return '#6366f1'
                      case 'snack': return '#ec4899'
                      default: return '#6b7280'
                    }
                  }

                  const isCollapsed = collapsedMealSections[`create-${mealType}`]

                  return (
                    <div className="nh-card" key={mealType}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleMealSection(`create-${mealType}`)}
                          className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: `${getMealColor(mealType)}20`,
                              color: getMealColor(mealType)
                            }}
                          >
                            {getMealIcon(mealType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold capitalize">{mealType}</h3>
                              <span className="text-xs opacity-50">({entries.length} items)</span>
                            </div>
                            {/* Always show nutrition totals */}
                            <div className="flex items-center gap-3 text-xs mt-0.5">
                              <span className="text-orange-500 font-medium">{Math.round(mealTotals.calories)} kcal</span>
                              <span className="opacity-60">P: {mealTotals.protein.toFixed(0)}g</span>
                              <span className="opacity-60">C: {mealTotals.carbs.toFixed(0)}g</span>
                              <span className="opacity-60">F: {mealTotals.fat.toFixed(0)}g</span>
                            </div>
                          </div>
                          {isCollapsed ? (
                            <CaretRight size={18} className="opacity-50" />
                          ) : (
                            <CaretDown size={18} className="opacity-50" />
                          )}
                        </button>

                        {/* Small food icons when collapsed */}
                        {isCollapsed && entries.length > 0 && (
                          <div className="flex items-center gap-1 ml-2">
                            {entries.slice(0, 4).map((entry, idx) => (
                              <div key={idx}>
                                {entry.image_url ? (
                                  <img 
                                    src={entry.image_url} 
                                    alt="" 
                                    className="w-8 h-8 rounded-md object-cover"
                                  />
                                ) : (
                                  <div 
                                    className="w-8 h-8 rounded-md flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--forum-search-border)' }}
                                  >
                                    <Hamburger size={14} className="opacity-50" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {entries.length > 4 && (
                              <span className="text-xs opacity-50 ml-1">+{entries.length - 4}</span>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setAddingFoodMealType(mealType)
                            setShowAddFoodToMealPlan(true)
                          }}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-2"
                          style={{ 
                            backgroundColor: `${getMealColor(mealType)}20`,
                            color: getMealColor(mealType)
                          }}
                        >
                          <Plus size={16} weight="bold" />
                        </button>
                      </div>

                      {!isCollapsed && entries.length > 0 && (
                        <div className="space-y-2 mt-4 mb-4">
                          {entries.map((entry, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all"
                              style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                            >
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

                              <div className="flex-1">
                                <h4 className="font-medium">{entry.food_name}</h4>
                                <p className="text-xs nh-text opacity-70">
                                  {entry.serving_unit === 'g' 
                                    ? `${Math.round(entry.serving_size * 100)}g`
                                    : `${entry.serving_size.toFixed(2)} ${entry.serving_unit}${entry.serving_size !== 1 ? 's' : ''}`}
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-semibold text-primary">{Math.round(entry.calories)} kcal</p>
                                <p className="text-xs nh-text opacity-70">
                                  P: {entry.protein.toFixed(1)}g • C: {entry.carbohydrates.toFixed(1)}g • F: {entry.fat.toFixed(1)}g
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  const entryIndex = pendingEntries.indexOf(entry)
                                  setPendingEntries(prev => prev.filter((_, i) => i !== entryIndex))
                                }}
                                className="p-2 rounded-lg text-red-500 transition-colors"
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Suggestions from today's log - shown as faded items */}
                      {!isCollapsed && hasSuggestions && (
                        <div 
                          className="rounded-lg p-3 mt-4"
                          style={{ 
                            backgroundColor: 'var(--color-bg-tertiary)',
                            opacity: 0.7
                          }}
                        >
                          <p className="text-xs font-medium mb-2 opacity-70">Today's foods — click + to add</p>
                          <div className="space-y-1.5">
                            {loggedSuggestions.map((entry) => (
                              <div
                                key={`log-${entry.id}`}
                                className="flex items-center gap-2 p-2 rounded transition-colors"
                                style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                              >
                                {entry.image_url ? (
                                  <img src={entry.image_url} alt="" className="w-8 h-8 rounded object-cover opacity-70" />
                                ) : (
                                  <div className="w-8 h-8 rounded flex items-center justify-center opacity-50" style={{ backgroundColor: 'var(--forum-search-border)' }}>
                                    <Hamburger size={14} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{entry.food_name}</p>
                                  <p className="text-xs opacity-60">{Math.round(Number(entry.calories))} kcal</p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (!entry.food_id) {
                                      alert('This food cannot be added to a meal plan (no valid food ID)')
                                      return
                                    }
                                    const newEntry = {
                                      food_id: entry.food_id,
                                      food_name: entry.food_name || 'Unknown',
                                      image_url: entry.image_url || '',
                                      food_serving_size: Number(entry.food_serving_size) || 100,
                                      serving_size: Number(entry.serving_size),
                                      serving_unit: entry.serving_unit || 'serving',
                                      meal_type: mealType,
                                      calories: Number(entry.calories),
                                      protein: Number(entry.protein),
                                      carbohydrates: Number(entry.carbohydrates),
                                      fat: Number(entry.fat),
                                      source_entry_id: `log-${entry.id}`
                                    }
                                    setPendingEntries([...pendingEntries, newEntry])
                                  }}
                                  className="p-1.5 rounded transition-colors"
                                  style={{ 
                                    backgroundColor: 'var(--color-success)',
                                    color: 'white'
                                  }}
                                  title="Add to meal plan"
                                >
                                  <Plus size={14} weight="bold" />
                                </button>
                              </div>
                            ))}
                            {plannedSuggestions.map((entry) => (
                              <div
                                key={`plan-${entry.id}`}
                                className="flex items-center gap-2 p-2 rounded transition-colors"
                                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                              >
                                {entry.image_url ? (
                                  <img src={entry.image_url} alt="" className="w-8 h-8 rounded object-cover opacity-70" />
                                ) : (
                                  <div className="w-8 h-8 rounded flex items-center justify-center opacity-50" style={{ backgroundColor: 'var(--forum-search-border)' }}>
                                    <Hamburger size={14} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{entry.food_name}</p>
                                  <p className="text-xs opacity-60">{Math.round(Number(entry.calories))} kcal • planned</p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (!entry.food_id) {
                                      alert('This food cannot be added to a meal plan (no valid food ID)')
                                      return
                                    }
                                    const newEntry = {
                                      food_id: entry.food_id,
                                      food_name: entry.food_name || 'Unknown',
                                      image_url: entry.image_url || '',
                                      food_serving_size: Number(entry.food_serving_size) || 100,
                                      serving_size: Number(entry.serving_size),
                                      serving_unit: entry.serving_unit || 'serving',
                                      meal_type: mealType,
                                      calories: Number(entry.calories),
                                      protein: Number(entry.protein),
                                      carbohydrates: Number(entry.carbohydrates),
                                      fat: Number(entry.fat),
                                      source_entry_id: `plan-${entry.id}`
                                    }
                                    setPendingEntries([...pendingEntries, newEntry])
                                  }}
                                  className="p-1.5 rounded transition-colors"
                                  style={{ 
                                    backgroundColor: '#8b5cf6',
                                    color: 'white'
                                  }}
                                  title="Add to meal plan"
                                >
                                  <Plus size={14} weight="bold" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isCollapsed && entries.length === 0 && !hasSuggestions && (
                        <div className="text-center py-8 nh-text opacity-50">
                          <Hamburger size={48} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No foods in {mealType}</p>
                          <button
                            onClick={() => {
                              setAddingFoodMealType(mealType)
                              setShowAddFoodToMealPlan(true)
                            }}
                            className="mt-2 text-sm hover:underline"
                            style={{ color: getMealColor(mealType) }}
                          >
                            + Add a food
                          </button>
                        </div>
                      )}

                      {entries.length > 0 && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--forum-search-border)' }}>
                          <div className="grid grid-cols-4 gap-4 text-center text-sm">
                            <div>
                              <p className="nh-text opacity-70">Calories</p>
                              <p className="font-bold">{Math.round(mealTotals.calories)}</p>
                            </div>
                            <div>
                              <p className="nh-text opacity-70">Protein</p>
                              <p className="font-bold">{mealTotals.protein.toFixed(1)}g</p>
                            </div>
                            <div>
                              <p className="nh-text opacity-70">Carbs</p>
                              <p className="font-bold">{mealTotals.carbs.toFixed(1)}g</p>
                            </div>
                            <div>
                              <p className="nh-text opacity-70">Fat</p>
                              <p className="font-bold">{mealTotals.fat.toFixed(1)}g</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nutrition Summary - Live totals */}
            <div className="nh-card mb-6">
              <h4 className="text-sm font-semibold mb-3 nh-text opacity-80">Total Nutrition</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-1">Calories</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {Math.round(pendingEntries.reduce((s, e) => s + e.calories, 0))}
                  </p>
                  <p className="text-xs opacity-50">kcal</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-1">Protein</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {Math.round(pendingEntries.reduce((s, e) => s + e.protein, 0))}
                  </p>
                  <p className="text-xs opacity-50">grams</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-1">Carbs</p>
                  <p className="text-2xl font-bold text-green-500">
                    {Math.round(pendingEntries.reduce((s, e) => s + e.carbohydrates, 0))}
                  </p>
                  <p className="text-xs opacity-50">grams</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <p className="text-xs nh-text opacity-70 mb-1">Fat</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {Math.round(pendingEntries.reduce((s, e) => s + e.fat, 0))}
                  </p>
                  <p className="text-xs opacity-50">grams</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateMealPlanDialog(false)
                  setPendingEntries([])
                }}
                className="px-5 py-2.5 rounded-lg border font-medium transition-colors"
                style={{ borderColor: 'var(--dietary-option-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newMealPlanName.trim()) {
                    alert('Please enter a name for the meal plan')
                    return
                  }
                  if (pendingEntries.length === 0) {
                    alert('Please add at least one food to the meal plan')
                    return
                  }
                  
                  try {
                    await apiClient.createSavedMealPlan({
                      name: newMealPlanName,
                      description: '',
                      entries: pendingEntries.map(e => ({
                        food_id: e.food_id,
                        serving_size: e.serving_size,
                        serving_unit: e.serving_unit,
                        meal_type: e.meal_type
                      }))
                    })
                    
                    setShowCreateMealPlanDialog(false)
                    setPendingEntries([])
                    fetchSavedMealPlans()
                  } catch (error: any) {
                    console.error('Error creating meal plan:', error)
                    alert(error?.data?.error || 'Failed to create meal plan')
                  }
                }}
                disabled={!newMealPlanName.trim() || pendingEntries.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                <FloppyDiskBack size={20} weight="bold" />
                Save Meal Plan
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>

    {/* Add Food to Meal Plan Dialog */}
    {showAddFoodToMealPlan && (
      <FoodSelector
        open={showAddFoodToMealPlan}
        onClose={() => setShowAddFoodToMealPlan(false)}
        onSelect={(food) => {
          setSelectedFood(food)
          setServingSize(1)
          setServingUnit('serving')
          setShowAddFoodToMealPlan(false)
          setShowServingDialog(true)
        }}
      />
    )}

    {/* Serving Size Dialog for Meal Plan */}
    <Dialog open={showServingDialog} onClose={() => {
      setShowServingDialog(false)
      setSelectedFood(null)
    }} className="relative z-50">
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto max-w-md w-full rounded-xl shadow-lg p-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--dietary-option-border)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="nh-subtitle">Set Serving Size</Dialog.Title>
            <button
              onClick={() => {
                setShowServingDialog(false)
                setSelectedFood(null)
              }}
              className="p-1 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          {selectedFood && (
            <>
              <div className="flex items-center gap-3 mb-4">
                {selectedFood.imageUrl ? (
                  <img src={selectedFood.imageUrl} alt={selectedFood.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--forum-search-border)' }}>
                    <Hamburger size={20} className="opacity-50" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedFood.name}</p>
                  <p className="text-xs opacity-70">{selectedFood.caloriesPerServing} kcal per 100g</p>
                </div>
              </div>

              {/* Meal Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Meal Type</label>
                <select
                  value={addingFoodMealType}
                  onChange={(e) => setAddingFoodMealType(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border"
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

              {/* Serving Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Serving Size</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-lg border"
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
                      const newUnit = e.target.value
                      const oldUnit = servingUnit
                      const currentSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize
                      const foodServingSize = selectedFood.servingSize
                      
                      if (oldUnit === 'g' && newUnit === 'serving') {
                        setServingSize(currentSize / foodServingSize)
                      } else if (oldUnit === 'serving' && newUnit === 'g') {
                        setServingSize(currentSize * foodServingSize)
                      }
                      setServingUnit(newUnit)
                    }}
                    className="px-4 py-2 rounded-lg border min-w-[120px]"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--dietary-option-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <option value="serving">serving</option>
                    <option value="g">grams (g)</option>
                  </select>
                </div>
              </div>

              {/* Nutrition preview */}
              {(() => {
                const numServingSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize
                let multiplier = numServingSize
                if (servingUnit === 'g') {
                  multiplier = numServingSize / 100
                } else {
                  multiplier = (numServingSize * selectedFood.servingSize) / 100
                }
                
                return (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                    <div className="grid grid-cols-4 gap-2 text-xs text-center">
                      <div>
                        <p className="opacity-70">Calories</p>
                        <p className="font-semibold">{Math.round(selectedFood.caloriesPerServing * multiplier)}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Protein</p>
                        <p className="font-semibold">{Math.round(selectedFood.proteinContent * multiplier)}g</p>
                      </div>
                      <div>
                        <p className="opacity-70">Carbs</p>
                        <p className="font-semibold">{Math.round(selectedFood.carbohydrateContent * multiplier)}g</p>
                      </div>
                      <div>
                        <p className="opacity-70">Fat</p>
                        <p className="font-semibold">{Math.round(selectedFood.fatContent * multiplier)}g</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowServingDialog(false)
                    setSelectedFood(null)
                  }}
                  className="px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--dietary-option-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedFood) return
                    
                    const numServingSize = typeof servingSize === 'string' ? Number(servingSize) : servingSize
                    if (!numServingSize || numServingSize <= 0) {
                      alert('Please enter a valid serving size')
                      return
                    }
                    
                    let multiplier = numServingSize
                    if (servingUnit === 'g') {
                      multiplier = numServingSize / 100
                    } else {
                      multiplier = (numServingSize * selectedFood.servingSize) / 100
                    }
                    
                    setPendingEntries([...pendingEntries, {
                      food_id: selectedFood.id,
                      food_name: selectedFood.name,
                      image_url: selectedFood.imageUrl,
                      food_serving_size: selectedFood.servingSize,
                      serving_size: multiplier,
                      serving_unit: servingUnit,
                      meal_type: addingFoodMealType,
                      calories: selectedFood.caloriesPerServing * multiplier,
                      protein: selectedFood.proteinContent * multiplier,
                      carbohydrates: selectedFood.carbohydrateContent * multiplier,
                      fat: selectedFood.fatContent * multiplier
                    }])
                    
                    setShowServingDialog(false)
                    setSelectedFood(null)
                  }}
                  className="flex-1 nh-button nh-button-primary"
                >
                  Add to Meal Plan
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>

    {/* Meal Plan Detail Dialog - Nutrition Tracking Style */}
    <Dialog open={showMealPlanDetailDialog} onClose={() => setShowMealPlanDetailDialog(false)} className="relative z-50">
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className="mx-auto max-w-3xl w-full rounded-xl shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--dietary-option-border)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          {selectedMealPlan && (
            <div className="p-6">
              {/* Header - Similar to Nutrition Tracking date header */}
              <div className="nh-card mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ForkKnife size={32} weight="fill" className="text-primary" />
                    <div>
                      <h2 className="nh-subtitle">{selectedMealPlan.name}</h2>
                      {selectedMealPlan.description && (
                        <p className="text-sm nh-text opacity-70">{selectedMealPlan.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMealPlanDetailDialog(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Nutrition Summary - Like the daily summary */}
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs nh-text opacity-70 mb-1">Calories</p>
                      <p className="text-xl font-bold text-orange-500">{Math.round(selectedMealPlan.total_calories)}</p>
                      <p className="text-xs opacity-50">kcal</p>
                    </div>
                    <div>
                      <p className="text-xs nh-text opacity-70 mb-1">Protein</p>
                      <p className="text-xl font-bold text-blue-500">{Math.round(selectedMealPlan.total_protein)}</p>
                      <p className="text-xs opacity-50">grams</p>
                    </div>
                    <div>
                      <p className="text-xs nh-text opacity-70 mb-1">Carbs</p>
                      <p className="text-xl font-bold text-green-500">{Math.round(selectedMealPlan.total_carbohydrates)}</p>
                      <p className="text-xs opacity-50">grams</p>
                    </div>
                    <div>
                      <p className="text-xs nh-text opacity-70 mb-1">Fat</p>
                      <p className="text-xl font-bold text-yellow-500">{Math.round(selectedMealPlan.total_fat)}</p>
                      <p className="text-xs opacity-50">grams</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meals Section - Exactly like Nutrition Tracking */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ForkKnife size={28} weight="fill" className="text-primary" />
                  <h3 className="nh-subtitle">Meals</h3>
                </div>

                <div className="space-y-4">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
                    const entries = selectedMealPlan.entries?.filter(e => e.meal_type === mealType) || []
                    const mealTotals = entries.reduce((acc, e) => ({
                      calories: acc.calories + Number(e.calories),
                      protein: acc.protein + Number(e.protein),
                      carbs: acc.carbs + Number(e.carbohydrates),
                      fat: acc.fat + Number(e.fat)
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                    const getMealIcon = (type: string) => {
                      switch (type) {
                        case 'breakfast': return <Coffee size={24} weight="fill" />
                        case 'lunch': return <ForkKnife size={24} weight="fill" />
                        case 'dinner': return <Moon size={24} weight="fill" />
                        case 'snack': return <Cookie size={24} weight="fill" />
                        default: return <Hamburger size={24} weight="fill" />
                      }
                    }

                    const getMealColor = (type: string) => {
                      switch (type) {
                        case 'breakfast': return '#f59e0b'
                        case 'lunch': return '#10b981'
                        case 'dinner': return '#6366f1'
                        case 'snack': return '#ec4899'
                        default: return '#6b7280'
                      }
                    }

                    const isCollapsed = collapsedMealSections[`detail-${mealType}`]

                    return (
                      <div className="nh-card" key={mealType}>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleMealSection(`detail-${mealType}`)}
                            className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: `${getMealColor(mealType)}20`,
                                color: getMealColor(mealType)
                              }}
                            >
                              {getMealIcon(mealType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold capitalize">{mealType}</h3>
                                <span className="text-xs opacity-50">({entries.length} items)</span>
                              </div>
                              {/* Always show nutrition totals */}
                              <div className="flex items-center gap-3 text-xs mt-0.5">
                                <span className="text-orange-500 font-medium">{Math.round(mealTotals.calories)} kcal</span>
                                <span className="opacity-60">P: {mealTotals.protein.toFixed(0)}g</span>
                                <span className="opacity-60">C: {mealTotals.carbs.toFixed(0)}g</span>
                                <span className="opacity-60">F: {mealTotals.fat.toFixed(0)}g</span>
                              </div>
                            </div>
                            {isCollapsed ? (
                              <CaretRight size={18} className="opacity-50" />
                            ) : (
                              <CaretDown size={18} className="opacity-50" />
                            )}
                          </button>
                        </div>

                        {!isCollapsed && (
                          <>
                            {entries.length > 0 ? (
                              <div className="space-y-2 mt-4">
                                {entries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all"
                                    style={{ backgroundColor: 'var(--dietary-option-bg)' }}
                                  >
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

                                    <div className="flex-1">
                                      <h4 className="font-medium">{entry.food_name}</h4>
                                      <p className="text-xs nh-text opacity-70">
                                        {entry.serving_unit === 'g' 
                                          ? `${Math.round(Number(entry.serving_size) * 100)}g`
                                          : `${Number(entry.serving_size).toFixed(2)} ${entry.serving_unit}${Number(entry.serving_size) !== 1 ? 's' : ''}`}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="font-semibold text-primary">{Math.round(Number(entry.calories))} kcal</p>
                                      <p className="text-xs nh-text opacity-70">
                                        P: {Number(entry.protein).toFixed(1)}g • C: {Number(entry.carbohydrates).toFixed(1)}g • F: {Number(entry.fat).toFixed(1)}g
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 nh-text opacity-50">
                                <Hamburger size={48} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No foods in {mealType}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    if (!selectedMealPlan) return
                    const dateStr = formatDateString(selectedDate)
                    try {
                      await apiClient.planSavedMealPlan(selectedMealPlan.id, dateStr)
                      setShowMealPlanDetailDialog(false)
                      fetchNutritionData()
                      setRefreshTrigger(prev => prev + 1)
                    } catch (error: any) {
                      console.error('Error planning meal plan:', error)
                      alert(error?.data?.error || 'Failed to plan meal plan')
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                >
                  <CalendarPlus size={20} weight="bold" />
                  Plan
                </button>
                <button
                  onClick={async () => {
                    if (!selectedMealPlan) return
                    if (!confirm(`Are you sure you want to delete "${selectedMealPlan.name}"?`)) return
                    try {
                      await apiClient.deleteSavedMealPlan(selectedMealPlan.id)
                      setShowMealPlanDetailDialog(false)
                      fetchSavedMealPlans()
                    } catch (error: any) {
                      console.error('Error deleting meal plan:', error)
                      alert(error?.data?.error || 'Failed to delete meal plan')
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors text-red-500 ml-auto"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <Trash size={20} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
    </div>
  )
}

export default NutritionTrackingPage



import React, { useState, useEffect } from 'react';
import { X, Hamburger, Tag, Fire, Scales, Question, Pill } from '@phosphor-icons/react';
import { Food, apiClient } from '../../lib/apiClient';
import NutritionScore from '../../components/NutritionScore';

interface FoodDetailProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
}

const FoodDetail: React.FC<FoodDetailProps> = ({ food, open, onClose, actions }) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
  const [customGrams, setCustomGrams] = useState<number>(0);
  const [selectedServingSize, setSelectedServingSize] = useState<number>(0); // Main serving size selector
  const [recommendations, setRecommendations] = useState<{
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    micronutrients: {
      [key: string]: number | { target: number; maximum?: number };
    };
  } | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<{
    micronutrients_summary: { [key: string]: number };
    total_calories?: number;
    total_protein?: number;
    total_carbohydrates?: number;
    total_fat?: number;
  } | null>(null);

  // Fetch recommendations and today's log when modal opens
  useEffect(() => {
    if (open && !recommendations && !loadingRecommendations) {
      fetchRecommendations();
      fetchTodayLog();
    }
  }, [open]);

  // Initialize selected serving size when food changes
  useEffect(() => {
    if (food) {
      setSelectedServingSize(food.servingSize);
    }
  }, [food]);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      const data = await apiClient.getNutritionTargets();
      setRecommendations(data);
    } catch (error: any) {
      console.error('Failed to fetch nutrition targets:', error);
      // Check if it's a 404 error (user hasn't set up metrics)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        setRecommendationsError('Please set up your profile metrics first to see personalized recommendations.');
      } else {
        setRecommendationsError('Failed to load recommendations. Please try again.');
      }
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchTodayLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const log = await apiClient.getDailyLog(today);
      setTodayLog(log);
    } catch (error) {
      console.error('Failed to fetch today\'s log:', error);
      // It's okay if there's no log for today yet
      setTodayLog({ micronutrients_summary: {} });
    }
  };

  const handleHelpClick = (e: React.MouseEvent, nutrient: string) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault();
    setSelectedNutrient(nutrient);
    setCustomGrams(selectedServingSize || food?.servingSize || 100); // Initialize with selected serving size
    setShowRecommendations(true);
  };

  // Get today's consumed macronutrient value
  const getTodayMacroConsumed = (nutrient: string): number => {
    if (!todayLog) return 0;
    
    // Helper to ensure we get a number
    const toNum = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      return 0;
    };
    
    switch (nutrient) {
      case 'calories':
        return toNum(todayLog.total_calories);
      case 'protein':
        return toNum(todayLog.total_protein);
      case 'fat':
        return toNum(todayLog.total_fat);
      case 'carbs':
        return toNum(todayLog.total_carbohydrates);
      default:
        return toNum(todayLog.micronutrients_summary?.[nutrient]);
    }
  };

  // Calculate scaled nutrient value based on selected serving size
  const getScaledNutrientValue = (nutrient: string): number => {
    if (!food || !food.servingSize) return 0;
    
    // Helper to ensure we get a number
    const toNum = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      return 0;
    };
    
    const multiplier = (selectedServingSize || food.servingSize) / food.servingSize;
    
    switch (nutrient) {
      case 'calories':
        return toNum(food.caloriesPerServing) * multiplier;
      case 'protein':
        return toNum(food.proteinContent) * multiplier;
      case 'fat':
        return toNum(food.fatContent) * multiplier;
      case 'carbs':
        return toNum(food.carbohydrateContent) * multiplier;
      default:
        if (food.micronutrients && food.micronutrients[nutrient]) {
          const microValue = food.micronutrients[nutrient];
          const value = typeof microValue === 'object' && microValue !== null && 'value' in microValue
            ? toNum(microValue.value)
            : toNum(microValue);
          return value * multiplier;
        }
        return 0;
    }
  };

  // Check if adding this food would exceed target (for main view warnings)
  const wouldExceedTarget = (nutrient: string): boolean => {
    const target = getNutrientRecommendation(nutrient) || getNutrientTarget(nutrient);
    if (!target) return false;
    
    const todayConsumed = nutrient === 'calories' || nutrient === 'protein' || nutrient === 'fat' || nutrient === 'carbs'
      ? getTodayMacroConsumed(nutrient)
      : todayLog?.micronutrients_summary?.[nutrient] || 0;
    const foodAmount = getScaledNutrientValue(nutrient);
    return (todayConsumed + foodAmount) > target;
  };

  // Check if adding this food would exceed maximum (for main view warnings)
  const wouldExceedMaximum = (nutrient: string): boolean => {
    const maximum = getNutrientMaximum(nutrient);
    if (!maximum) return false;
    
    const todayConsumed = nutrient === 'calories' || nutrient === 'protein' || nutrient === 'fat' || nutrient === 'carbs'
      ? getTodayMacroConsumed(nutrient)
      : todayLog?.micronutrients_summary?.[nutrient] || 0;
    const foodAmount = getScaledNutrientValue(nutrient);
    return (todayConsumed + foodAmount) > maximum;
  };

  const closeRecommendationsModal = () => {
    setShowRecommendations(false);
    setSelectedNutrient(null);
    setCustomGrams(0);
  };

  const getNutrientRecommendation = (nutrient: string): number | null => {
    if (!recommendations) return null;
    
    // Helper to ensure we get a number
    const toNumber = (val: unknown): number | null => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };
    
    switch (nutrient) {
      case 'calories':
        return toNumber(recommendations.calories);
      case 'protein':
        return toNumber(recommendations.protein);
      case 'fat':
        return toNumber(recommendations.fat);
      case 'carbs':
        return toNumber(recommendations.carbohydrates);
      default:
        return null;
    }
  };

  const getNutrientValue = (nutrient: string, grams?: number): number => {
    if (!food || !food.servingSize) return 0;
    
    // Helper to ensure we get a number
    const toNum = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      return 0;
    };
    
    // Use custom grams if provided, otherwise use serving size
    const servingGrams = grams !== undefined && grams > 0 ? grams : food.servingSize;
    const multiplier = servingGrams / food.servingSize;
    
    switch (nutrient) {
      case 'calories':
        return toNum(food.caloriesPerServing) * multiplier;
      case 'protein':
        return toNum(food.proteinContent) * multiplier;
      case 'fat':
        return toNum(food.fatContent) * multiplier;
      case 'carbs':
        return toNum(food.carbohydrateContent) * multiplier;
      default:
        // Check if it's a micronutrient
        if (food.micronutrients && food.micronutrients[nutrient]) {
          const microValue = food.micronutrients[nutrient];
          // Handle both number and object types
          const value = typeof microValue === 'object' && microValue !== null && 'value' in microValue
            ? microValue.value 
            : typeof microValue === 'number'
            ? microValue
            : 0;
          return value * multiplier;
        }
        return 0;
    }
  };

  // Helper to find matching micronutrient key in recommendations
  // Food data has keys like "Vitamin E (alpha-tocopherol)" 
  // Recommendations have keys like "Vitamin E (alpha-tocopherol) (mg)"
  const findMicronutrientInRecommendations = (nutrient: string): number | { target: number; maximum?: number } | null => {
    if (!recommendations?.micronutrients) return null;
    
    // First try exact match
    if (recommendations.micronutrients[nutrient]) {
      return recommendations.micronutrients[nutrient];
    }
    
    // Try to find a key that starts with the nutrient name (to handle unit suffix)
    // e.g., "Vitamin E (alpha-tocopherol)" should match "Vitamin E (alpha-tocopherol) (mg)"
    for (const key of Object.keys(recommendations.micronutrients)) {
      if (key.startsWith(nutrient)) {
        return recommendations.micronutrients[key];
      }
    }
    
    // Also try the reverse - if the nutrient has a unit suffix, try without it
    // e.g., "Vitamin E (alpha-tocopherol) (mg)" should match "Vitamin E (alpha-tocopherol)"
    const nutrientWithoutUnit = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
    for (const key of Object.keys(recommendations.micronutrients)) {
      const keyWithoutUnit = key.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (keyWithoutUnit === nutrientWithoutUnit || key.startsWith(nutrientWithoutUnit)) {
        return recommendations.micronutrients[key];
      }
    }
    
    return null;
  };

  const getNutrientMaximum = (nutrient: string): number | null => {
    if (!recommendations) return null;
    
    // For macronutrients, no toxic upper limits
    if (nutrient === 'calories' || nutrient === 'protein' || nutrient === 'fat' || nutrient === 'carbs') {
      return null;
    }
    
    // For micronutrients, find matching key and check for maximum
    const micronutrient = findMicronutrientInRecommendations(nutrient);
    if (micronutrient && typeof micronutrient === 'object' && 'maximum' in micronutrient) {
      return micronutrient.maximum ?? null;
    }
    
    return null;
  };

  const getNutrientTarget = (nutrient: string): number | null => {
    if (!recommendations) return null;
    
    // For micronutrients, find matching key
    const micronutrient = findMicronutrientInRecommendations(nutrient);
    if (micronutrient) {
      if (typeof micronutrient === 'object' && 'target' in micronutrient) {
        return micronutrient.target;
      }
      if (typeof micronutrient === 'number') {
        return micronutrient;
      }
    }
    
    return null;
  };

  const isExceedingTarget = (nutrient: string | null, grams?: number): boolean => {
    if (!nutrient) return false;
    const target = getNutrientRecommendation(nutrient) || getNutrientTarget(nutrient);
    if (!target) return false;
    
    const todayConsumed = getTodayConsumed(nutrient);
    const foodAmount = getNutrientValue(nutrient, grams);
    const totalAfterEating = todayConsumed + foodAmount;
    
    return totalAfterEating > target;
  };

  const isOverdosing = (nutrient: string | null, grams?: number): boolean => {
    if (!nutrient) return false;
    const maximum = getNutrientMaximum(nutrient);
    if (!maximum) return false; // No maximum means no overdose risk
    
    // Get today's consumed amount
    const todayConsumed = getTodayConsumed(nutrient);
    
    // Get this food's amount
    const foodAmount = getNutrientValue(nutrient, grams);
    
    // Check if today's total + this food would exceed maximum
    const totalAfterEating = todayConsumed + foodAmount;
    
    return totalAfterEating > maximum;
  };

  const getPercentageOfMaximum = (nutrient: string | null, grams?: number): number | null => {
    if (!nutrient) return null;
    const maximum = getNutrientMaximum(nutrient);
    if (!maximum) return null;
    
    // Calculate based on total after eating this food
    const todayConsumed = todayLog?.micronutrients_summary?.[nutrient] || 0;
    const foodAmount = getNutrientValue(nutrient, grams);
    const totalAfterEating = todayConsumed + foodAmount;
    
    return (totalAfterEating / maximum) * 100;
  };

  const getTodayConsumed = (nutrient: string): number => {
    if (!todayLog) return 0;
    
    // Helper to ensure we get a number
    const toNumber = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      return 0;
    };
    
    // Handle macronutrients
    switch (nutrient) {
      case 'calories':
        return toNumber(todayLog.total_calories);
      case 'protein':
        return toNumber(todayLog.total_protein);
      case 'fat':
        return toNumber(todayLog.total_fat);
      case 'carbs':
        return toNumber(todayLog.total_carbohydrates);
      default:
        return toNumber(todayLog.micronutrients_summary?.[nutrient]);
    }
  };

  const getTotalAfterEating = (nutrient: string, grams?: number): number => {
    const todayConsumed = getTodayConsumed(nutrient);
    const foodAmount = getNutrientValue(nutrient, grams);
    return todayConsumed + foodAmount;
  };

  const getUnitForNutrient = (nutrient: string): string => {
    // For macronutrients, return their standard units
    switch (nutrient) {
      case 'calories':
        return 'kcal';
      case 'protein':
      case 'fat':
      case 'carbs':
        return 'g';
      default:
        // For micronutrients, get the unit from the food's micronutrients data
        try {
          if (food?.micronutrients && food.micronutrients[nutrient]) {
            const microData = food.micronutrients[nutrient];
            if (typeof microData === 'object' && microData !== null && 'unit' in microData) {
              return microData.unit;
            }
          }
          // Fallback: try to extract from nutrient name (last parentheses that looks like a unit)
          const matches = nutrient.match(/\(([^)]+)\)/g);
          if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1].replace(/[()]/g, '');
            // Only return if it looks like a unit (g, mg, µg, ug, mcg, IU)
            if (/^(g|mg|µg|ug|mcg|IU)$/i.test(lastMatch)) {
              return lastMatch;
            }
          }
        } catch (e) {
          console.error('Error getting unit for nutrient:', nutrient, e);
        }
        return 'mg'; // Default to mg for vitamins/minerals
    }
  };

  if (!food) return null;


  // Helper function to convert amount to comparable value (in micrograms)
  const normalizeAmount = (amount: number, unit: string): number => {
    const unitLower = unit.toLowerCase();
    if (unitLower === 'g') return amount * 1_000_000; // g to µg
    if (unitLower === 'mg') return amount * 1_000;    // mg to µg
    if (unitLower === 'µg' || unitLower === 'ug') return amount; // already in µg
    return amount; // fallback for unknown units
  };

  // Define priority micronutrients to display
  const priorityMicronutrients = [
    "Water",
    "Niacin",
    "Thiamin",
    "Retinol",
    "Zinc, Zn)",
    "Copper, Cu",
    "Riboflavin",
    "Sodium, Na",
    "Calcium, Ca",
    "Cholesterol",
    "Total Sugars",
    "Vitamin B-6",
    "Potassium, K",
    "Magnesium, Mg",
    "Phosphorus, P",
    "Selenium, Se",
    "Vitamin B-12",
    "Choline, total",
    "Carotene, beta",
    "Vitamin A, RAE",
    "Vitamin D (D2 + D3)",
    "Vitamin K (phylloquinone)",
    "Fatty acids, total saturated",
    "Vitamin E (alpha-tocopherol)",
    "Fatty acids, total monounsaturated",
    "Fatty acids, total polyunsaturated"
  ];

  // Filter and display only priority micronutrients that exist in the food data, sorted by normalized amount
  const displayedMicronutrients = food.micronutrients
    ? priorityMicronutrients
        .filter(nutrient => food.micronutrients && nutrient in food.micronutrients)
        .map(nutrient => {
          const micronutrient = food.micronutrients![nutrient];
          return [nutrient, micronutrient.value, micronutrient.unit] as [string, number, string];
        })
        .sort((a, b) => {
          const normalizedA = normalizeAmount(a[1], a[2]);
          const normalizedB = normalizeAmount(b[1], b[2]);
          return normalizedB - normalizedA;
        })
    : [];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? 'visible' : 'invisible'}`}>
      {/* Backdrop with blur effect */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className={`max-w-3xl w-full mx-4 bg-[var(--color-bg-primary)] rounded-lg shadow-xl transform transition-all duration-300 max-h-[90vh] overflow-hidden flex flex-col relative ${open ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
      >
        {/* Top bar with image, title, and close button */}
        <div className="flex items-center gap-4 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {/* Food image */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
            {food.imageUrl ? (
              <img 
                src={food.imageUrl} 
                alt={food.name} 
                className="w-full h-full object-cover"
                onError={e => { 
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg width="32" height="32" viewBox="0 0 256 256" fill="currentColor" class="text-[var(--color-text-tertiary)]"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v94.06L168,102.06a16,16,0,0,0-22.63,0L44,203.37V56ZM216,200H59.31l107-107L216,142.69V200Zm-72-76a28,28,0,1,0-28-28A28,28,0,0,0,144,124Z"/></svg></div>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Hamburger size={32} weight="fill" className="text-[var(--color-text-tertiary)]" />
              </div>
            )}
          </div>

          {/* Food title */}
          <h2 className="flex-1 text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{food.name}</h2>

          {/* Optional actions (edit/delete) */}
          {actions}
          {/* Close button */}
          <button 
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full bg-[var(--color-button-danger-bg)] hover:bg-[var(--color-button-danger-hover-bg)] transition-colors"
          >
            <X size={20} weight="bold" className="text-[var(--color-text-on-danger)]" />
          </button>
        </div>
          
        {/* Content section - scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
            
          {/* Basic Information */}
          <div className="mb-8 overflow-visible">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Tag size={20} weight="fill" className="text-[var(--color-accent)]" />
              Basic Information
            </h3>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">Category</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-1">{food.category}</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] md:col-span-2 overflow-visible">
                <p className="text-[var(--color-text-secondary)] text-sm mb-2">Nutrition Score</p>
                <NutritionScore 
                  score={food.nutritionScore} 
                  size="md"
                  foodDetails={{
                    proteinContent: food.proteinContent,
                    carbohydrateContent: food.carbohydrateContent,
                    fatContent: food.fatContent,
                    caloriesPerServing: food.caloriesPerServing,
                    servingSize: food.servingSize,
                    category: food.category,
                    name: food.name
                  }}
                />
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Serving Size */}
                  <div>
                    <p className="text-[var(--color-text-secondary)] text-sm mb-2">Default Serving Size</p>
                    <p className="font-medium text-[var(--color-text-primary)]">{food.servingSize}g</p>
                  </div>
                  
                  {/* Adjust Serving Size */}
                  <div>
                    <p className="text-[var(--color-text-secondary)] text-sm mb-2">Adjust Serving Size</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={selectedServingSize || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setSelectedServingSize(0);
                          } else {
                            setSelectedServingSize(Math.max(0, parseInt(val) || 0));
                          }
                        }}
                        onBlur={() => {
                          if (selectedServingSize < 1) {
                            setSelectedServingSize(food?.servingSize || 100);
                          }
                        }}
                        className="w-20 px-2 py-1 rounded border text-sm font-semibold"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          borderColor: 'var(--color-border)',
                        }}
                      />
                      <span className="text-xs text-[var(--color-text-secondary)]">g</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedServingSize(food.servingSize)}
                          className="px-2 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                          Default
                        </button>
                        <button
                          onClick={() => setSelectedServingSize(100)}
                          className="px-2 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                          100g
                        </button>
                        <button
                          onClick={() => setSelectedServingSize(selectedServingSize * 2)}
                          className="px-2 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                          ×2
                        </button>
                        <button
                          onClick={() => setSelectedServingSize(Math.max(1, Math.floor(selectedServingSize / 2)))}
                          className="px-2 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                          ÷2
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            
          {/* Nutrition Information - Per Selected Serving */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Fire size={20} weight="fill" className="text-[var(--color-accent)]" />
              Nutrition Information (per {selectedServingSize}g serving)
            </h3>
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border text-center relative ${
                wouldExceedMaximum('calories') 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : wouldExceedTarget('calories')
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
              }`}>
                <button
                  onClick={(e) => handleHelpClick(e, 'calories')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{getScaledNutrientValue('calories').toFixed(1)} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
                {wouldExceedTarget('calories') && !wouldExceedMaximum('calories') && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Exceeds target</p>
                )}
              </div>
                
              <div className={`p-4 rounded-lg border text-center relative ${
                wouldExceedMaximum('protein') 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : wouldExceedTarget('protein')
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
              }`}>
                <button
                  onClick={(e) => handleHelpClick(e, 'protein')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{getScaledNutrientValue('protein').toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
                {wouldExceedTarget('protein') && !wouldExceedMaximum('protein') && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Exceeds target</p>
                )}
              </div>
                
              <div className={`p-4 rounded-lg border text-center relative ${
                wouldExceedMaximum('fat') 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : wouldExceedTarget('fat')
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
              }`}>
                <button
                  onClick={(e) => handleHelpClick(e, 'fat')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{getScaledNutrientValue('fat').toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
                {wouldExceedTarget('fat') && !wouldExceedMaximum('fat') && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Exceeds target</p>
                )}
              </div>
                
              <div className={`p-4 rounded-lg border text-center relative ${
                wouldExceedMaximum('carbs') 
                  ? 'bg-red-500/10 border-red-500/50' 
                  : wouldExceedTarget('carbs')
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
              }`}>
                <button
                  onClick={(e) => handleHelpClick(e, 'carbs')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-green-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{getScaledNutrientValue('carbs').toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Carbs</p>
                {wouldExceedTarget('carbs') && !wouldExceedMaximum('carbs') && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Exceeds target</p>
                )}
              </div>
            </div>
          </div>

          {/* Nutrition Information - Per 100g */}
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Scales size={20} weight="fill" className="text-[var(--color-accent)]" />
              Nutrition Information (per 100g)
            </h3>
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={(e) => handleHelpClick(e, 'calories')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.caloriesPerServing / food.servingSize) * 100).toFixed(1)} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={(e) => handleHelpClick(e, 'protein')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.proteinContent / food.servingSize) * 100).toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={(e) => handleHelpClick(e, 'fat')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.fatContent / food.servingSize) * 100).toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={(e) => handleHelpClick(e, 'carbs')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-green-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.carbohydrateContent / food.servingSize) * 100).toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Carbs</p>
              </div>
            </div>
          </div>

          {/* Micronutrients Section */}
          {displayedMicronutrients.length > 0 && (
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
                <Pill size={20} weight="fill" className="text-[var(--color-accent)]" />
                Micronutrients (per {selectedServingSize}g serving)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedMicronutrients.map(([nutrient, amount, unit]) => {
                  // Remove only the unit part (last parentheses) from the name
                  const nutrientName = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
                  // Calculate scaled amount based on selected serving size
                  const scaledAmount = (amount * selectedServingSize / food.servingSize);
                  const exceedsMax = wouldExceedMaximum(nutrient);
                  const exceedsTarget = wouldExceedTarget(nutrient);

                  return (
                    <div
                      key={nutrient}
                      className={`p-3 rounded-lg border flex justify-between items-center relative ${
                        exceedsMax 
                          ? 'bg-red-500/10 border-red-500/50' 
                          : exceedsTarget
                          ? 'bg-yellow-500/10 border-yellow-500/50'
                          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'
                      }`}
                    >
                      <button
                        onClick={(e) => handleHelpClick(e, nutrient)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors z-10"
                        title="View daily recommendation"
                      >
                        <Question size={12} weight="bold" className="text-white" />
                      </button>
                      <div className="flex-1">
                        <span className="text-[var(--color-text-secondary)] text-sm">{nutrientName}</span>
                        {exceedsMax && (
                          <p className="text-xs text-red-600">⚠️ Exceeds max</p>
                        )}
                        {exceedsTarget && !exceedsMax && (
                          <p className="text-xs text-yellow-600">⚠️ Exceeds target</p>
                        )}
                      </div>
                      <span className="font-semibold text-[var(--color-text-primary)] ml-2 pr-8">
                        {scaledAmount.toFixed(2)}{unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            
          {/* Dietary Tags */}
          <div>
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Tag size={20} weight="fill" className="text-[var(--color-accent)]" />
              Dietary Tags
            </h3>
              
            <div className="flex flex-wrap gap-2">
              {food.dietaryOptions.length > 0 ? (
                food.dietaryOptions.map((tag) => (
                  <div 
                    key={tag}
                    className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-accent-bg-soft)] text-[var(--color-accent)] border border-[var(--color-accent-border-soft)]"
                  >
                    <Tag size={14} weight="fill" className="mr-1.5" />
                    {tag}
                  </div>
                ))
              ) : (
                <p className="text-[var(--color-text-secondary)] italic">No dietary tags specified</p>
              )}
            </div>
          </div>
        </div>
            
      </div>

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeRecommendationsModal}
          ></div>
          
          <div className="relative max-w-md w-full mx-4 bg-[var(--color-bg-primary)] rounded-lg shadow-2xl p-6 border border-[var(--color-border)]">
            <button
              onClick={closeRecommendationsModal}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <X size={20} weight="bold" className="text-[var(--color-text-secondary)]" />
            </button>

            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Daily Recommendation
            </h3>

            {loadingRecommendations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-[var(--color-text-secondary)] mt-2">Loading recommendations...</p>
              </div>
            ) : recommendationsError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{recommendationsError}</p>
                <div className="flex gap-2 justify-center">
                  {recommendationsError.includes('profile metrics') ? (
                    <a
                      href="/profile"
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Go to Profile
                    </a>
                  ) : null}
                  <button
                    onClick={fetchRecommendations}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : recommendations && selectedNutrient ? (
              <div className="space-y-4">
                {(() => {
                  if (!selectedNutrient) return null;
                  const target = getNutrientRecommendation(selectedNutrient) || getNutrientTarget(selectedNutrient);
                  const unit = getUnitForNutrient(selectedNutrient);
                  const maximum = getNutrientMaximum(selectedNutrient);
                  // Clean up nutrient name for display (remove unit parentheses at end)
                  let displayName = selectedNutrient;
                  if (selectedNutrient === 'carbs') {
                    displayName = 'Carbohydrates';
                  } else if (selectedNutrient === 'calories') {
                    displayName = 'Calories';
                  } else if (selectedNutrient === 'protein') {
                    displayName = 'Protein';
                  } else if (selectedNutrient === 'fat') {
                    displayName = 'Fat';
                  } else {
                    displayName = selectedNutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
                  }
                  
                  return (
                    <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                      <p className="text-sm text-[var(--color-text-secondary)] mb-1">Your Daily Target</p>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {target !== null ? `${target} ${unit}` : 'Not set'}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {displayName}
                      </p>
                      {maximum && (
                        <p className="text-xs text-orange-500 mt-2">
                          Safe Maximum: {maximum} {unit}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Custom Gram Input */}
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                    Adjust Serving Size (grams)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={customGrams || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCustomGrams(0);
                          setSelectedServingSize(0);
                        } else {
                          const newValue = Math.max(0, parseInt(val) || 0);
                          setCustomGrams(newValue);
                          setSelectedServingSize(newValue);
                        }
                      }}
                      onBlur={() => {
                        if (customGrams < 1) {
                          const defaultVal = food?.servingSize || 100;
                          setCustomGrams(defaultVal);
                          setSelectedServingSize(defaultVal);
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border text-lg font-semibold"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">grams</span>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button
                      onClick={() => {
                        const val = food?.servingSize || 100;
                        setCustomGrams(val);
                        setSelectedServingSize(val);
                      }}
                      className="px-3 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      Default ({food?.servingSize}g)
                    </button>
                    <button
                      onClick={() => {
                        setCustomGrams(100);
                        setSelectedServingSize(100);
                      }}
                      className="px-3 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      100g
                    </button>
                    <button
                      onClick={() => {
                        const val = customGrams * 2;
                        setCustomGrams(val);
                        setSelectedServingSize(val);
                      }}
                      className="px-3 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      ×2
                    </button>
                    <button
                      onClick={() => {
                        const val = Math.max(1, Math.floor(customGrams / 2));
                        setCustomGrams(val);
                        setSelectedServingSize(val);
                      }}
                      className="px-3 py-1 text-xs rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      ÷2
                    </button>
                  </div>
                </div>

                {/* Today's Progress Section - Combined Bar */}
                {(() => {
                  if (!selectedNutrient) return null;
                  const target = getNutrientRecommendation(selectedNutrient) || getNutrientTarget(selectedNutrient);
                  const consumed = getTodayConsumed(selectedNutrient);
                  const foodValue = getNutrientValue(selectedNutrient, customGrams);
                  const totalAfter = getTotalAfterEating(selectedNutrient, customGrams);
                  const unit = getUnitForNutrient(selectedNutrient);
                  const overdosing = isOverdosing(selectedNutrient, customGrams);
                  const exceedingTarget = isExceedingTarget(selectedNutrient, customGrams);
                  
                  // Calculate percentages for the combined bar
                  const consumedPercentage = target ? (consumed / target) * 100 : 0;
                  const totalPercentage = target ? (totalAfter / target) * 100 : 0;
                  
                  return (
                    <div className={`p-4 rounded-lg border ${
                      overdosing 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : exceedingTarget
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Today's Progress</p>
                      
                      {/* Combined Progress Bar */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600 dark:text-green-400 font-medium">Already consumed: {consumed.toFixed(1)} {unit}</span>
                          <span className={`font-medium ${
                            overdosing ? 'text-red-600 dark:text-red-400' 
                            : exceedingTarget ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-blue-600 dark:text-blue-400'
                          }`}>This serving: {foodValue.toFixed(1)} {unit}</span>
                        </div>
                        
                        {/* Single combined bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div className="flex h-full">
                            {/* Already consumed (green) */}
                            <div
                              className="bg-green-500 h-full transition-all"
                              style={{ width: `${Math.min(consumedPercentage, 100)}%` }}
                            ></div>
                            {/* This food (blue/yellow/red based on status) */}
                            <div
                              className={`h-full transition-all ${
                                overdosing ? 'bg-red-500' : exceedingTarget ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(Math.max(0, totalPercentage - consumedPercentage), 100 - Math.min(consumedPercentage, 100))}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            Total after eating: <span className="font-semibold text-[var(--color-text-primary)]">{totalAfter.toFixed(1)} {unit}</span>
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {totalPercentage.toFixed(1)}% of target
                            {!target && <span className="text-orange-500 ml-1">(no target)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Target Exceeded Warning (Yellow) */}
                {selectedNutrient && !isOverdosing(selectedNutrient, customGrams) && isExceedingTarget(selectedNutrient, customGrams) && (
                  <div className="p-4 rounded-lg bg-yellow-500/20 border-2 border-yellow-500">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                          ⚠️ Would Exceed Daily Target
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                          <strong>Today consumed:</strong> {getTodayConsumed(selectedNutrient).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong>This serving ({customGrams}g):</strong> +{getNutrientValue(selectedNutrient, customGrams).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong>Total after eating:</strong> {getTotalAfterEating(selectedNutrient, customGrams).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong className="text-yellow-800 dark:text-yellow-300">Daily target:</strong> {(getNutrientRecommendation(selectedNutrient) || getNutrientTarget(selectedNutrient))} {getUnitForNutrient(selectedNutrient)}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 italic">
                          💡 You would exceed your recommended daily intake. Consider a smaller portion if you want to stay within your target.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overdose Warning (Red) */}
                {selectedNutrient && isOverdosing(selectedNutrient, customGrams) && getNutrientMaximum(selectedNutrient) && (
                  <div className="p-4 rounded-lg bg-red-500/20 border-2 border-red-500 animate-pulse">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">
                          ⚠️ Would Exceed Safe Maximum!
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                          <strong>Today consumed:</strong> {getTodayConsumed(selectedNutrient).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong>This serving ({customGrams}g):</strong> +{getNutrientValue(selectedNutrient, customGrams).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong>Total after eating:</strong> {getTotalAfterEating(selectedNutrient, customGrams).toFixed(1)} {getUnitForNutrient(selectedNutrient)}
                          <br />
                          <strong className="text-red-700 dark:text-red-300">Safe maximum:</strong> {getNutrientMaximum(selectedNutrient)} {getUnitForNutrient(selectedNutrient)}
                        </p>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-red-600 dark:text-red-400">Total % of Safe Maximum</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {getPercentageOfMaximum(selectedNutrient, customGrams)?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-red-200 dark:bg-red-900/30 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(getPercentageOfMaximum(selectedNutrient, customGrams) || 0, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 italic">
                          ⚠️ Eating this food would push you over the safe daily limit. Consider a smaller portion or skip this food today.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-secondary)] text-center">
                  Recommendations are personalized based on your profile and goals.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDetail;

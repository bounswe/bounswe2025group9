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
  const [recommendations, setRecommendations] = useState<{
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    micronutrients: {
      [key: string]: number | { target: number; maximum: number };
    };
  } | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<{
    micronutrients_summary: { [key: string]: number };
  } | null>(null);

  // Fetch recommendations and today's log when modal opens
  useEffect(() => {
    if (open && !recommendations && !loadingRecommendations) {
      fetchRecommendations();
      fetchTodayLog();
    }
  }, [open]);

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

  const handleHelpClick = (nutrient: string) => {
    setSelectedNutrient(nutrient);
    setShowRecommendations(true);
  };

  const closeRecommendationsModal = () => {
    setShowRecommendations(false);
    setSelectedNutrient(null);
  };

  const getNutrientRecommendation = (nutrient: string): number | null => {
    if (!recommendations) return null;
    switch (nutrient) {
      case 'calories':
        return recommendations.calories;
      case 'protein':
        return recommendations.protein;
      case 'fat':
        return recommendations.fat;
      case 'carbs':
        return recommendations.carbohydrates;
      default:
        return null;
    }
  };

  const getNutrientValue = (nutrient: string): number => {
    if (!food) return 0;
    switch (nutrient) {
      case 'calories':
        return food.caloriesPerServing;
      case 'protein':
        return food.proteinContent;
      case 'fat':
        return food.fatContent;
      case 'carbs':
        return food.carbohydrateContent;
      default:
        // Check if it's a micronutrient
        if (food.micronutrients && food.micronutrients[nutrient]) {
          return food.micronutrients[nutrient].value;
        }
        return 0;
    }
  };

  const getPercentageOfDaily = (nutrient: string): number | null => {
    const recommendation = getNutrientRecommendation(nutrient) || getNutrientTarget(nutrient);
    if (!recommendation) return null;
    const value = getNutrientValue(nutrient);
    return (value / recommendation) * 100;
  };

  const getNutrientMaximum = (nutrient: string): number | null => {
    if (!recommendations) return null;
    
    // For macronutrients, no toxic upper limits
    if (nutrient === 'calories' || nutrient === 'protein' || nutrient === 'fat' || nutrient === 'carbs') {
      return null;
    }
    
    // For micronutrients, check the micronutrients object
    const micronutrient = recommendations.micronutrients?.[nutrient];
    if (micronutrient && typeof micronutrient === 'object' && 'maximum' in micronutrient) {
      return micronutrient.maximum;
    }
    
    return null;
  };

  const getNutrientTarget = (nutrient: string): number | null => {
    if (!recommendations) return null;
    
    // For micronutrients
    const micronutrient = recommendations.micronutrients?.[nutrient];
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

  const isExceedingTarget = (nutrient: string): boolean => {
    const target = getNutrientRecommendation(nutrient) || getNutrientTarget(nutrient);
    if (!target) return false;
    
    const todayConsumed = todayLog?.micronutrients_summary?.[nutrient] || 0;
    const foodAmount = getNutrientValue(nutrient);
    const totalAfterEating = todayConsumed + foodAmount;
    
    return totalAfterEating > target;
  };

  const isOverdosing = (nutrient: string): boolean => {
    const maximum = getNutrientMaximum(nutrient);
    if (!maximum) return false; // No maximum means no overdose risk
    
    // Get today's consumed amount
    const todayConsumed = todayLog?.micronutrients_summary?.[nutrient] || 0;
    
    // Get this food's amount
    const foodAmount = getNutrientValue(nutrient);
    
    // Check if today's total + this food would exceed maximum
    const totalAfterEating = todayConsumed + foodAmount;
    
    return totalAfterEating > maximum;
  };

  const getPercentageOfMaximum = (nutrient: string): number | null => {
    const maximum = getNutrientMaximum(nutrient);
    if (!maximum) return null;
    
    // Calculate based on total after eating this food
    const todayConsumed = todayLog?.micronutrients_summary?.[nutrient] || 0;
    const foodAmount = getNutrientValue(nutrient);
    const totalAfterEating = todayConsumed + foodAmount;
    
    return (totalAfterEating / maximum) * 100;
  };

  const getTodayConsumed = (nutrient: string): number => {
    return todayLog?.micronutrients_summary?.[nutrient] || 0;
  };

  const getTotalAfterEating = (nutrient: string): number => {
    const todayConsumed = getTodayConsumed(nutrient);
    const foodAmount = getNutrientValue(nutrient);
    return todayConsumed + foodAmount;
  };

  const getUnitForNutrient = (nutrient: string): string => {
    // Extract unit from nutrient name (e.g., "Copper, Cu (mg)" -> "mg")
    const match = nutrient.match(/\(([^)]+)\)$/);
    return match ? match[1] : 'g';
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
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">Serving Size</p>
                <p className="font-medium text-[var(--color-text-primary)] mt-1">{food.servingSize}g</p>
              </div>
            </div>
          </div>
            
          {/* Nutrition Information - Per 100g */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Fire size={20} weight="fill" className="text-[var(--color-accent)]" />
              Nutrition Information (per 100g)
            </h3>
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={() => handleHelpClick('calories')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.caloriesPerServing} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={() => handleHelpClick('protein')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.proteinContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={() => handleHelpClick('fat')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.fatContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center relative">
                <button
                  onClick={() => handleHelpClick('carbs')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                  title="View daily recommendation"
                >
                  <Question size={14} weight="bold" className="text-white" />
                </button>
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-green-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.carbohydrateContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Carbs</p>
              </div>
            </div>
          </div>

          {/* Micronutrients Section */}
          {displayedMicronutrients.length > 0 && (
            <div className="mb-8">
              <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
                <Pill size={20} weight="fill" className="text-[var(--color-accent)]" />
                Micronutrients (per 100g)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedMicronutrients.map(([nutrient, amount, unit]) => {
                  // Remove only the unit part (last parentheses) from the name
                  const nutrientName = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();

                  return (
                    <div
                      key={nutrient}
                      className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex justify-between items-center relative"
                    >
                      <button
                        onClick={() => handleHelpClick(nutrient)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors z-10"
                        title="View daily recommendation"
                      >
                        <Question size={12} weight="bold" className="text-white" />
                      </button>
                      <span className="text-[var(--color-text-secondary)] text-sm flex-1">{nutrientName}</span>
                      <span className="font-semibold text-[var(--color-text-primary)] ml-2 pr-8">
                        {amount}{unit}
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
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">Your Daily Target</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {getNutrientRecommendation(selectedNutrient) || getNutrientTarget(selectedNutrient)}
                    {selectedNutrient === 'calories' ? ' kcal' : selectedNutrient.includes('(') ? '' : 'g'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {selectedNutrient === 'carbs' ? 'Carbohydrates' : selectedNutrient}
                  </p>
                  {getNutrientMaximum(selectedNutrient) && (
                    <p className="text-xs text-orange-500 mt-2">
                      Safe Maximum: {getNutrientMaximum(selectedNutrient)}
                      {selectedNutrient.includes('(') ? '' : 'g'}
                    </p>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${
                  isOverdosing(selectedNutrient) 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : isExceedingTarget(selectedNutrient)
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">This Serving Provides</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">
                    {getNutrientValue(selectedNutrient).toFixed(1)}
                    {selectedNutrient === 'calories' ? ' kcal' : selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--color-text-secondary)]">% of Daily Target</span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {getPercentageOfDaily(selectedNutrient)?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOverdosing(selectedNutrient) ? 'bg-red-500' : isExceedingTarget(selectedNutrient) ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(getPercentageOfDaily(selectedNutrient) || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Target Exceeded Warning (Yellow) */}
                {!isOverdosing(selectedNutrient) && isExceedingTarget(selectedNutrient) && (
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
                          <strong>Today consumed:</strong> {getTodayConsumed(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong>This serving:</strong> +{getNutrientValue(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong>Total after eating:</strong> {getTotalAfterEating(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong className="text-yellow-800 dark:text-yellow-300">Daily target:</strong> {(getNutrientRecommendation(selectedNutrient) || getNutrientTarget(selectedNutrient))}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 italic">
                          💡 You would exceed your recommended daily intake. Consider a smaller portion if you want to stay within your target.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overdose Warning (Red) */}
                {isOverdosing(selectedNutrient) && getNutrientMaximum(selectedNutrient) && (
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
                          <strong>Today consumed:</strong> {getTodayConsumed(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong>This serving:</strong> +{getNutrientValue(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong>Total after eating:</strong> {getTotalAfterEating(selectedNutrient).toFixed(1)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                          <br />
                          <strong className="text-red-700 dark:text-red-300">Safe maximum:</strong> {getNutrientMaximum(selectedNutrient)}{selectedNutrient.includes('(') ? getUnitForNutrient(selectedNutrient) : 'g'}
                        </p>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-red-600 dark:text-red-400">Total % of Safe Maximum</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {getPercentageOfMaximum(selectedNutrient)?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-red-200 dark:bg-red-900/30 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(getPercentageOfMaximum(selectedNutrient) || 0, 100)}%` }}
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

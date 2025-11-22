import React from 'react';
import { X, Hamburger, Tag, Fire, Scales, Pill } from '@phosphor-icons/react';
import { Food } from '../../lib/apiClient';
import NutritionScore from '../../components/NutritionScore';

interface FoodDetailProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
}

const FoodDetail: React.FC<FoodDetailProps> = ({ food, open, onClose }) => {
  if (!food) return null;

  // Helper function to extract unit from nutrient name (last parentheses only)
  const extractUnit = (nutrientName: string): string => {
    // Match the last set of parentheses at the end of the string
    const match = nutrientName.match(/\(([^()]+)\)$/);
    return match ? match[1] : '';
  };

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
    "Water (g)",
    "Niacin (mg)",
    "Thiamin (mg)",
    "Retinol (g)",
    "Zinc, Zn (mg)",
    "Copper, Cu (mg)",
    "Riboflavin (mg)",
    "Sodium, Na (mg)",
    "Calcium, Ca (mg)",
    "Cholesterol (mg)",
    "Total Sugars (g)",
    "Vitamin B-6 (mg)",
    "Potassium, K (mg)",
    "Magnesium, Mg (mg)",
    "Phosphorus, P (mg)",
    "Selenium, Se (g)",
    "Vitamin B-12 (g)",
    "Choline, total (mg)",
    "Carotene, beta (g)",
    "Vitamin A, RAE (g)",
    "Vitamin D (D2 + D3) (g)",
    "Vitamin K (phylloquinone) (g)",
    "Fatty acids, total saturated (g)",
    "Vitamin E (alpha-tocopherol) (mg)",
    "Fatty acids, total monounsaturated (g)",
    "Fatty acids, total polyunsaturated (g)"
  ];

  // Filter and display only priority micronutrients that exist in the food data, sorted by normalized amount
  const displayedMicronutrients = food.micronutrients 
    ? priorityMicronutrients
        .filter(nutrient => food.micronutrients && nutrient in food.micronutrients)
        .map(nutrient => [nutrient, food.micronutrients![nutrient]] as [string, number])
        .sort((a, b) => {
          const unitA = extractUnit(a[0]);
          const unitB = extractUnit(b[0]);
          const normalizedA = normalizeAmount(a[1], unitA);
          const normalizedB = normalizeAmount(b[1], unitB);
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
            
          {/* Nutrition Information - Per Serving */}
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-[var(--color-text-primary)] mb-4 font-semibold text-lg">
              <Fire size={20} weight="fill" className="text-[var(--color-accent)]" />
              Nutrition Information (per {food.servingSize}g serving)
            </h3>
              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.caloriesPerServing} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.proteinContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.fatContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-green-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{food.carbohydrateContent}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Carbs</p>
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
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Fire size={24} weight="fill" className="text-red-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.caloriesPerServing / food.servingSize) * 100).toFixed(1)} kcal</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Calories</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.proteinContent / food.servingSize) * 100).toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Protein</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <div className="flex justify-center mb-2">
                  <Scales size={24} weight="fill" className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{((food.fatContent / food.servingSize) * 100).toFixed(1)}g</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Fat</p>
              </div>
                
              <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
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
                Micronutrients (per {food.servingSize}g serving)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedMicronutrients.map(([nutrient, amount]) => {
                  const unit = extractUnit(nutrient);
                  // Remove only the unit part (last parentheses) from the name
                  const nutrientName = nutrient.replace(/\s*\([^)]*\)\s*$/, '').trim();
                  
                  return (
                    <div 
                      key={nutrient}
                      className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex justify-between items-center"
                    >
                      <span className="text-[var(--color-text-secondary)] text-sm">{nutrientName}</span>
                      <span className="font-semibold text-[var(--color-text-primary)] ml-2">
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
    </div>
  );
};

export default FoodDetail;
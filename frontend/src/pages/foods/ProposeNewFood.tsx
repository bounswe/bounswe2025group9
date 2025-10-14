import React, { useState} from 'react';
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { FoodProposal, apiClient } from '../../lib/apiClient';

// Available dietary options
const dietaryOptions = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Sugar-Free',
  'Organic',
];

const ProposeNewFood: React.FC = () => {
  const navigate = useNavigate();
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!foodName.trim()) errors.foodName = 'Food name is required';
    if (!category.trim()) errors.category = 'Category is required';
    if (!servingSize || isNaN(Number(servingSize)) || Number(servingSize) <= 0) 
      errors.servingSize = 'Valid serving size is required';
    if (!calories || isNaN(Number(calories)) || Number(calories) < 0) 
      errors.calories = 'Valid calorie count is required';
    if (!protein || isNaN(Number(protein)) || Number(protein) < 0) 
      errors.protein = 'Valid protein content is required';
    if (!carbs || isNaN(Number(carbs)) || Number(carbs) < 0) 
      errors.carbs = 'Valid carbohydrate content is required';
    if (!fat || isNaN(Number(fat)) || Number(fat) < 0) 
      errors.fat = 'Valid fat content is required';
    
    if (imageUrl && !isValidUrl(imageUrl)) 
      errors.imageUrl = 'Please enter a valid URL';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const calculateNutritionScore = () => {
    // Calculating nutrition score following the backend logic
    const proteinValue = Number(protein);
    const carbsValue = Number(carbs);
    const fatValue = Number(fat);
  
    
    // 1. Protein content (30% of score)
    const proteinScore = Math.min(proteinValue / 10, 3) * (0.3 * 10 / 3);
    
    // 2. Carbohydrate quality (30% of score)
    let carbQualityScore = 1.5; // Default moderate score
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('vegetable') || lowerCategory.includes('fruit')) {
      carbQualityScore = 3; // Max score
    } else if (foodName.toLowerCase().includes('whole') && lowerCategory.includes('grain')) {
      carbQualityScore = 2.5; // Whole grains
    } else if (lowerCategory.includes('grain')) {
      carbQualityScore = 2; // Regular grains
    } else if (lowerCategory.includes('dairy')) {
      carbQualityScore = 1.5; // Dairy
    } else if (lowerCategory.includes('sweets') || lowerCategory.includes('snacks')) {
      carbQualityScore = 0.5; // Sweets and snacks
    }
    
    // Scale carb quality to 30% of total score
    carbQualityScore = carbQualityScore * (0.3 * 10 / 3);
    
    // 3. Nutrient balance (40% of score)
    const totalMacros = proteinValue * 4 + carbsValue * 4 + fatValue * 9;
    
    let nutrientBalanceScore = 0;
    if (totalMacros > 0) {
      // Calculate percentage of calories from each macro
      const proteinPct = (proteinValue * 4) / totalMacros;
      const carbsPct = (carbsValue * 4) / totalMacros;
      const fatPct = (fatValue * 9) / totalMacros;
      
      // Score for each macronutrient's balance
      let proteinBalance = 0.5;
      if (proteinPct >= 0.1 && proteinPct <= 0.35) {
        proteinBalance = 1.0; // Good range
      } else if (proteinPct > 0.35) {
        proteinBalance = 0.7; // Too high
      }
      
      let carbsBalance = 0.7;
      if (carbsPct >= 0.45 && carbsPct <= 0.65) {
        carbsBalance = 1.0; // Good range
      } else if (carbsPct > 0.65) {
        carbsBalance = 0.7; // Too high
      }
      
      let fatBalance = 0.7;
      if (fatPct >= 0.2 && fatPct <= 0.35) {
        fatBalance = 1.0; // Good range
      } else if (fatPct > 0.35) {
        fatBalance = 0.5; // Too high
      }
      
      // Combine the balance scores
      nutrientBalanceScore = (proteinBalance + carbsBalance + fatBalance) * (0.4 * 10 / 3);
    }
    
    // Calculate final score (0-10 scale)
    const finalScore = proteinScore + carbQualityScore + nutrientBalanceScore;
    
    // Cap at 10 and round to 2 decimal places
    return Math.round(Math.min(finalScore, 10.0) * 100) / 100;
  };

  const handleDietaryOptionsChange = (option: string) => {
    setSelectedDietaryOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const nutritionScore = calculateNutritionScore();
      
      const proposal: FoodProposal = {
        name: foodName,
        category: category,
        servingSize: Number(servingSize),
        caloriesPerServing: Number(calories),
        proteinContent: Number(protein),
        fatContent: Number(fat),
        carbohydrateContent: Number(carbs),
        dietaryOptions: selectedDietaryOptions,
        nutritionScore: nutritionScore,
        imageUrl: imageUrl || undefined,
      };
      
      await apiClient.proposeFood(proposal);
      setSuccess('Food proposal submitted successfully!');
      
      // Clear form or redirect after success
      setTimeout(() => {
        navigate('/foods');
      }, 2000);
    } catch (err) {
      console.error('Error submitting food proposal:', err);
      setError(`Failed to submit food proposal. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-12">
      <div className="nh-container">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - Empty */}
          <div className="w-full md:w-1/5"></div>

          {/* Middle column - Food Creation Form */}
          <div className="w-full md:w-3/5">
            <div className="nh-card">
              <div className="flex justify-start items-center gap-6 mb-2">
                <button 
                  onClick={() => navigate('/foods')}
                  className="nh-button-square nh-button-primary flex items-center gap-2 px-2 py-2"
                >
                  <ArrowLeft size={20} weight="bold" /> 
                </button>
                <div className="flex justify-center items-center">
                  <h1 className="nh-title-custom">Propose New Food</h1>
                </div>
              </div>

              {/* Display success message if present */}
              {success && (
                <div 
                  className="px-4 py-3 rounded-md mb-6 flex items-start gap-2 border"
                  style={{
                    backgroundColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.1)',
                    borderColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.3)',
                    color: 'var(--color-success)'
                  }}
                >
                  <span>{success}</span>
                </div>
              )}
              
              {/* Display validation error if present */}
              {error && (
                <div className="nh-error-message mb-6">
                  <WarningCircle size={20} className="flex-shrink-0 mt-0.5 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} id="proposeFoodForm">
                {/* Basic Information */}
                <div className="mb-6">
                  <h2 className="nh-subtitle mb-4">Basic Information</h2>
                  
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">
                      Food Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      placeholder="Enter food name"
                      required
                    />
                    {validationErrors.foodName && (
                      <p className="mt-1 text-red-500 text-sm">{validationErrors.foodName}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">
                      Food Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="E.g., Fruits, Vegetables, Grains, etc."
                      required
                    />
                    {validationErrors.category && (
                      <p className="mt-1 text-red-500 text-sm">{validationErrors.category}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-2 font-medium">
                        Serving Size (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        placeholder="100"
                        min="1"
                        required
                      />
                      {validationErrors.servingSize && (
                        <p className="mt-1 text-red-500 text-sm">{validationErrors.servingSize}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Calories per Serving <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {validationErrors.calories && (
                        <p className="mt-1 text-red-500 text-sm">{validationErrors.calories}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Macronutrients */}
                <div className="mb-6">
                  <h2 className="nh-subtitle mb-4">Macronutrients (per serving)</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 font-medium">
                        Carbohydrates (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {validationErrors.carbs && (
                        <p className="mt-1 text-red-500 text-sm">{validationErrors.carbs}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Protein (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {validationErrors.protein && (
                        <p className="mt-1 text-red-500 text-sm">{validationErrors.protein}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Fat (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                      />
                      {validationErrors.fat && (
                        <p className="mt-1 text-red-500 text-sm">{validationErrors.fat}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dietary Information */}
                <div className="mb-6">
                  <h2 className="nh-subtitle mb-4">Dietary Information</h2>
                  
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">
                      Dietary Options
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dietaryOptions.map((option) => (
                        <div 
                          key={option}
                          className="px-3 py-2 rounded-full cursor-pointer border transition-colors"
                          style={{
                            backgroundColor: selectedDietaryOptions.includes(option)
                              ? 'var(--dietary-option-selected-bg)'
                              : 'var(--dietary-option-bg)',
                            color: selectedDietaryOptions.includes(option)
                              ? 'var(--dietary-option-selected-text)'
                              : 'var(--dietary-option-text)',
                            borderColor: selectedDietaryOptions.includes(option)
                              ? 'var(--dietary-option-selected-border)'
                              : 'var(--dietary-option-border)'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedDietaryOptions.includes(option)) {
                              e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedDietaryOptions.includes(option)) {
                              e.currentTarget.style.backgroundColor = 'var(--dietary-option-bg)';
                            }
                          }}
                          onClick={() => handleDietaryOptionsChange(option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image URL */}
                <div className="mb-6">
                  <h2 className="nh-subtitle mb-4">Additional Information</h2>
                  
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">
                      Image URL (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md bg-[var(--forum-search-bg)] border-[var(--forum-search-border)] text-[var(--forum-search-text)] placeholder:text-[var(--forum-search-placeholder)] focus:ring-1 focus:ring-[var(--forum-search-focus-ring)] focus:border-[var(--forum-search-focus-border)]"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {validationErrors.imageUrl && (
                      <p className="mt-1 text-red-500 text-sm">{validationErrors.imageUrl}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">Provide a URL to an image of this food (optional)</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end items-center mt-6 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/foods')}
                    className="nh-button nh-button-secondary flex items-center gap-2 px-6 py-2"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="nh-button nh-button-primary flex items-center gap-2 px-6 py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right column - Empty */}
          <div className="w-full md:w-1/5"></div>
        </div>
      </div>
    </div>
  );
};

export default ProposeNewFood;

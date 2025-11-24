import { useState, useEffect, useCallback } from 'react';
import { Food } from '../../lib/apiClient';
import FoodDetail from '../foods/FoodDetail';
import FoodSelector from '../../components/FoodSelector';
import { PencilSimple, Funnel, CalendarBlank, Hamburger, ForkKnife } from '@phosphor-icons/react';
import {apiClient} from '../../lib/apiClient';
import { Brocolli, Goat, Pork, ChickenBreast, Beef, RiceNoodles, Anchovies, Tilapia, RiceCakes, Egg, MultigrainBread, Oatmeal, Tofu, LentilSoup, Quinoa, GreekYogurt, CottageCheese } from './MockFoods';

interface weeklyMealPlan {
    [key: string]: [Food, Food, Food];
}

// Predefined meal plans using mock foods
let MealPlans : { [key:string] : weeklyMealPlan} = {
    'halal' : {
        monday: [Egg, ChickenBreast, Tilapia], 
        tuesday: [MultigrainBread, Goat, RiceNoodles], 
        wednesday: [Oatmeal, Anchovies, ChickenBreast], 
        thursday: [Egg, Goat, Tilapia], 
        friday: [MultigrainBread, ChickenBreast, RiceNoodles], 
        saturday: [Oatmeal, Goat, Anchovies], 
        sunday: [Egg, Tilapia, ChickenBreast]
    },
    'vegan' : {
        monday: [Oatmeal, Tofu, Brocolli], 
        tuesday: [MultigrainBread, LentilSoup, Quinoa], 
        wednesday: [RiceCakes, Tofu, Brocolli], 
        thursday: [Oatmeal, LentilSoup, Quinoa], 
        friday: [MultigrainBread, Tofu, Brocolli], 
        saturday: [RiceCakes, LentilSoup, Quinoa], 
        sunday: [Oatmeal, Tofu, Brocolli]
    },
    'high-protein' : {
        monday: [Egg, Beef, ChickenBreast], 
        tuesday: [GreekYogurt, Pork, Goat], 
        wednesday: [CottageCheese, Beef, ChickenBreast], 
        thursday: [Egg, Pork, Goat], 
        friday: [GreekYogurt, Beef, ChickenBreast], 
        saturday: [CottageCheese, Pork, Goat], 
        sunday: [Egg, Beef, ChickenBreast]
    },
};

interface MealPlannerProps {
  profileLayout?: boolean; // When true, moves left sidebar to right
  dietaryPreference?: string;
  setDietaryPreference?: (pref: string) => void;
  planDuration?: 'weekly' | 'daily';
  setPlanDuration?: (duration: 'weekly' | 'daily') => void;
  onSaveRef?: React.MutableRefObject<(() => void) | null>; // Ref to expose save handler
  onLogRef?: React.MutableRefObject<(() => void) | null>; // Ref to expose log handler
}

const MealPlanner = ({ 
  profileLayout = false,
  dietaryPreference: externalDietaryPreference,
  setDietaryPreference: externalSetDietaryPreference,
  planDuration: externalPlanDuration,
  setPlanDuration: externalSetPlanDuration,
  onSaveRef,
  onLogRef
}: MealPlannerProps = {}) => {
    const [internalDietaryPreference, setInternalDietaryPreference] = useState('high-protein');
    const [internalPlanDuration, setInternalPlanDuration] = useState<'weekly' | 'daily'>('weekly');
    
    // Use external state if provided, otherwise use internal state
    const dietaryPreference = externalDietaryPreference ?? internalDietaryPreference;
    const setDietaryPreference = externalSetDietaryPreference ?? setInternalDietaryPreference;
    const planDuration = externalPlanDuration ?? internalPlanDuration;
    const setPlanDuration = externalSetPlanDuration ?? setInternalPlanDuration;
    
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [editingMeal, setEditingMeal] = useState<{day: string, index: number} | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const [savedMealPlanId, setSavedMealPlanId] = useState<number | null>(null);
    
    // Initialize with predefined meal plans (now using real database food IDs)
    const [localMealPlans, setLocalMealPlans] = useState<{ [key:string] : weeklyMealPlan}>(MealPlans);
    
    // Store serving sizes for each meal: { [dietaryPreference]: { [day]: [size1, size2, size3] } }
    const [servingSizes, setServingSizes] = useState<{ [key: string]: { [key: string]: number[] } }>({});
    
    // Store nutrition targets
    const [nutritionTargets, setNutritionTargets] = useState<{ calories: number; protein: number; carbohydrates: number; fat: number } | null>(null);

    const handleFoodSelect = (food: Food) => {
        if (editingMeal) {
            const { day, index } = editingMeal;
            const newMealPlans = { ...localMealPlans };
            newMealPlans[dietaryPreference][day.toLowerCase() as keyof weeklyMealPlan][index] = food;
            setLocalMealPlans(newMealPlans);
        }
    };

    // Helper function to calculate optimal serving sizes for a day to meet nutrition targets
    const calculateOptimalServingSizes = useCallback((
        dayMeals: Food[],
        dailyCaloriesTarget: number,
        dailyProteinTarget: number,
        dailyCarbsTarget: number,
        dailyFatTarget: number
    ): number[] => {
        // Calculate current nutrition with serving_size = 1
        let currentCalories = 0;
        let currentProtein = 0;
        let currentCarbs = 0;
        let currentFat = 0;
        
        dayMeals.forEach(food => {
            if (food) {
                currentCalories += food.caloriesPerServing || 0;
                currentProtein += food.proteinContent || 0;
                currentCarbs += food.carbohydrateContent || 0;
                currentFat += food.fatContent || 0;
            }
        });
        
        // Calculate what we need
        const proteinNeeded = Math.max(0, dailyProteinTarget - currentProtein);
        
        // If we already meet or exceed targets significantly, use base serving size of 1
        if (currentCalories >= dailyCaloriesTarget * 0.95 && currentProtein >= dailyProteinTarget * 0.9) {
            return dayMeals.map(() => 1.0);
        }
        
        // Calculate primary scaling factor based on calories (most important)
        let baseScale = 1.0;
        if (currentCalories > 0) {
            // Scale to reach target calories, with a small buffer (5%) to ensure we meet target
            baseScale = (dailyCaloriesTarget * 1.05) / currentCalories;
        } else {
            // If no calories, use aggressive default
            baseScale = 5.0;
        }
        
        // Calculate serving sizes for each meal to distribute the needed nutrition
        const servingSizes = dayMeals.map((food) => {
            if (!food || !food.id) return 1.0;
            
            // Start with base calorie scaling, but distribute across meals
            // Each meal gets a portion of the scaling based on its calorie contribution
            const foodCalories = food.caloriesPerServing || 0;
            const foodProtein = food.proteinContent || 0;
            
            // Calculate how much each meal should contribute to targets
            // Distribute targets evenly across meals (3 meals per day)
            const targetCaloriesPerMeal = dailyCaloriesTarget / 3;
            const targetProteinPerMeal = dailyProteinTarget / 3;
            
            // Start with calorie-based scaling for this specific food
            let servingSize = 1.0;
            if (foodCalories > 0) {
                // Scale to reach target calories for this meal
                servingSize = Math.max(servingSize, targetCaloriesPerMeal / foodCalories);
            }
            
            // Also consider protein needs
            if (foodProtein > 0 && proteinNeeded > 0) {
                const proteinScale = (targetProteinPerMeal * 1.1) / foodProtein; // 10% buffer
                servingSize = Math.max(servingSize, proteinScale);
            }
            
            // If current total is still too low, use the overall base scale
            if (currentCalories < dailyCaloriesTarget * 0.8) {
                // Scale all foods proportionally to fill the gap
                servingSize = Math.max(servingSize, baseScale);
            }
            
            // Ensure we don't have unreasonably large or small servings
            // Allow larger servings (up to 12x) if needed to meet daily targets
            servingSize = Math.max(0.5, Math.min(servingSize, 12.0));
            
            return Math.round(servingSize * 100) / 100; // Round to 2 decimal places
        });
        
        // Verify the totals and adjust if still too low - ENSURE we meet targets for THIS DAY
        let totalCal = 0;
        let totalProt = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        servingSizes.forEach((size, index) => {
            const food = dayMeals[index];
            if (food) {
                totalCal += (food.caloriesPerServing || 0) * size;
                totalProt += (food.proteinContent || 0) * size;
                totalCarbs += (food.carbohydrateContent || 0) * size;
                totalFat += (food.fatContent || 0) * size;
            }
        });
        
        // CRITICAL: Scale up to ensure THIS DAY meets targets (not weekly average)
        // Target is 95-105% of daily target for each day
        if (totalCal < dailyCaloriesTarget * 0.95) {
            // Calculate scale needed to reach target
            const calorieScale = (dailyCaloriesTarget * 1.02) / totalCal; // 2% buffer
            
            // Also check macros
            let proteinScale = 1.0;
            if (totalProt < dailyProteinTarget * 0.95) {
                proteinScale = (dailyProteinTarget * 1.02) / totalProt;
            }
            
            let carbsScale = 1.0;
            if (totalCarbs < dailyCarbsTarget * 0.95) {
                carbsScale = (dailyCarbsTarget * 1.02) / totalCarbs;
            }
            
            let fatScale = 1.0;
            if (totalFat < dailyFatTarget * 0.95) {
                fatScale = (dailyFatTarget * 1.02) / totalFat;
            }
            
            // Use the maximum scale needed (to meet all targets)
            const finalScale = Math.max(calorieScale, proteinScale, carbsScale, fatScale);
            
            return servingSizes.map(size => {
                const finalSize = size * finalScale;
                // Increase max to 12x if needed to meet daily targets
                return Math.round(Math.max(0.5, Math.min(finalSize, 12.0)) * 100) / 100;
            });
        }
        
        return servingSizes;
    }, []);

    const handleSaveMealPlan = useCallback(async () => {
        setErrorMessage('');
        setSuccessMessage('');
        
        // Build meal plan data from localMealPlans
        // Use serving sizes already calculated and stored in state
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        const weeklyPlan = localMealPlans[dietaryPreference];
        const meals: { food_id: number; serving_size: number; meal_type: string }[] = [];
        const invalidFoods: string[] = [];
        
        // Calculate optimal serving sizes for each day
        const daysToProcess = planDuration === 'daily' 
            ? [days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]] // Today only
            : days; // All days
        
        for (const day of daysToProcess) {
            const dayMeals = weeklyPlan[day as keyof typeof weeklyPlan];
            
            // Filter out invalid foods first
            const validDayMeals: Food[] = [];
            dayMeals.forEach((food, index) => {
                if (food && food.id) {
                    validDayMeals.push(food);
                } else {
                    invalidFoods.push(`${day} ${mealTypes[index]}: ${food?.name || 'Unknown'}`);
                }
            });
            
            // If we have valid meals, use serving sizes from state (already calculated)
            if (validDayMeals.length > 0) {
                const dayServingSizes = servingSizes[dietaryPreference]?.[day] || [1, 1, 1];
                
                // Add meals with calculated serving sizes
                validDayMeals.forEach((food, index) => {
                    meals.push({
                        food_id: food.id,
                        serving_size: dayServingSizes[index] || 1,
                        meal_type: mealTypes[index].toLowerCase()
                    });
                });
            }
        }
        
        // Check if we have any valid meals
        if (meals.length === 0) {
            setErrorMessage('Cannot save meal plan: No valid foods found. Please replace preset foods with foods from the database by clicking the edit button.');
            setSuccessMessage('');
            setTimeout(() => setErrorMessage(''), 7000);
            return;
        }
        
        // Show warning if some foods were filtered out
        if (invalidFoods.length > 0) {
            console.warn('Some foods were filtered out:', invalidFoods);
            setErrorMessage(`Note: ${invalidFoods.length} preset food(s) not found in database. Saving meal plan with ${meals.length} valid meal(s).`);
            setTimeout(() => setErrorMessage(''), 5000);
        }
        
        const mealPlanData = {
            name: `${dietaryPreference} meal plan`,
            meals
        };

        try {
            const newPlan = await apiClient.createMealPlan(mealPlanData);
            console.log('Meal plan created:', newPlan);
            setSavedMealPlanId(newPlan.id);
            await apiClient.setCurrentMealPlan(newPlan.id);
            setSuccessMessage('Meal plan saved successfully with optimized serving sizes to meet your nutrition targets!');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            console.error('Error saving meal plan:', err);
            setSuccessMessage('');
            
            // Parse validation errors for food IDs
            if (err?.response?.data?.meals) {
                const mealErrors = err.response.data.meals;
                const invalidCount = mealErrors.filter((mealError: any) => mealError?.food_id).length;
                
                if (invalidCount > 0) {
                    setErrorMessage(`Cannot save: ${invalidCount} preset food(s) don't exist in the database. Please click the edit button (pencil icon) to replace them with foods from the database.`);
                } else {
                    setErrorMessage('Failed to save meal plan. Some preset foods may not exist in the database. Please replace them with foods from the database.');
                }
            } else {
                setErrorMessage('Failed to save meal plan. Please try again or replace preset foods with foods from the database.');
            }
            setTimeout(() => setErrorMessage(''), 7000);
        }
    }, [dietaryPreference, localMealPlans, planDuration]);

    const logMealPlan = useCallback(async (planId: number) => {
        setIsLogging(true);
        try {
            await apiClient.logMealPlanToNutrition(planId);
            setSuccessMessage('Meals logged to nutrition tracking successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error logging meals to nutrition:', err);
            setSuccessMessage('Failed to log meals. Please try again.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally {
            setIsLogging(false);
        }
    }, [dietaryPreference, localMealPlans, savedMealPlanId]);

    const handleLogToNutrition = useCallback(async () => {
        if (!savedMealPlanId) {
            // If no saved plan, save it first with optimized serving sizes, then log
            try {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
                const weeklyPlan = localMealPlans[dietaryPreference];
                const meals: { food_id: number; serving_size: number; meal_type: string }[] = [];
                
                // Get today's day
                const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                const today = days[todayIndex];
                
                // Get today's meals
                const dayMeals = weeklyPlan[today as keyof typeof weeklyPlan];
                const validDayMeals = dayMeals.filter(food => food && food.id);
                
                if (validDayMeals.length > 0) {
                    // Use serving sizes from state (already calculated)
                    const dayServingSizes = servingSizes[dietaryPreference]?.[today] || [1, 1, 1];
                    
                    // Add today's meals with calculated serving sizes
                    validDayMeals.forEach((food, index) => {
                        meals.push({
                            food_id: food.id,
                            serving_size: dayServingSizes[index] || 1,
                            meal_type: mealTypes[index].toLowerCase()
                        });
                    });
                }
                
                const mealPlanData = {
                    name: `${dietaryPreference} meal plan`,
                    meals
                };
                
                const newPlan = await apiClient.createMealPlan(mealPlanData);
                setSavedMealPlanId(newPlan.id);
                await apiClient.setCurrentMealPlan(newPlan.id);
                // Now log it
                await logMealPlan(newPlan.id);
            } catch (err) {
                console.error('Error saving and logging meal plan:', err);
                setSuccessMessage('Failed to save and log meals. Please try again.');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
            return;
        }
        await logMealPlan(savedMealPlanId);
    }, [savedMealPlanId, dietaryPreference, localMealPlans, servingSizes, logMealPlan]);

    // Expose save handler via ref if provided
    useEffect(() => {
        if (onSaveRef) {
            onSaveRef.current = handleSaveMealPlan;
        }
    }, [onSaveRef, handleSaveMealPlan]);

    // Expose log handler via ref if provided
    useEffect(() => {
        if (onLogRef) {
            onLogRef.current = handleLogToNutrition;
        }
    }, [onLogRef, handleLogToNutrition]);

    // Fetch nutrition targets on component mount
    useEffect(() => {
        const fetchTargets = async () => {
            try {
                const targets = await apiClient.getNutritionTargets();
                setNutritionTargets({
                    calories: targets.calories,
                    protein: targets.protein,
                    carbohydrates: targets.carbohydrates,
                    fat: targets.fat
                });
            } catch (error) {
                console.warn('Could not fetch nutrition targets:', error);
                // Use default targets
                setNutritionTargets({
                    calories: 2000,
                    protein: 150,
                    carbohydrates: 250,
                    fat: 67
                });
            }
        };
        fetchTargets();
    }, []);

    // Calculate and update serving sizes when meal plans or nutrition targets change
    useEffect(() => {
        if (!nutritionTargets) return;
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const weeklyPlan = localMealPlans[dietaryPreference];
        const newServingSizes: { [key: string]: number[] } = {};
        
        // Calculate serving sizes for EACH DAY individually to meet daily targets
        days.forEach(day => {
            const dayMeals = weeklyPlan[day.toLowerCase() as keyof typeof weeklyPlan];
            const validDayMeals = dayMeals.filter(food => food && food.id);
            
            if (validDayMeals.length > 0) {
                // Calculate serving sizes to meet DAILY targets (not weekly)
                const sizes = calculateOptimalServingSizes(
                    validDayMeals,
                    nutritionTargets.calories, // Daily target
                    nutritionTargets.protein,  // Daily target
                    nutritionTargets.carbohydrates, // Daily target
                    nutritionTargets.fat // Daily target
                );
                newServingSizes[day] = sizes;
            } else {
                newServingSizes[day] = [1, 1, 1];
            }
        });
        
        setServingSizes(prev => ({
            ...prev,
            [dietaryPreference]: newServingSizes
        }));
    }, [localMealPlans, dietaryPreference, nutritionTargets, calculateOptimalServingSizes]);

    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    
    // Get today's day name
    const getTodayDayName = () => {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, 6 = Sunday
        return allDays[dayIndex];
    };
    
    // Determine which days to show based on plan duration
    const days = planDuration === 'daily' ? [getTodayDayName()] : allDays;
    const planTitle = planDuration === 'daily' ? 'Daily Meal Plan' : 'Weekly Meal Plan';

    // Helper function to calculate macros for a specific day (using serving sizes)
    const calculateDayMacros = (day: string) => {
        const dayLower = day.toLowerCase();
        const dayMeals = localMealPlans[dietaryPreference][dayLower as keyof weeklyMealPlan];
        const dayServingSizes = servingSizes[dietaryPreference]?.[dayLower] || [1, 1, 1];
        
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        
        dayMeals.forEach((food, index) => {
            if (food) {
                const servingSize = dayServingSizes[index] || 1;
                calories += (food.caloriesPerServing || 0) * servingSize;
                protein += (food.proteinContent || 0) * servingSize;
                carbs += (food.carbohydrateContent || 0) * servingSize;
                fat += (food.fatContent || 0) * servingSize;
            }
        });
        
        return {
            calories: Math.round(calories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat)
        };
    };

    // Helper to get tag styles based on dietary preference
    const getTagStyle = (preference: string) => {
        switch (preference) {
            case 'vegan':
                return {
                    bg: 'var(--forum-vegan-bg)',
                    text: 'var(--forum-vegan-text)',
                    activeBg: 'var(--forum-vegan-active-bg)',
                    activeText: 'var(--forum-vegan-active-text)',
                    hoverBg: 'var(--forum-vegan-hover-bg)'
                };
            case 'halal':
                return {
                    bg: 'var(--forum-halal-bg)',
                    text: 'var(--forum-halal-text)',
                    activeBg: 'var(--forum-halal-active-bg)',
                    activeText: 'var(--forum-halal-active-text)',
                    hoverBg: 'var(--forum-halal-hover-bg)'
                };
            case 'high-protein':
                return {
                    bg: 'var(--forum-high-protein-bg)',
                    text: 'var(--forum-high-protein-text)',
                    activeBg: 'var(--forum-high-protein-active-bg)',
                    activeText: 'var(--forum-high-protein-active-text)',
                    hoverBg: 'var(--forum-high-protein-hover-bg)'
                };
            default:
                return {
                    bg: 'var(--forum-default-bg)',
                    text: 'var(--forum-default-text)',
                    activeBg: 'var(--forum-default-active-bg)',
                    activeText: 'var(--forum-default-active-text)',
                    hoverBg: 'var(--forum-default-hover-bg)'
                };
        }
    };

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                {/* Success message */}
                {successMessage && (
                    <div 
                        className="mb-4 px-4 py-3 rounded"
                        style={{
                            backgroundColor: 'var(--color-success)',
                            color: 'white',
                            border: '1px solid var(--color-success)'
                        }}
                    >
                        {successMessage}
                    </div>
                )}
                
                {/* Error message */}
                {errorMessage && (
                    <div 
                        className="mb-4 px-4 py-3 rounded"
                        style={{
                            backgroundColor: 'var(--color-error)',
                            color: 'white',
                            border: '1px solid var(--color-error)'
                        }}
                    >
                        {errorMessage}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Filters (only show if not profileLayout) */}
                    {!profileLayout && (
                        <div className="w-full md:w-1/5">
                            <div className="sticky top-20">
                                <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                                    <Funnel size={20} weight="fill" className="text-primary" />
                                    Dietary Preferences
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setDietaryPreference('high-protein')}
                                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                        style={{
                                            backgroundColor: dietaryPreference === 'high-protein'
                                                ? getTagStyle('high-protein').activeBg
                                                : getTagStyle('high-protein').bg,
                                            color: dietaryPreference === 'high-protein'
                                                ? getTagStyle('high-protein').activeText
                                                : getTagStyle('high-protein').text
                                        }}
                                    >
                                        <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
                                        <span className="flex-grow text-center">High-Protein</span>
                                    </button>

                                    <button
                                        onClick={() => setDietaryPreference('halal')}
                                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                        style={{
                                            backgroundColor: dietaryPreference === 'halal'
                                                ? getTagStyle('halal').activeBg
                                                : getTagStyle('halal').bg,
                                            color: dietaryPreference === 'halal'
                                                ? getTagStyle('halal').activeText
                                                : getTagStyle('halal').text
                                        }}
                                    >
                                        <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
                                        <span className="flex-grow text-center">Halal</span>
                                    </button>

                                    <button
                                        onClick={() => setDietaryPreference('vegan')}
                                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                                        style={{
                                            backgroundColor: dietaryPreference === 'vegan'
                                                ? getTagStyle('vegan').activeBg
                                                : getTagStyle('vegan').bg,
                                            color: dietaryPreference === 'vegan'
                                                ? getTagStyle('vegan').activeText
                                                : getTagStyle('vegan').text
                                        }}
                                    >
                                        <CalendarBlank size={18} weight="fill" className="flex-shrink-0" />
                                        <span className="flex-grow text-center">Vegan</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Middle column - Meal Plan */}
                    <div className={profileLayout ? "w-full" : "w-full md:w-3/5"}>
                        <div className="mb-6">
                            <h2 className="nh-title">{planTitle}</h2>
                            <p className="nh-text mt-2">
                                {planDuration === 'daily' 
                                    ? `Today's meals: Click on any meal to view details, or click the edit icon to change it.`
                                    : 'Click on any meal to view details, or click the edit icon to change it.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {days.map(day => {
                                const dayLower = day.toLowerCase();
                                const dayMacros = calculateDayMacros(day);
                                const dayServingSizes = servingSizes[dietaryPreference]?.[dayLower] || [1, 1, 1];
                                return (
                                <div key={day} className="nh-card">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                        <h3 className="nh-subtitle mb-0">{day}</h3>
                                        {/* Daily Macro Values */}
                                        <div className="flex items-center gap-3 text-xs nh-text opacity-75">
                                            <span>Calories: <strong className="text-primary">{dayMacros.calories}</strong></span>
                                            <span>Protein: <strong className="text-primary">{dayMacros.protein}g</strong></span>
                                            <span>Carbs: <strong className="text-primary">{dayMacros.carbs}g</strong></span>
                                            <span>Fat: <strong className="text-primary">{dayMacros.fat}g</strong></span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {meals.map((meal, i) => {
                                            const currentFood = localMealPlans[dietaryPreference][dayLower as keyof weeklyMealPlan][i];
                                            const servingSize = dayServingSizes[i] || 1;
                                            return (
                                                <div 
                                                    key={`${day}-${meal}`}
                                                    className="rounded-md p-3 border relative transition-all hover:shadow-md cursor-pointer"
                                                    style={{
                                                        backgroundColor: 'var(--dietary-option-bg)',
                                                        borderColor: 'var(--dietary-option-border)'
                                                    }}
                                                    onClick={() => setSelectedFood(currentFood)}
                                                >
                                                    <div 
                                                        className="text-xs font-medium mb-2"
                                                        style={{ color: 'var(--color-light)' }}
                                                    >
                                                        {meal}
                                                    </div>
                                                    
                                                    {/* Food Image */}
                                                    <div className="food-image-container h-20 w-full flex justify-center items-center mb-2 overflow-hidden rounded">
                                                        {currentFood.imageUrl ? (
                                                            <img
                                                                src={currentFood.imageUrl}
                                                                alt={currentFood.name}
                                                                className="object-contain max-h-14 max-w-full rounded"
                                                                onError={e => { console.log(currentFood.imageUrl); (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="food-image-placeholder w-full h-full flex items-center justify-center">
                                                                <Hamburger size={28} weight="fill" className="text-primary opacity-50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-sm font-medium nh-text mb-1">
                                                        {currentFood.name}
                                                    </div>
                                                    <div className="text-xs nh-text opacity-75">
                                                        {Math.round((currentFood.caloriesPerServing || 0) * servingSize)} kcal
                                                    </div>
                                                    
                                                <button
                                                        className="absolute top-2 right-2 p-1 rounded-full transition-all"
                                                        style={{
                                                            backgroundColor: 'var(--color-bg-secondary)',
                                                            boxShadow: 'var(--shadow-sm)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'var(--dietary-option-hover-bg)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                                        }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingMeal({ day, index: i });
                                                    }}
                                                >
                                                        <PencilSimple size={14} style={{ color: 'var(--color-primary)' }} />
                                                </button>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        
                    </div>

                    {/* Right column - Actions (only show if not profileLayout) */}
                    {!profileLayout && (
                        <div className="w-full md:w-1/5">
                            <div className="sticky top-20 flex flex-col gap-4">
                                <div className="nh-card">
                                    <h3 className="nh-subtitle mb-4 text-sm">Plan Settings</h3>
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex flex-col space-y-2">
                                            <label className="text-xs font-medium nh-text">Plan Duration</label>
                                            <select 
                                                value={planDuration}
                                                onChange={(e) => setPlanDuration(e.target.value as 'weekly' | 'daily')}
                                                className="w-full px-3 py-2 text-sm rounded-md border focus:ring-primary focus:border-primary nh-text"
                                                style={{
                                                    backgroundColor: 'var(--dietary-option-bg)',
                                                    borderColor: 'var(--dietary-option-border)'
                                                }}
                                            >
                                                <option value="weekly">Weekly</option>
                                                <option value="daily">Daily</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveMealPlan}
                                    className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium"
                                >
                                    Save Meal Plan
                                </button>

                                <button
                                    onClick={handleLogToNutrition}
                                    disabled={isLogging}
                                    className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ForkKnife size={20} weight="fill" />
                                    {isLogging ? 'Logging...' : 'Log Meal Plan'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <FoodDetail 
                    food={selectedFood}
                    open={!!selectedFood}
                    onClose={() => setSelectedFood(null)}
                />

                <FoodSelector
                    open={!!editingMeal}
                    onClose={() => setEditingMeal(null)}
                    onSelect={handleFoodSelect}
                />
            </div>
        </div>
    );
};

export default MealPlanner;


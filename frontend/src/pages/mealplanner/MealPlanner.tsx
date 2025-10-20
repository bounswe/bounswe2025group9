import { useState, useEffect } from 'react';
import { Food } from '../../lib/apiClient';
import FoodDetail from '../foods/FoodDetail';
import FoodSelector from '../../components/FoodSelector';
import { PencilSimple, Funnel, CalendarBlank, Hamburger } from '@phosphor-icons/react';
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

const MealPlanner = () => {
    const [dietaryPreference, setDietaryPreference] = useState('high-protein');
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [editingMeal, setEditingMeal] = useState<{day: string, index: number} | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
    const [loading, setLoading] = useState(true);
    const [planDuration, setPlanDuration] = useState<'weekly' | 'daily'>('weekly');
    
    // Initialize with predefined meal plans
    const [localMealPlans, setLocalMealPlans] = useState<{ [key:string] : weeklyMealPlan}>(MealPlans);

    // Fetch foods from backend for the food selector
    useEffect(() => {
        const fetchFoods = async () => {
            try {
                setLoading(true);
                
                // Fetch multiple pages to get more foods
                let allFoods: Food[] = [];
                for (let page = 1; page <= 20; page++) {
                    const response = await apiClient.getFoods({ page });
                    if (response.status === 200 && response.results.length > 0) {
                        allFoods = [...allFoods, ...response.results];
                        // Stop if we've fetched all available foods
                        if (!response.next) break;
                    } else {
                        break;
                    }
                }
                
                console.log('Total foods fetched:', allFoods.length);
                console.log('Sample food names:', allFoods.slice(0, 5).map(f => f.name));
                
                if (allFoods.length > 0) {
                    setAvailableFoods(allFoods);
                    
                    // Keep using the predefined MealPlans with our updated food variety
                    // The MealPlans already contain the proper foods for each diet
                    setLocalMealPlans(MealPlans);
                }
            } catch (error) {
                console.error('Error fetching foods:', error);
                // Fallback to predefined meal plans if backend fetch fails
                setLocalMealPlans(MealPlans);
            } finally {
                setLoading(false);
            }
        };
        
        fetchFoods();
    }, []);

    const handleFoodSelect = (food: Food) => {
        if (editingMeal) {
            const { day, index } = editingMeal;
            const newMealPlans = { ...localMealPlans };
            newMealPlans[dietaryPreference][day.toLowerCase() as keyof weeklyMealPlan][index] = food;
            setLocalMealPlans(newMealPlans);
        }
    };

    const handleSaveMealPlan = () => {
        // Build meal plan data from localMealPlans
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        const weeklyPlan = localMealPlans[dietaryPreference];
        const meals: { food_id: number; serving_size: number; meal_type: string }[] = [];
        for (const day of days) {
            const dayMeals = weeklyPlan[day as keyof typeof weeklyPlan];
            dayMeals.forEach((food, index) => {
                meals.push({
                    food_id: food.id,
                    serving_size: 1, // assuming serving size is 1 for all meals
                    meal_type: mealTypes[index].toLowerCase()
                });
            });
        }
        const mealPlanData = {
            name: `${dietaryPreference} meal plan`,
            meals
        };

        apiClient.createMealPlan(mealPlanData)
            .then(() => {
                return apiClient.getMealPlans();
            })
            .then(response => {
                const plans = response.results;
                const newPlan = plans.find(plan => plan.name === mealPlanData.name);
                if (!newPlan) {
                    throw new Error("Newly created meal plan not found");
                }
                return apiClient.setCurrentMealPlan(newPlan.id);
            })
            .then(setCurrentResponse => {
                console.log('Meal plan set as current:', setCurrentResponse);
                setSuccessMessage('Meal plan saved successfully!');
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            })
            .catch(err => {
                console.error('Error saving meal plan:', err);
            });
    };

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

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left column - Filters */}
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

                    {/* Middle column - Meal Plan */}
                    <div className="w-full md:w-3/5">
                        <div className="mb-6">
                            <h2 className="nh-title">{planTitle}</h2>
                            <p className="nh-text mt-2">
                                {planDuration === 'daily' 
                                    ? `Today's meals: Click on any meal to view details, or click the edit icon to change it.`
                                    : 'Click on any meal to view details, or click the edit icon to change it.'}
                            </p>
                        </div>

                        {loading ? (
                            <div className="text-center my-12">
                                <p className="nh-text text-lg">Loading meal plan...</p>
                            </div>
                        ) : (
                        <div className="space-y-4">
                            {days.map(day => (
                                <div key={day} className="nh-card">
                                    <h3 className="nh-subtitle mb-4">{day}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {meals.map((meal, i) => {
                                            const currentFood = localMealPlans[dietaryPreference][day.toLowerCase() as keyof weeklyMealPlan][i];
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
                                                        {currentFood.caloriesPerServing} kcal
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
                            ))}
                        </div>
                        )}
                    </div>

                    {/* Right column - Actions */}
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
                            
                            <div className="nh-card rounded-lg shadow-md">
                                <h3 className="nh-subtitle mb-3 text-sm">Planning Tips</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Consider your daily calorie needs</li>
                                    <li>• Include a variety of food groups</li>
                                    <li>• Plan for leftovers to save time</li>
                                    <li>• Check your available cooking time</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleSaveMealPlan}
                                className="nh-button nh-button-primary flex items-center justify-center gap-2 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium"
                            >
                                Save Meal Plan
                            </button>
                        </div>
                    </div>
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
                    foods={availableFoods}
                />
            </div>
        </div>
    );
};

export default MealPlanner;


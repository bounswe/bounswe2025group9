import React, { useState } from 'react';
import { Food } from '../../lib/apiClient';
import FoodDetail from '../foods/FoodDetail';
import FoodSelector from '../../components/FoodSelector';
import { PencilSimple } from '@phosphor-icons/react';
import { MockFoods, Goat, Brocolli, Pork } from './MockFoods';
import {apiClient} from '../../lib/apiClient';

interface weeklyMealPlan {
    [key: string]: [Food, Food, Food];
}

let MealPlans : { [key:string] : weeklyMealPlan} = {
    'halal' : {monday: [Brocolli, Goat, Brocolli], tuesday: [Goat, Brocolli, Goat], wednesday: [Brocolli, Goat, Brocolli], thursday: [Goat, Brocolli, Goat], friday: [Brocolli, Goat, Brocolli], saturday: [Goat, Brocolli, Goat], sunday: [Brocolli, Goat, Brocolli]},
    'vegan' : {monday: [Brocolli, Brocolli, Brocolli], tuesday: [Brocolli, Brocolli, Brocolli], wednesday: [Brocolli, Brocolli, Brocolli], thursday: [Brocolli, Brocolli, Brocolli], friday: [Brocolli, Brocolli, Brocolli], saturday: [Brocolli, Brocolli, Brocolli], sunday: [Brocolli, Brocolli, Brocolli]},
    'high-protein' : {monday: [Goat, Pork, Goat], tuesday: [Pork, Goat, Pork], wednesday: [Goat, Pork, Goat], thursday: [Pork, Goat, Pork], friday: [Goat, Pork, Goat], saturday: [Pork, Goat, Pork], sunday: [Goat, Pork, Goat]},
}


const MealPlanner = () => {
    const [dietaryPreference, setDietaryPreference] = useState('high-protein');
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [editingMeal, setEditingMeal] = useState<{day: string, index: number} | null>(null);
    const [localMealPlans, setLocalMealPlans] = useState(MealPlans);
    const [successMessage, setSuccessMessage] = useState('');

    const handleDietaryPreferenceChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setDietaryPreference(event.target.value);
    };

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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['Breakfast', 'Lunch', 'Dinner'];

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="mb-8 flex flex-col items-center">
                    <h1 className="nh-title text-center">Create Your Meal Plan</h1>
                    <p className="nh-text text-lg max-w-2xl text-center">
                        Choose your time period and dietary preferences to start your nutritious journey.
                    </p>
                </div>

                {/* Display success message if present */}
                {successMessage && (
                    <div 
                        className="px-4 py-3 rounded-md mb-6 flex items-start gap-2 border"
                        style={{
                            backgroundColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.1)', /* fallback to green-500 rgb */
                            borderColor: 'rgba(var(--rgb-color-success, 34, 197, 94), 0.3)',
                            color: 'var(--color-success)'
                        }}
                    >
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-2/3">
                        <div className="space-y-4">
                            {days.map(day => (
                                <div key={day} className="nh-card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{day}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {meals.map((meal, i) => (
                                            <div 
                                                key={`${day}-${meal}`} 
                                                className="bg-gray-50 rounded-md p-4 border border-gray-100 relative"
                                            >
                                                <div className="text-sm font-medium text-gray-500 mb-2">{meal}</div>
                                                <div 
                                                    className="text-sm text-gray-900 cursor-pointer"
                                                    onClick={() => setSelectedFood(localMealPlans[dietaryPreference][day.toLowerCase() as keyof weeklyMealPlan][i])}
                                                >
                                                    {localMealPlans[dietaryPreference][day.toLowerCase() as keyof weeklyMealPlan][i].name}
                                                </div>
                                                <button
                                                    className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingMeal({ day, index: i });
                                                    }}
                                                >
                                                    <PencilSimple size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-1/3">
                        <div className="sticky top-20">
                            <img 
                                src="/assets/gpt_food_calendar.png" 
                                alt="Meal Planning" 
                                className="w-full max-w-xs mx-auto rounded-lg shadow-sm" 
                            />
                            <div className="nh-card mb-6">
                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Plan Duration</label>
                                        <select className="form-select block w-full px-4 py-2 text-sm border-gray-300 rounded-md bg-gray-50 focus:ring-primary focus:border-primary">
                                            <option>Weekly</option>
                                            <option>Daily</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Dietary Preference</label>
                                        <select 
                                            value={dietaryPreference}
                                            onChange={handleDietaryPreferenceChange}
                                            className="form-select block w-full px-4 py-2 text-sm border-gray-300 rounded-md bg-gray-50 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="high-protein">High-protein</option>
                                            <option value="halal">Halal</option>
                                            <option value="vegan">Vegan</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="nh-card">
                                <h3 className="nh-subtitle mb-3 text-sm">Planning Tips</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Consider your daily calorie needs</li>
                                    <li>• Include a variety of food groups</li>
                                    <li>• Plan for leftovers</li>
                                    <li>• Check your available cooking time</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleSaveMealPlan}
                                className="nh-button nh-button-primary w-full mt-4 py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                Save this meal plan
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
                    foods={MockFoods} // Pass all available foods here
                />
            </div>
        </div>
    );
};

export default MealPlanner;


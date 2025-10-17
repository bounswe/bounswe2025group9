import React, { useState } from 'react';
import { Food } from '../../lib/apiClient';
import FoodDetail from '../foods/FoodDetail';
import FoodSelector from '../../components/FoodSelector';
import { PencilSimple } from '@phosphor-icons/react';
import { MockFoods, Chicken, Falafel, Pork } from './MockFoods';

interface weeklyMealPlan {
    [key: string]: [Food, Food, Food];
}

let MealPlans : { [key:string] : weeklyMealPlan} = {
    'halal' : {monday: [Falafel, Chicken, Falafel], tuesday: [Chicken, Falafel, Chicken], wednesday: [Falafel, Chicken, Falafel], thursday: [Chicken, Falafel, Chicken], friday: [Falafel, Chicken, Falafel], saturday: [Chicken, Falafel, Chicken], sunday: [Falafel, Chicken, Falafel]},
    'vegan' : {monday: [Falafel, Falafel, Falafel], tuesday: [Falafel, Falafel, Falafel], wednesday: [Falafel, Falafel, Falafel], thursday: [Falafel, Falafel, Falafel], friday: [Falafel, Falafel, Falafel], saturday: [Falafel, Falafel, Falafel], sunday: [Falafel, Falafel, Falafel]},
    'high-protein' : {monday: [Chicken, Pork, Chicken], tuesday: [Pork, Chicken, Pork], wednesday: [Chicken, Pork, Chicken], thursday: [Pork, Chicken, Pork], friday: [Chicken, Pork, Chicken], saturday: [Pork, Chicken, Pork], sunday: [Chicken, Pork, Chicken]},
}


const MealPlanner = () => {
    const [dietaryPreference, setDietaryPreference] = useState('high-protein');
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [editingMeal, setEditingMeal] = useState<{day: string, index: number} | null>(null);
    const [localMealPlans, setLocalMealPlans] = useState(MealPlans);

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
        // TODO: Implement save functionality
        console.log('Saving meal plan:', localMealPlans[dietaryPreference]);
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


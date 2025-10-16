import React, { useState } from 'react';

let MealPlans : {[key : string] : {[key : string] : {[key : string] : string}}} = {'halal' : {
    'Monday': {'Breakfast': 'Eggs and toast', 'Lunch': 'Chicken salad', 'Dinner': 'Grilled fish with vegetables'},
    'Tuesday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},
    'Wednesday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},    
    'Thursday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},    
    'Friday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},    
    'Saturday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},    
    'Sunday': {'Breakfast': 'Yogurt with fruits', 'Lunch': 'Beef stir-fry', 'Dinner': 'Baked'},    
    }
, 'vegan' : {
    'Monday': {'Breakfast': 'Oatmeal with fruits', 'Lunch': 'Quinoa salad', 'Dinner': 'Vegetable stir-fry'},
    'Tuesday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    'Wednesday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    'Thursday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    'Friday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    'Saturday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    'Sunday': {'Breakfast': 'Smoothie bowl', 'Lunch': 'Lentil soup', 'Dinner': 'Tofu curry'},
    }
, 'high-protein' : {
    'Monday': {'Breakfast': 'Eggs and toast', 'Lunch': 'Chicken salad', 'Dinner': 'Grilled fish with vegetables'},
    'Tuesday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
    'Wednesday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
    'Thursday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
    'Friday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
    'Saturday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
    'Sunday': {'Breakfast': 'Greek yogurt with nuts', 'Lunch': 'Turkey sandwich', 'Dinner': 'Steak with broccoli'},
}}

const MealPlanner = () => {
    const [dietaryPreference, setDietaryPreference] = useState('high-protein');

    const handleDietaryPreferenceChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setDietaryPreference(event.target.value);
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
                                        {meals.map(meal => (
                                            <div 
                                                key={`${day}-${meal}`} 
                                                className="bg-gray-50 rounded-md p-4 border border-gray-100"
                                            >
                                                <div className="text-sm font-medium text-gray-500 mb-2">{meal}</div>
                                                <div className="text-sm text-gray-900">
                                                    {MealPlans[dietaryPreference][day][meal]}
                                                </div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MealPlanner;


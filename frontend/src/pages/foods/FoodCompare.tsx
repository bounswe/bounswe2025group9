import React, { useState } from 'react';
import { Food } from '../../lib/apiClient';
import FoodSelector from '../../components/FoodSelector';
import { X } from '@phosphor-icons/react';
import NutritionCompare from '../../components/NutritionCompare';

const FoodCompare: React.FC = () => {
    const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleFoodSelect = (food: Food) => {
        if (selectedFoods.find(f => f.id === food.id)) {
            alert("This food is already selected for comparison.");
            return;
        }
        setSelectedFoods([...selectedFoods, food]);
        console.log("Selected foods:", [...selectedFoods, food]);
    };

    const handleRemoveFood = (foodId: number) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== foodId));
    };

    const handleAddFood = () => {
        // Logic to open food selection dialog goes here
        console.log("Add food clicked");
        setSearchOpen(true);
    };

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Search Items */}
                    <div className="w-full md:w-1/5">
                        <div className="nh-card top-20"> 
                            <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                                Select Foods to Compare
                            </h3>
                            
                            <div className="nh-card p-4 mb-4">
                                {selectedFoods.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedFoods.map(food => (
                                            <div key={food.id} className="flex items-center justify-between p-3 bg-opacity-10 bg-primary rounded-lg">
                                                <span className="nh-text font-medium flex-grow">{food.name}</span>
                                                <button
                                                    onClick={() => handleRemoveFood(food.id)}
                                                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-red-100 transition-colors"
                                                    title="Remove food"
                                                >
                                                    <X size={16} weight="bold" style={{ color: 'var(--color-primary)' }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center nh-text text-gray-500">No foods selected yet.</p>
                                )}
                            </div>

                            <button
                                onClick={handleAddFood}
                                className="w-full nh-button nh-button-primary py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-base font-medium flex items-center justify-center gap-2"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Foods to Compare
                            </button>
                        </div>
                    </div>

                    {/* Middle Columns - Foods to Compare */}
                    <div className="w-full md:w-3/5">
                        {selectedFoods.length > 0 ? (
                            <div className="nh-card p-6">
                                <h2 className="nh-subtitle mb-6">Comparison Results</h2>
                                <NutritionCompare foods={selectedFoods} />
                            </div>
                        ) : (
                            <div className="nh-card p-12 text-center">
                                <p className="nh-text text-gray-500 text-lg">Select at least two foods to start comparing</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Tips */}
                    <div className="w-full md:w-1/5">
                        <div className="sticky top-20 flex flex-col gap-4">
                            <div className="nh-card rounded-lg shadow-md">
                                <h3 className="nh-subtitle mb-3 text-sm">Comparison Tips</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Compare up to 5 foods side by side</li>
                                    <li>• Check nutrition scores for health value</li>
                                    <li>• Compare macronutrients (protein, carbs, fats)</li>
                                    <li>• View calorie content per serving</li>
                                    <li>• Check dietary compatibility</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        {/*Food Selection*/}
        <FoodSelector
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelect={handleFoodSelect}
        />
    </div>
  );
}

export default FoodCompare;
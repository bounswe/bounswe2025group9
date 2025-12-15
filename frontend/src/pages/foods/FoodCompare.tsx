import React, { useState } from 'react';
import { Food } from '../../lib/apiClient';
import FoodSelector from '../../components/FoodSelector';
import { X } from '@phosphor-icons/react';
import NutritionCompare from '../../components/NutritionCompare';

const FoodCompare: React.FC = () => {
    const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleFoodSelect = (food: Food) => {
        // prevent duplicates
        if (selectedFoods.find(f => f.id === food.id)) {
            alert("This food is already selected for comparison.");
            return;
        }
        // limit to 3 foods
        if (selectedFoods.length >= 3) {
            alert("You can compare up to 3 foods only.");
            return;
        }
        setSelectedFoods([...selectedFoods, food]);
        console.log("Selected foods:", [...selectedFoods, food]);
    };

    const handleRemoveFood = (foodId: number) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== foodId));
    };

    const handleAddFood = () => {
        // prevent opening selector if already at limit
        if (selectedFoods.length >= 3) {
            alert("You can compare up to 3 foods only.");
            return;
        }
        console.log("Add food clicked");
        setSearchOpen(true);
    };

    return (
        <div className="w-full py-12">
            <div className="nh-container">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Search Items */}
                    <div className="w-full md:w-[28%]">
                        <div className="sticky top-20">
                            <div className="nh-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="nh-subtitle flex items-center gap-2">Select Foods to Compare</h3>
                                    <span className="text-xs nh-text bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full font-medium">
                                        {selectedFoods.length}/3
                                    </span>
                                </div>

                                <div className="mb-4">
                                    {selectedFoods.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {selectedFoods.map(food => (
                                                <div key={food.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 min-w-0">
                                                    {food.imageUrl ? (
                                                        <img src={food.imageUrl} alt={food.name} className="w-10 h-10 object-cover rounded shrink-0" onError={(e)=>{ (e.target as HTMLImageElement).style.display='none'; }} />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500 shrink-0">—</div>
                                                    )}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div
                                                            className="nh-text font-medium leading-tight whitespace-nowrap overflow-x-auto pr-1"
                                                            title={food.name}
                                                        >
                                                            {food.name}
                                                        </div>
                                                        <div
                                                            className="text-xs text-gray-500 leading-tight break-words"
                                                            title={food.category}
                                                        >
                                                            {food.category}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveFood(food.id)}
                                                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-red-100 transition-colors shrink-0"
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
                                    disabled={selectedFoods.length >= 3}
                                    className={`w-full nh-button nh-button-primary py-3 rounded-lg shadow-md transition-all text-base font-medium flex items-center justify-center gap-2 ${selectedFoods.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                                    style={{ display: 'flex' }}
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Foods
                                </button>

                                {selectedFoods.length < 2 && selectedFoods.length > 0 && (
                                    <p className="text-center nh-text text-sm text-gray-500 mt-2">Select one more food to enable comparison</p>
                                )}

                                {selectedFoods.length >= 3 && (
                                    <p className="text-center nh-text text-sm text-gray-500 mt-2">Maximum of 3 foods can be compared.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Columns - Foods to Compare */}
                    <div className="w-full md:w-[55%]">
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
                    <div className="w-full md:w-[17%]">
                        <div className="sticky top-20 flex flex-col gap-4">
                            <div className="nh-card rounded-lg shadow-md">
                                <h3 className="nh-subtitle mb-3 text-sm">Comparison Tips</h3>
                                <ul className="nh-text text-xs space-y-2">
                                    <li>• Compare up to 3 foods side by side</li>
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

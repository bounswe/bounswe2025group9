import React, { useState } from 'react';
import { Food } from '../../lib/apiClient';
import FoodSelector from '../../components/FoodSelector';

const FoodCompare: React.FC = () => {
    const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);

        
    // const handleSearch = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setNumSelected(numSelected + 1); // increment number of selected foods
    //     setShouldFetch(true);
    // };
    // const clearSearch = () => {
    //     setSearchTerm('');
    //     setShouldFetch(true);
    // };

    const handleFoodSelect = (food: Food) => {
        if (selectedFoods.find(f => f.id === food.id)) {
            alert("This food is already selected for comparison.");
            return;
        }
        setSelectedFoods([...selectedFoods, food]);
    };
    const handleAddFood = () => {
        // Logic to open food selection dialog goes here
        console.log("Add food clicked");
        setSearchOpen(true);
    };

    return (
    <div>
        <h1>Food Compare Page</h1>
        <div className="flex flex-col md:flex-row gap-6">
        {/*Left Column - Search Items*/}
        <div className="w-full md:w-1/5">
            <div className="sticky top-20">
                <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                        Select Foods to Compare
                </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedFoods.length > 0 ? (
                            selectedFoods.map(food => (
                                <div key={food.id} className="text-center nh-text col-span-full">{food.name}</div>
                            ))
                        ) : (
                            <p className="text-center nh-text col-span-full">No foods selected yet.</p>
                        )}
                    </div>
                <p className="text-center nh-text col-span-full cursor-pointer" onClick={handleAddFood}>Add foods to compare</p>
            </div>


        </div>

        {/*Middle Columns - Foods to Compare*/}
        <div className="w-full md:w-3/5">
        
        </div>

        {/*Right Column - Tips*/}
        <div className="w-full md:w-1/5">right </div>
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
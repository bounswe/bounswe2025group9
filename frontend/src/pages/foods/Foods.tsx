import { Hamburger} from '@phosphor-icons/react'
import { apiClient , Food} from '../../lib/apiClient';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FoodDetail from './FoodDetail';

const FoodItem = ({ item, onClick }: { item: Food, onClick: () => void }) => {
    return (
        <div 
            key={item.id} 
            className="nh-card p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={onClick}
        >
            <div className="food-image-placeholder flex justify-center items-center">
                <Hamburger size={48} weight="fill" className="text-primary opacity-50" />
            </div>
            <div className="flex items-center mt-4">
                <div className="flex items-center justify-center mr-2">
                    <Hamburger size={20} className="text-primary flex-shrink-0" />
                </div>
                <h3 className="nh-subtitle">{item.name}</h3>
            </div>
            <div className="mt-2">
                <p className="nh-text">Category: {item.category}</p>
                <p className="nh-text">Nutrition Score: {item.nutritionScore}</p>
                <p className="nh-text">Calories: {item.nutrition.calories} kcal per {item.perUnit}</p>
                <p className="nh-text">Dietary Tags: {item.dietaryTags.join(', ')}</p>
            </div>
        </div>
    );
}

// foods page component (placeholder)
const Foods = () => {
    const [foods, setFoods] = useState<Food[]>([])
    const [fetchSuccess, setFetchSuccess] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);

    const fetchFoods = async () => {
        try {
            const response = await apiClient.getFoods();
            setFoods(response);
            setFetchSuccess(true);
            console.log("Fetched foods:", response);
        } catch (error) {
            console.error('Error fetching foods:', error);
            setFetchSuccess(false);
        }
    }

    // Fetch foods when component mounts
    useEffect(() => {
        fetchFoods();
    }, []);

    // Filter foods based on search term
    const filteredFoods = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="py-12">
            <div className="nh-container">
                <h1 className="nh-title text-center mb-4">Foods Catalog</h1>
                <p className="nh-text text-center mb-12">
                    Browse our selection of available foods.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            className="w-full nh-input pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Search for a food..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="nh-button-primary px-6 py-2.5 whitespace-nowrap">
                            Search
                        </button>
                        <Link to="/foods/propose" className="nh-button-secondary px-6 py-2.5 whitespace-nowrap"> Add Food</Link>
                    </div>

                </div>
                {fetchSuccess ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFoods.length > 0 ?
                            (filteredFoods.map(food => (
                                <FoodItem 
                                    key={food.id} 
                                    item={food} 
                                    onClick={() => setSelectedFood(food)}
                                />
                            ))) : 
                            (<p className="col-span-full text-center nh-text">No foods found matching your search.</p>)
                        }
                    </div>
                    ) : (
                        <p className="col-span-full text-center nh-text">Error fetching foods. Please try again later.</p>
                )}

                <FoodDetail 
                    food={selectedFood}
                    open={!!selectedFood}
                    onClose={() => setSelectedFood(null)}
                />
            </div>
        </div>
    )
}

export default Foods 
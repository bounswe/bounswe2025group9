import { Hamburger, Carrot, Cookie } from '@phosphor-icons/react'
import { apiClient , Food} from '../../lib/apiClient';
import { useState, useEffect } from 'react';



const FoodItem = (item : Food) => {
    return (<div key={item.id} className="nh-card p-4">
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
</div>)
}

// foods page component (placeholder)
const Foods = () => {
    const foodIcons = [Hamburger, Carrot, Cookie];
    const [foods, setFoods] = useState<Food[]>([])

    const fetchFoods = async () => {
        try {
            const response = await apiClient.getFoods();
            setFoods(response);
            console.log("Fetched foods:", response);
        } catch (error) {
            console.error('Error fetching foods:', error);
        }
    }

    // Fetch foods when component mounts
    useEffect(() => {
        fetchFoods();
    }, []);

    return (
        <div className="py-12">
            <div className="nh-container">
                <h1 className="nh-title text-center mb-4">Foods Catalog</h1>
                <p className="nh-text text-center mb-12">
                    Browse our selection of available foods.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {foods.length > 0 ?
                        (foods.map(FoodItem)) : 
                        (<p className="col-span-full text-center nh-text">No foods available. Please try again later.</p>)
                    }
                </div>
            </div>
        </div>
    )
}

export default Foods 
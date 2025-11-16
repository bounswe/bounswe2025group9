import React from 'react';
import { Food } from '../lib/apiClient';
import { FoodItem } from '../pages/foods/Foods';
import MacroRadarChart from './radarChart';

interface NutritionCompareProps {
    foods: Food[];
};


const NutritionCompare: React.FC<NutritionCompareProps> = ({ foods }) => {
    return (
        <div>       
            {foods.length > 1 ? (     
            <div className="my-8">
                <h3> Macronutrients per 100 g</h3>
                    <MacroRadarChart food1={foods[0]} food2={foods[1]}/> 
            </div>
            ): (
                <p className="text-center nh-text col-span-full">Select two foods to compare</p>
            )}
        </div>
    
    );
};

export default NutritionCompare;
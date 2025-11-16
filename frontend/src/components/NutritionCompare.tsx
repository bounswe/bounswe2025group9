import React from 'react';
import { Food } from '../lib/apiClient';
import MacroRadarChart from './radarChart';

interface NutritionCompareProps {
    foods: Food[];
};

const NutritionCompare: React.FC<NutritionCompareProps> = ({ foods }) => {
    return (
        <div>
            {foods.length > 1 ? (
                <div className="grid gap-6 my-6">
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Macronutrients (per 100 g)</h3>
                        <div className="w-full">
                            {foods.length > 2 ? (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} food3={foods[2]} />
                            ) : (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} />
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <p className="text-center nh-text col-span-full">Select two or three foods to compare</p>
            )}
        </div>
    );
};

export default NutritionCompare;
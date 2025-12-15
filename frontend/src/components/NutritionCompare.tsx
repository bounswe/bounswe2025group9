import React from 'react';
import { Food } from '../lib/apiClient';
import MacroRadarChart, { MineralRadarChart, VitaminRadarChart } from './radarChart';

interface NutritionCompareProps {
    foods: Food[];
};

const NutritionCompare: React.FC<NutritionCompareProps> = ({ foods }) => {
    // Calculate per 100g values
    const calculatePer100g = (value: number, servingSize: number) => {
        return ((value / servingSize) * 100).toFixed(1);
    };

    return (
        <div>
            {foods.length > 1 ? (
                <div className="grid gap-6 my-6">
                    {/* Radar Chart */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Macronutrients (per 100g)</h3>
                        <div className="w-full">
                            {foods.length > 2 ? (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} food3={foods[2]} />
                            ) : (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} />
                            )}
                        </div>
                    </div>

                    {/* Vitamins Radar Chart */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Vitamins (per 100g)</h3>
                        <div className="w-full">
                            {foods.length > 2 ? (
                                <VitaminRadarChart food1={foods[0]} food2={foods[1]} food3={foods[2]} />
                            ) : (
                                <VitaminRadarChart food1={foods[0]} food2={foods[1]} />
                            )}
                        </div>
                    </div>

                    {/* Minerals Radar Chart */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Minerals (per 100g)</h3>
                        <div className="w-full">
                            {foods.length > 2 ? (
                                <MineralRadarChart food1={foods[0]} food2={foods[1]} food3={foods[2]} />
                            ) : (
                                <MineralRadarChart food1={foods[0]} food2={foods[1]} />
                            )}
                        </div>
                    </div>

                    {/* Detailed Comparison Table - Per Serving */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Nutrition Comparison (Per Serving)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-3 px-2 nh-text font-semibold">Nutrient</th>
                                        {foods.map((food, idx) => (
                                            <th key={idx} className="text-center py-3 px-2 nh-text font-semibold">
                                                {food.name}
                                                <div className="text-xs font-normal text-[var(--color-text-secondary)] mt-1">
                                                    ({food.servingSize}g)
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Calories</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.caloriesPerServing} kcal
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Protein</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.proteinContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Fat</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.fatContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Carbohydrates</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.carbohydrateContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 nh-text">Nutrition Score</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.nutritionScore.toFixed(2)}/10
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Comparison Table - Per 100g */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">Nutrition Comparison (Per 100g)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-3 px-2 nh-text font-semibold">Nutrient</th>
                                        {foods.map((food, idx) => (
                                            <th key={idx} className="text-center py-3 px-2 nh-text font-semibold">
                                                {food.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Calories</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.caloriesPerServing, food.servingSize)} kcal
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Protein</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.proteinContent, food.servingSize)}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">Fat</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.fatContent, food.servingSize)}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 nh-text">Carbohydrates</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.carbohydrateContent, food.servingSize)}g
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
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

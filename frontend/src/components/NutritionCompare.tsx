import React from 'react';
import { Food } from '../lib/apiClient';
import MacroRadarChart from './radarChart';
import { useLanguage } from '../context/LanguageContext';

interface NutritionCompareProps {
    foods: Food[];
};

const NutritionCompare: React.FC<NutritionCompareProps> = ({ foods }) => {
    const { t } = useLanguage();
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
                        <h3 className="nh-subtitle mb-4">{t('food.macronutrientsPer100g')}</h3>
                        <div className="w-full">
                            {foods.length > 2 ? (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} food3={foods[2]} />
                            ) : (
                                <MacroRadarChart food1={foods[0]} food2={foods[1]} />
                            )}
                        </div>
                    </div>

                    {/* Detailed Comparison Table - Per Serving */}
                    <div className="nh-card p-4">
                        <h3 className="nh-subtitle mb-4">{t('food.nutritionComparisonPerServing')}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-3 px-2 nh-text font-semibold">{t('food.nutrient')}</th>
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
                                        <td className="py-3 px-2 nh-text">{t('food.calories')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.caloriesPerServing} kcal
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.protein')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.proteinContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.fat')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.fatContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.carbohydrates')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {food.carbohydrateContent}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 nh-text">{t('food.nutritionScore')}</td>
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
                        <h3 className="nh-subtitle mb-4">{t('food.nutritionComparisonPer100g')}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-3 px-2 nh-text font-semibold">{t('food.nutrient')}</th>
                                        {foods.map((food, idx) => (
                                            <th key={idx} className="text-center py-3 px-2 nh-text font-semibold">
                                                {food.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.calories')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.caloriesPerServing, food.servingSize)} kcal
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.protein')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.proteinContent, food.servingSize)}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <td className="py-3 px-2 nh-text">{t('food.fat')}</td>
                                        {foods.map((food, idx) => (
                                            <td key={idx} className="text-center py-3 px-2 nh-text font-medium">
                                                {calculatePer100g(food.fatContent, food.servingSize)}g
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 nh-text">{t('food.carbohydrates')}</td>
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
                <p className="text-center nh-text col-span-full">{t('food.selectTwoOrThreeFoodsToCompare')}</p>
            )}
        </div>
    );
};

export default NutritionCompare;
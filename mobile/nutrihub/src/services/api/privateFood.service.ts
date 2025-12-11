/**
 * Private Food Service
 * 
 * Manages private food items stored locally using AsyncStorage.
 * Private foods are user-created foods that can be used immediately
 * without admin approval.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivateFood } from '../../types/nutrition';
import { FoodItem, FoodCategoryType } from '../../types/types';

const PRIVATE_FOODS_STORAGE_KEY = 'nutrihub_private_foods';

/**
 * Generate a UUID for private food items
 */
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Get all private foods from storage
 */
export const getPrivateFoods = async (): Promise<PrivateFood[]> => {
    try {
        const data = await AsyncStorage.getItem(PRIVATE_FOODS_STORAGE_KEY);
        if (!data) {
            return [];
        }
        return JSON.parse(data) as PrivateFood[];
    } catch (error) {
        console.error('Error getting private foods:', error);
        return [];
    }
};

/**
 * Add a new private food
 */
export const addPrivateFood = async (
    food: Omit<PrivateFood, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PrivateFood> => {
    try {
        const existingFoods = await getPrivateFoods();

        const newFood: PrivateFood = {
            ...food,
            id: generateUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedFoods = [...existingFoods, newFood];
        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(updatedFoods));

        return newFood;
    } catch (error) {
        console.error('Error adding private food:', error);
        throw error;
    }
};

/**
 * Update an existing private food
 */
export const updatePrivateFood = async (
    id: string,
    updates: Partial<Omit<PrivateFood, 'id' | 'createdAt'>>
): Promise<PrivateFood | null> => {
    try {
        const existingFoods = await getPrivateFoods();
        const index = existingFoods.findIndex((food) => food.id === id);

        if (index === -1) {
            console.warn(`Private food with id ${id} not found`);
            return null;
        }

        const updatedFood: PrivateFood = {
            ...existingFoods[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        existingFoods[index] = updatedFood;
        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(existingFoods));

        return updatedFood;
    } catch (error) {
        console.error('Error updating private food:', error);
        throw error;
    }
};

/**
 * Delete a private food
 */
export const deletePrivateFood = async (id: string): Promise<boolean> => {
    try {
        const existingFoods = await getPrivateFoods();
        const filteredFoods = existingFoods.filter((food) => food.id !== id);

        if (filteredFoods.length === existingFoods.length) {
            console.warn(`Private food with id ${id} not found`);
            return false;
        }

        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(filteredFoods));
        return true;
    } catch (error) {
        console.error('Error deleting private food:', error);
        throw error;
    }
};

/**
 * Convert a PrivateFood to a FoodItem for use in nutrition tracking
 */
export const convertToFoodItem = (privateFood: PrivateFood): FoodItem => {
    return {
        id: -parseInt(privateFood.id.replace(/-/g, '').substring(0, 8), 16), // Negative ID to distinguish from API foods
        title: privateFood.name,
        description: `Private food (${privateFood.sourceType === 'custom' ? 'Custom' : 'Modified Proposal'})`,
        iconName: 'food',
        category: (privateFood.category || 'Other') as FoodCategoryType,
        servingSize: privateFood.servingSize,
        macronutrients: {
            calories: privateFood.calories,
            protein: privateFood.protein,
            carbohydrates: privateFood.carbohydrates,
            fat: privateFood.fat,
            fiber: privateFood.fiber,
            sugar: privateFood.sugar,
        },
        micronutrients: privateFood.micronutrients,
        dietaryOptions: privateFood.dietaryOptions as any[],
    };
};

/**
 * Get a single private food by ID
 */
export const getPrivateFoodById = async (id: string): Promise<PrivateFood | null> => {
    try {
        const foods = await getPrivateFoods();
        return foods.find((food) => food.id === id) || null;
    } catch (error) {
        console.error('Error getting private food by id:', error);
        return null;
    }
};

/**
 * Search private foods by name
 */
export const searchPrivateFoods = async (query: string): Promise<PrivateFood[]> => {
    try {
        const foods = await getPrivateFoods();
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            return foods;
        }

        return foods.filter((food) =>
            food.name.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching private foods:', error);
        return [];
    }
};

/**
 * Clear all private foods (for testing/debugging)
 */
export const clearAllPrivateFoods = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(PRIVATE_FOODS_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing private foods:', error);
        throw error;
    }
};

export const privateFoodService = {
    getPrivateFoods,
    addPrivateFood,
    updatePrivateFood,
    deletePrivateFood,
    convertToFoodItem,
    getPrivateFoodById,
    searchPrivateFoods,
    clearAllPrivateFoods,
};

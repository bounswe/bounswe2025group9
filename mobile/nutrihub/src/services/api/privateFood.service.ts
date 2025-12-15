/**
 * Private Food Service
 * 
 * Manages private food items and keeps them in sync with the backend.
 * Previously this was local-only; now we:
 *  - Use backend endpoints (/foods/private/) for create/read/update/delete
 *  - Cache locally via AsyncStorage so existing UI still works offline
 * This mirrors the frontend private food flow.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { calculateNutritionScore, transformFoodItem } from './food.service';
import { PrivateFood } from '../../types/nutrition';
import { FoodItem, FoodCategoryType } from '../../types/types';

const PRIVATE_FOODS_STORAGE_KEY = 'nutrihub_private_foods';
const PRIVATE_FOOD_ENTRIES_KEY = 'nutrihub_private_food_entries';

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
 * Normalize backend private food to the local PrivateFood shape
 */
const normalizePrivateFood = (data: any): PrivateFood => {
    return {
        id: String(data.id ?? data.uuid ?? generateUUID()),
        name: data.name,
        category: data.category ?? 'Other',
        servingSize: Number(
            data.serving_size ??
            data.servingSize ??
            data.serving_size_in_grams ??
            100
        ),
        calories: Number(data.calories_per_serving ?? data.calories ?? data.energy ?? 0),
        protein: Number(data.protein_content ?? data.protein ?? 0),
        carbohydrates: Number(data.carbohydrate_content ?? data.carbohydrates ?? 0),
        fat: Number(data.fat_content ?? data.fat ?? 0),
        fiber: data.fiber !== undefined ? Number(data.fiber) : undefined,
        sugar: data.sugar !== undefined ? Number(data.sugar) : undefined,
        micronutrients: data.micronutrients ?? undefined,
        dietaryOptions: data.dietary_options ?? data.dietaryOptions ?? [],
        createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updated_at ?? data.updatedAt ?? new Date().toISOString(),
        sourceType: (data.source_type ?? data.sourceType ?? 'custom') as 'custom' | 'modified_proposal',
        originalFoodId: data.original_food_id ?? data.originalFoodId,
    };
};

/**
 * Fetch private foods from backend and cache locally
 */
const fetchPrivateFoodsFromApi = async (): Promise<PrivateFood[]> => {
    const response = await apiClient.get('/foods/private/');
    const foods = Array.isArray(response.data)
        ? response.data.map(normalizePrivateFood)
        : [];
    await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(foods));
    return foods;
};

/**
 * Fetch private foods as FoodItem (frontend-compatible shape) from backend
 */
export const getPrivateFoodsAsFoodItems = async (): Promise<FoodItem[]> => {
    const response = await apiClient.get('/foods/private/');
    const apiFoods = Array.isArray(response.data) ? response.data : [];
    return apiFoods.map((f: any) => {
        const item = transformFoodItem({
            id: f.id,
            name: f.name,
            category: f.category,
            servingSize: f.serving_size ?? f.servingSize ?? 100,
            caloriesPerServing: f.calories_per_serving ?? f.caloriesPerServing ?? f.calories ?? 0,
            proteinContent: f.protein_content ?? f.proteinContent ?? f.protein ?? 0,
            fatContent: f.fat_content ?? f.fatContent ?? f.fat ?? 0,
            carbohydrateContent: f.carbohydrate_content ?? f.carbohydrateContent ?? f.carbohydrates ?? 0,
            fiberContent: f.fiber ?? f.fiberContent,
            sugarContent: f.sugar ?? f.sugarContent,
            micronutrients: f.micronutrients,
            dietaryOptions: f.dietary_options ?? f.dietaryOptions ?? [],
            nutritionScore: f.nutrition_score ?? f.nutritionScore,
            imageUrl: f.imageUrl ?? f.image_url ?? '',
            base_price: f.base_price ?? f.basePrice ?? null,
            price_unit: f.price_unit ?? f.priceUnit ?? 'per_100g',
            price_category: f.price_category ?? null,
            currency: f.currency ?? undefined,
        });

        // Use negative IDs to avoid collisions with public catalog IDs
        const safeId = f.id ? -Math.abs(Number(f.id)) : -Date.now();

        return {
            ...item,
            id: safeId,
            isPrivate: true,
            iconName: 'lock',
            priceCategory: item.priceCategory ?? null,
        };
    });
};

/**
 * Get all private foods (backend first, fallback to cache)
 */
export const getPrivateFoods = async (): Promise<PrivateFood[]> => {
    try {
        try {
            return await fetchPrivateFoodsFromApi();
        } catch (apiErr) {
            console.warn('Falling back to cached private foods:', apiErr);
        }

        const data = await AsyncStorage.getItem(PRIVATE_FOODS_STORAGE_KEY);
        return data ? (JSON.parse(data) as PrivateFood[]) : [];
    } catch (error) {
        console.error('Error getting private foods:', error);
        return [];
    }
};

/**
 * Add a new private food
 */
export const addPrivateFood = async (
    food: {
        name: string;
        category: string;
        servingSize: number;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        dietaryOptions?: string[];
        micronutrients?: Record<string, number>;
        sourceType?: 'custom' | 'modified_proposal';
    }
): Promise<PrivateFood> => {
  const nutritionScore = calculateNutritionScore(
    food.protein,
    food.carbohydrates,
    food.fat,
    food.category,
    food.name
  );

    const payload = {
        name: food.name,
        category: food.category,
        servingSize: food.servingSize,
        caloriesPerServing: food.calories,
        proteinContent: food.protein,
        fatContent: food.fat,
        carbohydrateContent: food.carbohydrates,
        dietaryOptions: food.dietaryOptions ?? [],
        micronutrients: food.micronutrients,
        isPrivate: true,
    nutritionScore,
        sourceType: food.sourceType ?? 'custom',
    };

    try {
        const response = await apiClient.post('/foods/private/', payload);
        const saved = normalizePrivateFood(response.data);

        const existing = await getPrivateFoods();
        const updatedFoods = [...existing.filter(f => f.id !== saved.id), saved];
        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(updatedFoods));

        return saved;
    } catch (error) {
        console.error('Error adding private food (API):', error);
        throw error;
    }
};

/**
 * Update an existing private food
 */
export const updatePrivateFood = async (
    id: string | number,
    updates: Partial<{
        name: string;
        category: string;
        servingSize: number;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        dietaryOptions?: string[];
        micronutrients?: Record<string, number>;
    }>
): Promise<PrivateFood | null> => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.servingSize !== undefined) payload.servingSize = updates.servingSize;
    if (updates.calories !== undefined) payload.caloriesPerServing = updates.calories;
    if (updates.protein !== undefined) payload.proteinContent = updates.protein;
    if (updates.fat !== undefined) payload.fatContent = updates.fat;
    if (updates.carbohydrates !== undefined) payload.carbohydrateContent = updates.carbohydrates;
    if (updates.dietaryOptions !== undefined) payload.dietaryOptions = updates.dietaryOptions;
    if (updates.micronutrients !== undefined) payload.micronutrients = updates.micronutrients;
    if (updates.fiber !== undefined) payload.fiber = updates.fiber;
    if (updates.sugar !== undefined) payload.sugar = updates.sugar;

    try {
        const response = await apiClient.patch(`/foods/private/${id}/`, payload);
        const updated = normalizePrivateFood(response.data);

        const existing = await getPrivateFoods();
        const merged = [...existing.filter(f => f.id !== updated.id), updated];
        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(merged));

        return updated;
    } catch (error) {
        console.error('Error updating private food (API):', error);
        return null;
    }
};

/**
 * Delete a private food
 */
export const deletePrivateFood = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/foods/private/${id}/`);

        const existingFoods = await getPrivateFoods();
        const filteredFoods = existingFoods.filter((food) => food.id !== id && food.id !== String(id));

        await AsyncStorage.setItem(PRIVATE_FOODS_STORAGE_KEY, JSON.stringify(filteredFoods));
        return true;
    } catch (error) {
        console.error('Error deleting private food:', error);
        return false;
    }
};

/**
 * Convert a PrivateFood to a FoodItem for use in nutrition tracking
 */
export const convertToFoodItem = (privateFood: PrivateFood): FoodItem => {
    return {
        id: typeof privateFood.id === 'string'
            ? -parseInt(privateFood.id.replace(/-/g, '').substring(0, 8), 16)
            : Number(privateFood.id),
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
        try {
            const response = await apiClient.get(`/foods/private/${id}/`);
            return normalizePrivateFood(response.data);
        } catch (apiErr) {
            console.warn('Falling back to cached private food:', apiErr);
        }

        const foods = await getPrivateFoods();
        return foods.find((food) => food.id === id || food.id === String(id)) || null;
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

// ============ Private Food Entries (Log Entries) ============
interface PrivateFoodEntry {
    id: number;
    food_id: number;
    food_name: string;
    serving_size: number;
    serving_unit: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    logged_at: string;
    date: string; // Date string for filtering (YYYY-MM-DD)
}

/**
 * Get private food entries for a specific date
 */
export const getPrivateFoodEntries = async (date: string): Promise<PrivateFoodEntry[]> => {
    try {
        const data = await AsyncStorage.getItem(PRIVATE_FOOD_ENTRIES_KEY);
        if (!data) return [];

        const allEntries: PrivateFoodEntry[] = JSON.parse(data);
        return allEntries.filter(entry => entry.date === date);
    } catch (error) {
        console.error('Error getting private food entries:', error);
        return [];
    }
};

/**
 * Add a private food entry
 */
export const addPrivateFoodEntry = async (entry: Omit<PrivateFoodEntry, 'id'>): Promise<PrivateFoodEntry> => {
    try {
        const data = await AsyncStorage.getItem(PRIVATE_FOOD_ENTRIES_KEY);
        const allEntries: PrivateFoodEntry[] = data ? JSON.parse(data) : [];

        const newEntry: PrivateFoodEntry = {
            ...entry,
            id: -Date.now(), // Unique negative ID
        };

        allEntries.push(newEntry);
        await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(allEntries));

        return newEntry;
    } catch (error) {
        console.error('Error adding private food entry:', error);
        throw error;
    }
};

/**
 * Delete a private food entry
 */
export const deletePrivateFoodEntry = async (id: number): Promise<boolean> => {
    try {
        const data = await AsyncStorage.getItem(PRIVATE_FOOD_ENTRIES_KEY);
        if (!data) return false;

        const allEntries: PrivateFoodEntry[] = JSON.parse(data);
        const filtered = allEntries.filter(entry => entry.id !== id);

        if (filtered.length === allEntries.length) return false;

        await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting private food entry:', error);
        throw error;
    }
};

/**
 * Clear all private food entries (for testing/debugging)
 */
export const clearAllPrivateFoodEntries = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(PRIVATE_FOOD_ENTRIES_KEY);
    } catch (error) {
        console.error('Error clearing private food entries:', error);
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
    // Entry functions
    getPrivateFoodEntries,
    addPrivateFoodEntry,
    deletePrivateFoodEntry,
    clearAllPrivateFoodEntries,
};


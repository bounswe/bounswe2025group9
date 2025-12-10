/**
 * Private Food Service
 * Handles local storage operations for private/custom food items
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivateFoodItem, PrivateFoodLogEntry, FoodCategoryType } from '../../types/types';

// Storage keys
const PRIVATE_FOODS_KEY = 'nutrihub_private_foods';
const PRIVATE_FOOD_ENTRIES_KEY = 'nutrihub_private_food_entries';
const PRIVATE_FOOD_ID_COUNTER_KEY = 'nutrihub_private_food_id_counter';
const PRIVATE_ENTRY_ID_COUNTER_KEY = 'nutrihub_private_entry_id_counter';

/**
 * Generate a unique negative ID for private foods
 * Using negative IDs to distinguish from backend foods
 */
const generatePrivateFoodId = async (): Promise<number> => {
    try {
        const counterStr = await AsyncStorage.getItem(PRIVATE_FOOD_ID_COUNTER_KEY);
        const counter = counterStr ? parseInt(counterStr, 10) : 0;
        const newCounter = counter + 1;
        await AsyncStorage.setItem(PRIVATE_FOOD_ID_COUNTER_KEY, newCounter.toString());
        return -newCounter; // Negative ID for private foods
    } catch (error) {
        console.error('Error generating private food ID:', error);
        return -Date.now(); // Fallback to timestamp-based ID
    }
};

/**
 * Generate a unique negative ID for private food entries
 */
const generatePrivateEntryId = async (): Promise<number> => {
    try {
        const counterStr = await AsyncStorage.getItem(PRIVATE_ENTRY_ID_COUNTER_KEY);
        const counter = counterStr ? parseInt(counterStr, 10) : 0;
        const newCounter = counter + 1;
        await AsyncStorage.setItem(PRIVATE_ENTRY_ID_COUNTER_KEY, newCounter.toString());
        return -newCounter; // Negative ID for private entries
    } catch (error) {
        console.error('Error generating private entry ID:', error);
        return -Date.now(); // Fallback to timestamp-based ID
    }
};

class PrivateFoodService {
    /**
     * Get all private foods
     */
    async getPrivateFoods(): Promise<PrivateFoodItem[]> {
        try {
            const data = await AsyncStorage.getItem(PRIVATE_FOODS_KEY);
            if (!data) return [];
            return JSON.parse(data) as PrivateFoodItem[];
        } catch (error) {
            console.error('Error fetching private foods:', error);
            return [];
        }
    }

    /**
     * Get a single private food by ID
     */
    async getPrivateFoodById(id: number): Promise<PrivateFoodItem | null> {
        try {
            const foods = await this.getPrivateFoods();
            return foods.find(f => f.id === id) || null;
        } catch (error) {
            console.error('Error fetching private food by ID:', error);
            return null;
        }
    }

    /**
     * Add a new private food
     */
    async addPrivateFood(food: Omit<PrivateFoodItem, 'id' | 'isPrivate' | 'createdAt'>): Promise<PrivateFoodItem> {
        try {
            const id = await generatePrivateFoodId();
            const now = new Date().toISOString();

            const newFood: PrivateFoodItem = {
                ...food,
                id,
                isPrivate: true,
                createdAt: now,
            };

            const existingFoods = await this.getPrivateFoods();
            const updatedFoods = [...existingFoods, newFood];
            await AsyncStorage.setItem(PRIVATE_FOODS_KEY, JSON.stringify(updatedFoods));

            return newFood;
        } catch (error) {
            console.error('Error adding private food:', error);
            throw new Error('Failed to save private food');
        }
    }

    /**
     * Update an existing private food
     */
    async updatePrivateFood(id: number, updates: Partial<Omit<PrivateFoodItem, 'id' | 'isPrivate' | 'createdAt'>>): Promise<PrivateFoodItem> {
        try {
            const foods = await this.getPrivateFoods();
            const index = foods.findIndex(f => f.id === id);

            if (index === -1) {
                throw new Error('Private food not found');
            }

            const updatedFood: PrivateFoodItem = {
                ...foods[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            foods[index] = updatedFood;
            await AsyncStorage.setItem(PRIVATE_FOODS_KEY, JSON.stringify(foods));

            return updatedFood;
        } catch (error) {
            console.error('Error updating private food:', error);
            throw error;
        }
    }

    /**
     * Delete a private food
     */
    async deletePrivateFood(id: number): Promise<void> {
        try {
            const foods = await this.getPrivateFoods();
            const filteredFoods = foods.filter(f => f.id !== id);
            await AsyncStorage.setItem(PRIVATE_FOODS_KEY, JSON.stringify(filteredFoods));

            // Also delete any entries for this food
            const entries = await this.getPrivateFoodEntries();
            const filteredEntries = entries.filter(e => e.privateFoodId !== id);
            await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(filteredEntries));
        } catch (error) {
            console.error('Error deleting private food:', error);
            throw new Error('Failed to delete private food');
        }
    }

    /**
     * Get all private food entries
     */
    async getPrivateFoodEntries(date?: string): Promise<PrivateFoodLogEntry[]> {
        try {
            const data = await AsyncStorage.getItem(PRIVATE_FOOD_ENTRIES_KEY);
            if (!data) return [];

            const entries = JSON.parse(data) as PrivateFoodLogEntry[];

            if (date) {
                return entries.filter(e => e.date === date);
            }
            return entries;
        } catch (error) {
            console.error('Error fetching private food entries:', error);
            return [];
        }
    }

    /**
     * Add a private food entry
     */
    async addPrivateFoodEntry(entry: Omit<PrivateFoodLogEntry, 'id' | 'logged_at'>): Promise<PrivateFoodLogEntry> {
        try {
            const id = await generatePrivateEntryId();
            const now = new Date().toISOString();

            const newEntry: PrivateFoodLogEntry = {
                ...entry,
                id,
                logged_at: now,
            };

            const existingEntries = await this.getPrivateFoodEntries();
            const updatedEntries = [...existingEntries, newEntry];
            await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(updatedEntries));

            return newEntry;
        } catch (error) {
            console.error('Error adding private food entry:', error);
            throw new Error('Failed to add private food entry');
        }
    }

    /**
     * Update a private food entry
     */
    async updatePrivateFoodEntry(
        entryId: number,
        updates: Partial<Omit<PrivateFoodLogEntry, 'id' | 'logged_at'>>
    ): Promise<PrivateFoodLogEntry> {
        try {
            const entries = await this.getPrivateFoodEntries();
            const index = entries.findIndex(e => e.id === entryId);

            if (index === -1) {
                throw new Error('Private food entry not found');
            }

            const updatedEntry: PrivateFoodLogEntry = {
                ...entries[index],
                ...updates,
            };

            entries[index] = updatedEntry;
            await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(entries));

            return updatedEntry;
        } catch (error) {
            console.error('Error updating private food entry:', error);
            throw error;
        }
    }

    /**
     * Delete a private food entry
     */
    async deletePrivateFoodEntry(entryId: number): Promise<void> {
        try {
            const entries = await this.getPrivateFoodEntries();
            const filteredEntries = entries.filter(e => e.id !== entryId);
            await AsyncStorage.setItem(PRIVATE_FOOD_ENTRIES_KEY, JSON.stringify(filteredEntries));
        } catch (error) {
            console.error('Error deleting private food entry:', error);
            throw new Error('Failed to delete private food entry');
        }
    }

    /**
     * Search private foods by name
     */
    async searchPrivateFoods(searchTerm: string): Promise<PrivateFoodItem[]> {
        try {
            const foods = await this.getPrivateFoods();
            const lowerSearch = searchTerm.toLowerCase();
            return foods.filter(f => f.title.toLowerCase().includes(lowerSearch));
        } catch (error) {
            console.error('Error searching private foods:', error);
            return [];
        }
    }
}

// Export singleton instance
export const privateFoodService = new PrivateFoodService();

// Export class for testing
export default PrivateFoodService;

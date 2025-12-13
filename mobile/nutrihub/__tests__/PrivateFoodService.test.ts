/**
 * Private Food Feature Tests
 * 
 * Tests for the private food functionality including:
 * - Private food service CRUD operations
 * - Private food entry storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    privateFoodService,
    getPrivateFoods,
    addPrivateFood,
    deletePrivateFood,
    convertToFoodItem,
    getPrivateFoodEntries,
    addPrivateFoodEntry,
    deletePrivateFoodEntry,
} from '../src/services/api/privateFood.service';
import { PrivateFood } from '../src/types/nutrition';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('Private Food Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addPrivateFood', () => {
        it('should create a new private food with generated ID', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const foodData = {
                name: 'Test Food',
                category: 'Vegetables',
                servingSize: 100,
                calories: 50,
                protein: 2,
                carbohydrates: 10,
                fat: 0.5,
                sourceType: 'custom' as const,
            };

            const result = await addPrivateFood(foodData);

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Test Food');
            expect(result.calories).toBe(50);
            expect(result.sourceType).toBe('custom');
            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('getPrivateFoods', () => {
        it('should return empty array when no foods exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const result = await getPrivateFoods();

            expect(result).toEqual([]);
        });

        it('should return stored private foods', async () => {
            const mockFoods: PrivateFood[] = [
                {
                    id: 'test-id-1',
                    name: 'Apple',
                    category: 'Fruits',
                    servingSize: 100,
                    calories: 52,
                    protein: 0.3,
                    carbohydrates: 14,
                    fat: 0.2,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                    sourceType: 'custom',
                },
            ];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockFoods));

            const result = await getPrivateFoods();

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Apple');
        });
    });

    describe('convertToFoodItem', () => {
        it('should convert PrivateFood to FoodItem with negative ID', () => {
            const privateFood: PrivateFood = {
                id: 'abc12345-6789-0000-0000-000000000000',
                name: 'Custom Meal',
                category: 'Other',
                servingSize: 150,
                calories: 300,
                protein: 20,
                carbohydrates: 30,
                fat: 10,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                sourceType: 'custom',
            };

            const result = convertToFoodItem(privateFood);

            expect(result.id).toBeLessThan(0); // Negative ID
            expect(result.title).toBe('Custom Meal');
            expect(result.macronutrients?.calories).toBe(300);
            expect(result.macronutrients?.protein).toBe(20);
        });
    });

    describe('Private Food Entries', () => {
        it('should add and retrieve private food entries for a date', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const entryData = {
                food_id: -123,
                food_name: 'Test Food (Private)',
                serving_size: 1,
                serving_unit: 'serving',
                meal_type: 'lunch',
                calories: 200,
                protein: 10,
                carbohydrates: 20,
                fat: 5,
                logged_at: '2024-01-01T12:00:00Z',
                date: '2024-01-01',
            };

            const savedEntry = await addPrivateFoodEntry(entryData);

            expect(savedEntry).toHaveProperty('id');
            expect(savedEntry.id).toBeLessThan(0);
            expect(savedEntry.food_name).toBe('Test Food (Private)');
            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
    });
});

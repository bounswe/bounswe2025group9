import { apiClient } from './client';
import { FoodItem, FoodCategoryType } from '../../types/types';

// API response interfaces
export interface ApiFoodItem {
  id: number;
  name: string;
  category: string;
  description?: string;
  servingSize: number;
  caloriesPerServing: number;
  proteinContent: number;
  fatContent: number;
  carbohydrateContent: number;
  fiberContent?: number;
  sugarContent?: number;
  dietaryOptions?: string[];
  allergens?: string[];
  nutritionScore?: number;
  imageUrl?: string;
  price?: number;
}

export interface FoodProposalData {
  name: string;
  category: string;
  servingSize: number;
  caloriesPerServing: number;
  proteinContent: number;
  fatContent: number;
  carbohydrateContent: number;
  dietaryOptions?: string[];
  nutritionScore?: number;
  imageUrl?: string;
  allergens?: string[];
}

// Transform API food item to app FoodItem format
const transformFoodItem = (apiFood: ApiFoodItem): FoodItem => {
  // Map category to icon name based on category
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'Fruit': return 'food-apple';
      case 'Vegetable': return 'food-broccoli';
      case 'Dairy': return 'food-variant';
      case 'Meat': return 'food-drumstick';
      case 'Grain': return 'barley';
      case 'Legume': return 'food-bean';
      case 'Nuts & Seeds': return 'peanut';
      case 'Beverage': return 'cup';
      case 'Snack': return 'cookie';
      case 'Condiment': return 'sauce';
      default: return 'food';
    }
  };

  return {
    id: apiFood.id,
    title: apiFood.name,
    description: apiFood.description || '',
    iconName: getCategoryIcon(apiFood.category),
    category: apiFood.category as FoodCategoryType,
    nutritionScore: apiFood.nutritionScore,
    macronutrients: {
      calories: apiFood.caloriesPerServing,
      protein: apiFood.proteinContent,
      carbohydrates: apiFood.carbohydrateContent,
      fat: apiFood.fatContent,
      fiber: apiFood.fiberContent,
      sugar: apiFood.sugarContent,
    },
    dietaryOptions: apiFood.dietaryOptions as any[],
    allergens: apiFood.allergens as any[],
    price: apiFood.price,
  };
};

/**
 * Get food catalog with optional filtering
 * @param limit Maximum number of items to return (default: 50)
 * @param categories Optional comma-separated list of categories to filter by
 * @returns Promise with food items
 */
export const getFoodCatalog = async (
  limit: number = 50,
  categories?: string[]
): Promise<{ data?: FoodItem[]; error?: string; status: number }> => {
  try {
    let queryParams = `limit=${limit}`;
    
    if (categories && categories.length > 0) {
      queryParams += `&categories=${categories.join(',')}`;
    }

    // Since API_CONFIG.BASE_URL already includes '/api', we don't need to include it in the path
    const response = await apiClient.get<any>(`/foods?${queryParams}`);

    // Debug request URL for troubleshooting
    console.log('Requesting food catalog from:', `/foods?${queryParams}`);

    if (response.error) {
      return {
        error: response.error,
        status: response.status,
      };
    }

    if (!response.data) {
      return {
        error: 'No data received',
        status: response.status,
      };
    }

    // Debug log to see the structure of the response
    console.log('API Response:', JSON.stringify(response.data));

    // Handle different response formats
    let foodItems: ApiFoodItem[] = [];
    
    if (Array.isArray(response.data)) {
      // If the response is already an array of food items
      foodItems = response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      // If the response has a results property containing the array (common paginated format)
      foodItems = response.data.results;
    } else if (typeof response.data === 'object') {
      // Try to extract items if it's another kind of object
      const possibleArrayProperties = ['items', 'foods', 'data'];
      for (const prop of possibleArrayProperties) {
        if (response.data[prop] && Array.isArray(response.data[prop])) {
          foodItems = response.data[prop];
          break;
        }
      }
    }

    // If we still don't have an array, create a mock food item for development
    if (foodItems.length === 0) {
      console.warn('No food items found in the API response. Creating mock data for development.');

      // Create mock food items for development
      foodItems = [
        {
          id: 1,
          name: 'Organic Apples',
          category: 'Fruit',
          description: 'Fresh, locally grown organic apples. Rich in fiber and antioxidants.',
          servingSize: 100,
          caloriesPerServing: 52,
          proteinContent: 0.3,
          fatContent: 0.2,
          carbohydrateContent: 14,
          fiberContent: 2.4,
          nutritionScore: 8.5,
          dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free'],
          price: 3.99,
        },
        {
          id: 2,
          name: 'Greek Yogurt',
          category: 'Dairy',
          description: 'Creamy Greek yogurt with high protein content. Perfect for breakfast or snacks.',
          servingSize: 100,
          caloriesPerServing: 100,
          proteinContent: 10,
          fatContent: 5,
          carbohydrateContent: 4,
          nutritionScore: 7.8,
          dietaryOptions: ['Vegetarian', 'High-protein'],
          allergens: ['Lactose'],
          price: 4.99,
        }
      ];
    }

    // Transform API response to app format
    const transformedData = foodItems.map(transformFoodItem);

    return {
      data: transformedData,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Error fetching food catalog:', error);
    return {
      error: error.message || 'Failed to fetch food catalog',
      status: 500,
    };
  }
};

/**
 * Submit a food proposal for review
 * @param data Food proposal data
 * @returns Promise with response status
 */
export const submitFoodProposal = async (
  data: FoodProposalData
): Promise<{ data?: any; error?: string; status: number }> => {
  try {
    console.log('Submitting food proposal to:', '/foods/proposal/');
    const response = await apiClient.post<any>('/foods/proposal/', data);
    
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    return {
      error: error.message || 'Failed to submit food proposal',
      status: 500,
    };
  }
};

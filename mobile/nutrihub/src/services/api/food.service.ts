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

export interface ApiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  status?: number;
  warning?: string;
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
 * Get food catalog with optional filtering and pagination
 * @param limit Maximum number of items to return per page (default: 20)
 * @param offset Number of items to skip (for pagination)
 * @param categories Optional array of categories to filter by
 * @param search Optional search term to filter by name
 * @returns Promise with food items and pagination info
 */
export const getFoodCatalog = async (
  limit: number = 20,
  offset: number = 0,
  categories?: string[],
  search?: string
): Promise<{ 
  data?: FoodItem[]; 
  error?: string; 
  status: number; 
  hasMore: boolean; 
  total: number 
}> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Calculate page number from offset/limit
    const page = Math.floor(offset / limit) + 1;
    
    // Add pagination parameters (always required)
    params.append('page', page.toString());
    params.append('page_size', limit.toString());
    
    // Add optional filter parameters
    if (categories && categories.length > 0) {
      params.append('category', categories.join(','));
    }
    
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }

    // Log the request details
    const fullUrl = `/foods?${params.toString()}`;
    console.log(`Requesting food catalog: ${fullUrl}`);
    console.log('Request params:', { page, page_size: limit, categories, search, originalOffset: offset });
    
    // Make the API request
    const response = await apiClient.get<ApiPaginatedResponse<ApiFoodItem>>(fullUrl);
    
    if (response.error) {
      console.error('API error:', response.error);
      return {
        error: response.error,
        status: response.status,
        hasMore: false,
        total: 0
      };
    }

    if (!response.data) {
      console.error('No data received from API');
      return {
        error: 'No data received',
        status: response.status,
        hasMore: false,
        total: 0
      };
    }

    // Log response structure for debugging
    console.log('API response structure:', JSON.stringify({
      count: response.data.count,
      next: response.data.next !== null,
      previous: response.data.previous !== null,
      resultsLength: response.data.results?.length || 0
    }));

    // Handle DRF paginated response
    let foodItems: ApiFoodItem[] = [];
    let total = 0;
    let hasMore = false;
    
    if (response.data.results && Array.isArray(response.data.results)) {
      // Standard DRF pagination format
      foodItems = response.data.results;
      total = response.data.count || 0;
      hasMore = response.data.next !== null;
      
      console.log(`Received ${foodItems.length} items, total=${total}, hasMore=${hasMore}`);
    } else if (Array.isArray(response.data)) {
      // Direct array response
      foodItems = response.data;
      total = foodItems.length;
      hasMore = foodItems.length >= limit;
      
      console.log(`Received array of ${foodItems.length} items`);
    } else {
      // Try to extract items from a non-standard response
      console.warn('Non-standard API response format:', response.data);
      
      // Use type assertion to handle possible non-standard response structure
      const responseData = response.data as Record<string, any>;
      
      // Check various possible property names for the data array
      for (const prop of ['items', 'foods', 'data', 'results']) {
        if (responseData[prop] && Array.isArray(responseData[prop])) {
          foodItems = responseData[prop];
          total = responseData.count || responseData.total || foodItems.length;
          hasMore = !!responseData.next || (offset + foodItems.length < total);
          break;
        }
      }
    }

    // Transform API response to app format
    const transformedData = foodItems.map(transformFoodItem);
    
    // Log the first few IDs for debugging
    if (transformedData.length > 0) {
      console.log('First few item IDs:', transformedData.slice(0, 3).map(item => item.id));
    }

    return {
      data: transformedData,
      status: response.status,
      hasMore,
      total
    };
  } catch (error: any) {
    console.error('Error fetching food catalog:', error);
    return {
      error: error.message || 'Failed to fetch food catalog',
      status: 500,
      hasMore: false,
      total: 0
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

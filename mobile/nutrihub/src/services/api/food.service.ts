import { apiClient } from './client';
import { API_CONFIG } from '../../config';
import { FoodItem, FoodCategoryType } from '../../types/types';

// Base host URL (without /api) for media files
const BASE_HOST = API_CONFIG.BASE_URL.replace('/api', '');

// Helper function to ensure absolute URL for media files
const ensureAbsoluteUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${BASE_HOST}${normalizedPath}`;
};


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
  micronutrients?: Record<string, number>;
  dietaryOptions?: string[];
  allergens?: string[];
  nutritionScore?: number;
  imageUrl?: string;
  price?: number;
  base_price?: string | number | null;
  price_unit?: 'per_100g' | 'per_unit';
  price_category?: string | null; // Can be '₺', '₺ ₺', '₺ ₺₺' or '$', '$$', '$$$'
  currency?: string;
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
  basePrice?: number;
  priceUnit?: 'per_100g' | 'per_unit';
  currency?: string;
  micronutrients?: Record<string, number>;
}

export interface FoodProposalStatus {
  id: number;
  name: string;
  category: string;
  servingSize: number;
  isApproved: boolean | null;
  imageUrl?: string;
  createdAt: string;
}

// Transform API food item to app FoodItem format
export const transformFoodItem = (apiFood: ApiFoodItem): FoodItem => {
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

  const normalizedImageUrl = ensureAbsoluteUrl(apiFood.imageUrl);
  
  if (__DEV__ && apiFood.imageUrl) {
    console.log('🍎 Food image URL normalization:', {
      original: apiFood.imageUrl,
      normalized: normalizedImageUrl,
    });
  }

  // Convert base_price to number if it's a string
  const basePrice = apiFood.base_price 
    ? (typeof apiFood.base_price === 'string' ? parseFloat(apiFood.base_price) : apiFood.base_price)
    : apiFood.price;

  // Normalize price category - convert Turkish Lira symbols to dollar signs for display
  const normalizePriceCategory = (category: string | null | undefined): string | null => {
    if (!category) return null;
    // Convert Turkish Lira symbols to dollar signs and remove spaces
    // Backend returns '₺', '₺ ₺', '₺ ₺₺' which should become '$', '$$', '$$$'
    return category.replace(/₺/g, '$').replace(/\s+/g, '').trim();
  };

  return {
    id: apiFood.id,
    title: apiFood.name,
    description: apiFood.description || '',
    iconName: getCategoryIcon(apiFood.category),
    category: apiFood.category as FoodCategoryType,
    imageUrl: normalizedImageUrl,
    nutritionScore: apiFood.nutritionScore,
    servingSize: apiFood.servingSize,
    macronutrients: {
      calories: apiFood.caloriesPerServing,
      protein: apiFood.proteinContent,
      carbohydrates: apiFood.carbohydrateContent,
      fat: apiFood.fatContent,
      fiber: apiFood.fiberContent,
      sugar: apiFood.sugarContent,
    },
    micronutrients: apiFood.micronutrients,
    dietaryOptions: apiFood.dietaryOptions as any[],
    allergens: apiFood.allergens as any[],
    price: basePrice,
    basePrice: basePrice,
    priceUnit: apiFood.price_unit || 'per_100g',
    priceCategory: normalizePriceCategory(apiFood.price_category),
    currency: apiFood.currency || 'USD',
  };
};

/**
 * Get food catalog with optional filtering, sorting, and pagination
 * @param limit Maximum number of items to return per page (default: 20)
 * @param offset Number of items to skip (for pagination)
 * @param categories Optional array of categories to filter by
 * @param search Optional search term to filter by name
 * @param sortBy Optional sort field (e.g., 'name', 'price', 'nutritionscore', 'proteincontent', 'carbohydratecontent', 'fatcontent')
 * @param sortOrder Optional sort order ('asc' or 'desc', default: 'desc')
 * @returns Promise with food items and pagination info
 */
export const getFoodCatalog = async (
  limit: number = 20,
  offset: number = 0,
  categories?: string[],
  search?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
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
    
    // Add optional sorting parameters
    if (sortBy && sortBy.trim() !== '') {
      params.append('sort_by', sortBy.trim());
      if (sortOrder) {
        params.append('order', sortOrder);
      }
    }

    // Log the request details
    const fullUrl = `/foods?${params.toString()}`;
    console.log(`Requesting food catalog: ${fullUrl}`);
    console.log('Request params:', { page, page_size: limit, categories, search, sortBy, sortOrder, originalOffset: offset });
    
    // Make the API request
    const response = await apiClient.get<ApiPaginatedResponse<ApiFoodItem>>(fullUrl);

    if (response.error) {
      // Special handling for pagination 404 errors
      // When requesting pages beyond available results, backend returns 404 "Invalid page"
      // This should be treated as "no more results" rather than a fatal error
      if (response.status === 404 && 
          (response.error.toLowerCase().includes('invalid page') || 
           response.error.toLowerCase().includes('page'))) {
        console.log('No more pages available (404), treating as end of results');
        return {
          data: [],
          status: 200, // Return success status
          hasMore: false,
          total: 0
        };
      }
      
      // For other errors, return the error as before
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
 * Calculate nutrition score following the backend logic
 * @param protein Protein content in grams
 * @param carbs Carbohydrate content in grams
 * @param fat Fat content in grams
 * @param category Food category
 * @param name Food name
 * @returns Nutrition score (0-10)
 */
export const calculateNutritionScore = (
  protein: number,
  carbs: number,
  fat: number,
  category: string,
  name: string
): number => {
  // 1. Protein content (30% of score)
  const proteinScore = Math.min(protein / 10, 3) * (0.3 * 10 / 3);

  // 2. Carbohydrate quality (30% of score)
  let carbQualityScore = 1.5; // Default moderate score

  const lowerCategory = category.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerCategory.includes('vegetable') || lowerCategory.includes('fruit')) {
    carbQualityScore = 3; // Max score
  } else if (lowerName.includes('whole') && lowerCategory.includes('grain')) {
    carbQualityScore = 2.5; // Whole grains
  } else if (lowerCategory.includes('grain')) {
    carbQualityScore = 2; // Regular grains
  } else if (lowerCategory.includes('dairy')) {
    carbQualityScore = 1.5; // Dairy
  } else if (lowerCategory.includes('sweets') || lowerCategory.includes('snacks')) {
    carbQualityScore = 0.5; // Sweets and snacks
  }

  // Scale carb quality to 30% of total score
  carbQualityScore = carbQualityScore * (0.3 * 10 / 3);

  // 3. Nutrient balance (40% of score)
  const totalMacros = protein * 4 + carbs * 4 + fat * 9;

  let nutrientBalanceScore = 0;
  if (totalMacros > 0) {
    // Calculate percentage of calories from each macro
    const proteinPct = (protein * 4) / totalMacros;
    const carbsPct = (carbs * 4) / totalMacros;
    const fatPct = (fat * 9) / totalMacros;

    // Score for each macronutrient's balance
    let proteinBalance = 0.5;
    if (proteinPct >= 0.1 && proteinPct <= 0.35) {
      proteinBalance = 1.0; // Good range
    } else if (proteinPct > 0.35) {
      proteinBalance = 0.7; // Too high
    }

    let carbsBalance = 0.7;
    if (carbsPct >= 0.45 && carbsPct <= 0.65) {
      carbsBalance = 1.0; // Good range
    } else if (carbsPct > 0.65) {
      carbsBalance = 0.7; // Too high
    }

    let fatBalance = 0.7;
    if (fatPct >= 0.2 && fatPct <= 0.35) {
      fatBalance = 1.0; // Good range
    } else if (fatPct > 0.35) {
      fatBalance = 0.5; // Too high
    }

    // Combine the balance scores
    nutrientBalanceScore = (proteinBalance + carbsBalance + fatBalance) * (0.4 * 10 / 3);
  }

  // Calculate final score (0-10 scale)
  const finalScore = proteinScore + carbQualityScore + nutrientBalanceScore;

  // Cap at 10 and round to 2 decimal places
  return Math.round(Math.min(finalScore, 10.0) * 100) / 100;
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
    // Calculate nutrition score 
    const nutritionScore = calculateNutritionScore(
      data.proteinContent,
      data.carbohydrateContent,
      data.fatContent,
      data.category,
      data.name
    );

    // Prepare the proposal data to match backend expectations
    const proposalPayload = {
      name: data.name,
      category: data.category,
      servingSize: data.servingSize,
      caloriesPerServing: data.caloriesPerServing,
      proteinContent: data.proteinContent,
      fatContent: data.fatContent,
      carbohydrateContent: data.carbohydrateContent,
      dietaryOptions: data.dietaryOptions || [],
      nutritionScore: nutritionScore,
      imageUrl: data.imageUrl,
    };

    console.log('Submitting food proposal to:', '/foods/manual-proposal/');
    console.log('Proposal data:', proposalPayload);

    const response = await apiClient.post<any>('/foods/manual-proposal/', proposalPayload);

    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Error submitting food proposal:', error);
    return {
      error: error.message || 'Failed to submit food proposal',
      status: 500,
    };
  }
};

/**
 * Fetch current user's food proposals (pending/approved/rejected)
 */
export const getFoodProposals = async (): Promise<FoodProposalStatus[]> => {
  const response = await apiClient.get<FoodProposalStatus[]>('/foods/get-proposal-status/');
  return response.data || [];
};

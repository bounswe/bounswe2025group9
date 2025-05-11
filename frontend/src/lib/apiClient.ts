// api client for making requests to our mock api

export interface PaginationResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
// types
export interface Food {
  id: number;
  name: string;
  category: string;
  servingSize: number;
  caloriesPerServing: number;
  proteinContent: number;
  fatContent: number;
  carbohydrateContent: number;
  allergens: string[];
  dietaryOptions: string[];
  nutritionScore: number;
  imageUrl: string;
}

export interface FoodProposal {
  name: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
  };
  dietaryTags?: string[];
  imageUrl?: string;
}

export interface FoodProposalResponse {
  message: string;
  proposalId: number;
  nutritionScore: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  likes: number;
  date: string;
  type: 'recipe' | 'nutrition_tip';
}

export interface PostIngredient {
  id: number;
  foodId: number;
  foodName: string;
  amount: number;
}

export interface CreatePostRequest {
  type: 'recipe' | 'nutrition_tip';
  title: string;
  content?: string;  // For nutrition tips
  ingredients?: PostIngredient[];  // For recipes
  instructions?: string;  // For recipes
}

export interface CreatePostResponse {
  message: string;
  post: Post;
}

export interface AuthResponse {
  id: number;
  email: string;
  username: string;
}

export interface LikeResponse {
  itemId: number;
  itemType: string;
  likes: number;
  message?: string;
}

// jwt auth types
export interface JwtResponse {
  access: string;
  refresh: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  address: string;
  tags: any[];
  allergens: any[];
}

// api base urls
const BACKEND_API_URL = "http://localhost:8081";
const MOCK_API_URL = "/api";

// token storage
let accessToken: string | null = null;

// set access token
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

// get auth header
const getAuthHeader = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    console.log('Using auth token:', accessToken.substring(0, 10) + '...');
  } else {
    console.log('No auth token available');
  }
  
  return headers;
};

// helper function for fetch requests
async function fetchJson<T>(url: string, options?: RequestInit, useRealBackend: boolean = false): Promise<T> {
  const defaultHeaders = getAuthHeader();
  const baseUrl = useRealBackend ? BACKEND_API_URL : MOCK_API_URL;
  const fullUrl = `${baseUrl}${url}`;
  
  console.log(`Making API request to: ${fullUrl}`, {
    method: options?.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    }
  });
  
  try {
    const fetchOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options?.headers || {}),
      },
      credentials: 'include' as RequestCredentials, // Include cookies for CORS
    };
    
    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      let errorBody = 'No error details available';
      try {
        const errorText = await response.text();
        errorBody = errorText;
        // Try parsing as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          errorBody = JSON.stringify(errorJson, null, 2);
        } catch {
          // Not JSON, use as is
        }
      } catch (e) {
        console.error('Failed to read error response:', e);
      }
      
      console.error(`API error (${response.status} ${response.statusText}):`, errorBody);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Response from ${options?.method || 'GET'} ${url}:`, data);
    return data as T;
  } catch (error) {
    console.error(`Failed request to ${fullUrl}:`, error);
    throw error;
  }
}

// api endpoints
export const apiClient = {
  // foods
  getFoods: (params?: { page?: number }) => {
    let url = "/foods";
    // set page number
    if (params && params.page) {
      url += `?page=${params.page}`;
    }
    return fetchJson<PaginationResponse<Food>>(url, {
      method: "GET",
    }, true);
  },

  proposeFood: (proposal: FoodProposal) =>
    fetchJson<FoodProposalResponse>("/foods/propose", {
      method: "POST",
      body: JSON.stringify(proposal),
    }),

  // posts
  getPosts: () => fetchJson<Post[]>("/posts"),
  
  createPost: (postData: CreatePostRequest) =>
    fetchJson<CreatePostResponse>("/posts/create", {
      method: "POST",
      body: JSON.stringify(postData),
    }),

  // auth - use real backend
  login: (username: string, password: string) =>
    fetchJson<JwtResponse>("/users/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }, true),
    
  refreshToken: (refresh: string) =>
    fetchJson<JwtResponse>("/users/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }, true),

  signup: (data: {
    username: string;
    password: string;
    name: string;
    surname: string;
    email: string;
    address?: string;
    tags?: any[];
    allergens?: any[];
  }) =>
    fetchJson<UserResponse>("/users/create/", {
      method: "POST",
      body: JSON.stringify(data),
    }, true),

  // user profile - use real backend
  getUserProfile: () => {
    console.log('Getting user profile from backend');
    // Log detailed request info
    const url = "/users/profile/";
    console.log('Request URL:', BACKEND_API_URL + url);
    console.log('Auth headers:', getAuthHeader());
    
    return fetchJson<UserResponse>(url, {
      method: "GET"
    }, true);
  },

  // likes
  likeItem: (itemId: number, itemType: "food" | "post") =>
    fetchJson<LikeResponse>("/like", {
      method: "POST",
      body: JSON.stringify({ itemId, itemType }),
    }),

  getItemLikes: (itemType: "foods" | "posts", itemId: number) =>
    fetchJson<LikeResponse>(`/likes/${itemType}/${itemId}`),
};

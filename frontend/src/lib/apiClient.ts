// api client for making requests to our mock api

// types
export interface Food {
  id: number;
  name: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  nutritionScore: number;
  dietaryTags: string[];
  perUnit: string;
  imageUrl: string;
  likes?: number;
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
  }
  
  return headers;
};

// helper function for fetch requests
async function fetchJson<T>(url: string, options?: RequestInit, useRealBackend: boolean = false): Promise<T> {
  const defaultHeaders = getAuthHeader();
  const baseUrl = useRealBackend ? BACKEND_API_URL : MOCK_API_URL;
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// api endpoints
export const apiClient = {
  // foods
  getFoods: () => fetchJson<Food[]>("/foods"),

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

  // likes
  likeItem: (itemId: number, itemType: "food" | "post") =>
    fetchJson<LikeResponse>("/like", {
      method: "POST",
      body: JSON.stringify({ itemId, itemType }),
    }),

  getItemLikes: (itemType: "foods" | "posts", itemId: number) =>
    fetchJson<LikeResponse>(`/likes/${itemType}/${itemId}`),
};

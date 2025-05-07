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

// api base url
const API_BASE_URL = "http://localhost:8081";

// helper function for fetch requests
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
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

  // auth
  login: (username: string, password: string) =>
    fetchJson<JwtResponse>("/users/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

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
    }),

  // likes
  likeItem: (itemId: number, itemType: "food" | "post") =>
    fetchJson<LikeResponse>("/like", {
      method: "POST",
      body: JSON.stringify({ itemId, itemType }),
    }),

  getItemLikes: (itemType: "foods" | "posts", itemId: number) =>
    fetchJson<LikeResponse>(`/likes/${itemType}/${itemId}`),
};

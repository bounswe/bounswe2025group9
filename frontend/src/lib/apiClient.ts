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
}

export interface AuthResponse {
  id: number;
  email: string;
  username: string;
}

// api base url
const API_BASE_URL = "/api";

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

  // auth
  login: (email: string, password: string) =>
    fetchJson<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, username: string) =>
    fetchJson<AuthResponse>("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),
};

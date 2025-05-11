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

// forum types
export interface ForumPost {
  id: number;
  title: string;
  body: string;
  author: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  tags: ForumTag[];
}

export interface ForumTag {
  id: number;
  name: string;
}

export interface ForumComment {
  id: number;
  post: number;
  author: {
    id: number;
    username: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CreateForumPostRequest {
  title: string;
  body: string;
  tag_ids?: number[];
}

export interface CreateCommentRequest {
  post: number;
  body: string;
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
  getFoods: () => fetchJson<Food[]>("/foods"),

  proposeFood: (proposal: FoodProposal) =>
    fetchJson<FoodProposalResponse>("/foods/propose", {
      method: "POST",
      body: JSON.stringify(proposal),
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
    
  // forum - use real backend
  getForumPosts: (params?: { 
    tags?: number | number[], 
    author?: number,
    ordering?: string 
  }) => {
    let url = "/forum/posts/";
    if (params) {
      const queryParams = new URLSearchParams();
      
      // Handle tags parameter (can be single or multiple)
      if (params.tags) {
        if (Array.isArray(params.tags)) {
          params.tags.forEach(tag => queryParams.append('tags', tag.toString()));
        } else {
          queryParams.append('tags', params.tags.toString());
        }
      }
      
      // Handle author parameter
      if (params.author) {
        queryParams.append('author', params.author.toString());
      }
      
      // Handle ordering parameter
      if (params.ordering) {
        queryParams.append('ordering', params.ordering);
      }
      
      // Add query string to URL if there are any parameters
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return fetchJson<ForumPost[]>(url, {
      method: "GET"
    }, true);
  },
  
  getForumPostDetail: (postId: number) =>
    fetchJson<ForumPost>(`/forum/posts/${postId}/`, {
      method: "GET"
    }, true),
    
  // alias for getForumPostDetail for consistency
  getPostDetail: (postId: number) =>
    fetchJson<ForumPost>(`/forum/posts/${postId}/`, {
      method: "GET"
    }, true),
    
  createForumPost: (postData: CreateForumPostRequest) =>
    fetchJson<ForumPost>("/forum/posts/", {
      method: "POST",
      body: JSON.stringify(postData)
    }, true),
    
  updateForumPost: (postId: number, updateData: Partial<CreateForumPostRequest>) =>
    fetchJson<ForumPost>(`/forum/posts/${postId}/`, {
      method: "PATCH",
      body: JSON.stringify(updateData)
    }, true),
    
  getForumTags: () =>
    fetchJson<ForumTag[]>("/forum/tags/", {
      method: "GET"
    }, true),
    
  // comments
  getPostComments: (postId: number) =>
    fetchJson<ForumComment[]>(`/forum/comments/?post=${postId}`, {
      method: "GET"
    }, true),
    
  createComment: (commentData: CreateCommentRequest) =>
    fetchJson<ForumComment>("/forum/comments/", {
      method: "POST",
      body: JSON.stringify(commentData)
    }, true),
    
  updateComment: (commentId: number, body: string) =>
    fetchJson<ForumComment>(`/forum/comments/${commentId}/`, {
      method: "PATCH",
      body: JSON.stringify({ body })
    }, true),
    
  deleteComment: (commentId: number) =>
    fetchJson<void>(`/forum/comments/${commentId}/`, {
      method: "DELETE"
    }, true),
};

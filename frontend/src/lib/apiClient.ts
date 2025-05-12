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

// pagination types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
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
  likes: number;
  liked: boolean;
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
const BACKEND_API_URL = import.meta.env.VITE_API_BASE_URL;
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
    console.log('Using auth token:', accessToken.substring(0, 10) + '...', 'Token length:', accessToken.length);
  } else {
    console.log('No auth token available - API request will not be authenticated');
  }
  
  return headers;
};

// helper function for fetch requests
async function fetchJson<T>(url: string, options?: RequestInit, useRealBackend: boolean = false): Promise<T> {
  const defaultHeaders = getAuthHeader();
  const baseUrl = useRealBackend ? BACKEND_API_URL : MOCK_API_URL;
  const fullUrl = `${baseUrl}${url}`;
  
  // Safely access header values
  const authHeaderValue = typeof defaultHeaders === 'object' ? 
    (defaultHeaders as Record<string, string>)['Authorization'] || 'No auth header' : 
    'Headers not an object';
    
  const contentTypeValue = typeof defaultHeaders === 'object' ?
    (defaultHeaders as Record<string, string>)['Content-Type'] || 'No content type' :
    'Headers not an object';
    
  console.log(`Making API request to: ${fullUrl}`, {
    method: options?.method || 'GET',
    authHeader: authHeaderValue.substring(0, 20) + '...',
    contentType: contentTypeValue
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
    ordering?: string,
    page?: number,
    page_size?: number
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
      
      // Handle pagination parameters
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.page_size !== undefined) {
        queryParams.append('page_size', params.page_size.toString());
      }
      
      // Add query string to URL if there are any parameters
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return fetchJson<PaginatedResponse<ForumPost>>(url, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received forum posts:`, response);
      
      // Check if backend is using like_count instead of likes in each post
      if (response && response.results) {
        response.results = response.results.map(post => {
          const postObj = post as any;
          if ('like_count' in postObj && !('likes' in postObj)) {
            console.log('[API] Mapping like_count to likes for post', postObj.id);
            postObj.likes = postObj.like_count;
          }
          return post;
        });
      }
      
      return response;
    });
  },
  
  getForumPostDetail: (postId: number) =>
    fetchJson<ForumPost>(`/forum/posts/${postId}/`, {
      method: "GET"
    }, true),
    
  // alias for getForumPostDetail for consistency
  getPostDetail: (postId: number) => {
    console.log(`[API] Fetching post details for post ID: ${postId}`);
    return fetchJson<ForumPost>(`/forum/posts/${postId}/`, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received post details for post ID ${postId}:`, response);
      
      // Check if backend is using like_count instead of likes
      const responseObj = response as any;
      if ('like_count' in responseObj && !('likes' in responseObj)) {
        console.log('[API] Mapping like_count to likes for consistency');
        responseObj.likes = responseObj.like_count;
      }
      
      return response;
    }).catch(error => {
      console.error(`[API] Error fetching post details for post ID ${postId}:`, error);
      throw error;
    });
  },
    
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
    
  getForumTags: () => {
    console.log('[API] Fetching available forum tags');
    return fetchJson<ForumTag[] | { results: ForumTag[] }>("/forum/tags/", {
      method: "GET"
    }, true).then(response => {
      console.log('[API] Received forum tags response:', response);
      
      // Handle both array and object with results property
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && 'results' in response) {
        return response.results;
      } else {
        console.error('[API] Unexpected format for forum tags:', response);
        return [];
      }
    }).catch(error => {
      console.error('[API] Error fetching forum tags:', error);
      return [];
    });
  },
    
  // comments
  getPostComments: (postId: number, params?: PaginationParams) => {
    let url = `/forum/comments/?post=${postId}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.page_size !== undefined) {
        queryParams.append('page_size', params.page_size.toString());
      }
      
      // Append pagination parameters if they exist
      const queryString = queryParams.toString();
      if (queryString) {
        url += `&${queryString}`;
      }
    }
    
    return fetchJson<PaginatedResponse<ForumComment>>(url, {
      method: "GET"
    }, true);
  },
    
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

  
  toggleLikePost: (postId: number) => {
    console.log(`[API] Toggling like for post ID: ${postId}`);
    return fetchJson<{ liked: boolean, like_count?: number }>(`/forum/posts/${postId}/like/`, {
      method: "POST"
    }, true).then(response => {
      console.log(`[API] Toggle like response for post ID ${postId}:`, response);
      // Check for like_count in the response
      const responseObj = response as any;
      if ('like_count' in responseObj) {
        console.log(`[API] Like count from server: ${responseObj.like_count}`);
      }
      return response;
    }).catch(error => {
      console.error(`[API] Error toggling like for post ID ${postId}:`, error);
      throw error;
    });
  },
};

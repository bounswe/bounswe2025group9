// api client for making requests to our apis
export interface PaginatedResponseWithStatus<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  status?: number;
  warning?: string;
}
// types
export type PriceUnit = 'per_100g' | 'per_unit';
export type PriceCategory = '₺' | '₺ ₺' | '₺ ₺₺';

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
  micronutrients?: Record<string, number>;
  base_price?: string | number | null;
  price_unit?: PriceUnit;
  price_category?: PriceCategory | null;
  currency?: string;
  category_overridden_by?: number | null;
  category_override_reason?: string | null;
  category_overridden_at?: string | null;
}

export interface FoodProposal {
  name: string;
  category: string;
  servingSize: number;
  caloriesPerServing: number;
  proteinContent: number;
  fatContent: number;
  carbohydrateContent: number;
  allergens?: number[];
  dietaryOptions?: string[];
  nutritionScore: number;
  imageUrl?: string;
  base_price?: string | number | null;
  price_unit?: PriceUnit;
  currency?: string;
  micronutrients?: { [key: string]: number };
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
  profile_image?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
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
    profile_image?: string | null;
  };
  created_at: string;
  updated_at: string;
  tags: ForumTag[];
  likes: number;
  liked: boolean;
  has_recipe?: boolean;
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
    profile_image?: string | null;
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

// Recipe types
export interface RecipeIngredient {
  id?: number;
  food_id: number;
  food_name?: string;
  amount: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  calories?: number;
}

export interface Recipe {
  id: number;
  post_id?: number;
  post_title?: string;
  author?: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  total_protein: number;
  total_fat: number;
  total_carbohydrates: number;
  total_calories: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipeRequest {
  post_id: number;
  instructions: string;
  ingredients: {
    food_id: number;
    amount: number;
  }[];
}

// Meal Planner types
export interface MealPlan {
  id: number;
  name: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbohydrates: number;
  meals: {
    food_id: number;
    meal_type: string;
    serving_size: number;
  }[];
  meals_details: {
    food: Food;
    serving_size: number;
    meal_type: string;
    calculated_nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbohydrates: number;
    };
  }[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export interface PriceCategoryThreshold {
  id: number;
  price_unit: PriceUnit;
  price_unit_display?: string;
  currency: string;
  lower_threshold: string | null;
  upper_threshold: string | null;
  updates_since_recalculation: number;
  last_recalculated_at: string | null;
}

export interface PriceAudit {
  id: number;
  food?: number | null;
  food_name?: string | null;
  price_unit: PriceUnit;
  currency: string;
  old_base_price?: string | null;
  new_base_price?: string | null;
  old_price_category?: PriceCategory | null;
  new_price_category?: PriceCategory | null;
  change_type: string;
  changed_by?: number | null;
  changed_by_username?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type PriceReportStatus = 'open' | 'in_review' | 'resolved';

export interface PriceReport {
  id: number;
  food: number;
  food_name?: string;
  reported_by: number;
  reported_by_username?: string;
  description: string;
  status: PriceReportStatus;
  resolution_notes?: string;
  resolved_by?: number | null;
  resolved_by_username?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
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
      let errorData = null;
      
      try {
        const errorText = await response.text();
        errorBody = errorText;
        // Try parsing as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          errorData = errorJson;
          errorBody = JSON.stringify(errorJson, null, 2);
        } catch {
          // Not JSON, use as is
        }
      } catch (e) {
        console.error('Failed to read error response:', e);
      }
      
      console.error(`API error (${response.status} ${response.statusText}):`, errorBody);
      
      // Create a custom error with the error data attached
      const error = new Error(`API error: ${response.status} ${response.statusText}`);
      // @ts-ignore - Adding custom property to Error object
      error.status = response.status;
      // @ts-ignore - Adding custom property to Error object
      error.statusText = response.statusText;
      // @ts-ignore - Adding custom property to Error object
      error.data = errorData;
      
      throw error;
    }

    // Handle empty responses (like 204 No Content for DELETE requests)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log(`Response from ${options?.method || 'GET'} ${url}: No content`);
      return undefined as T;
    }

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`Response from ${options?.method || 'GET'} ${url}: Non-JSON content`);
      return undefined as T;
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
  getFoods: (params?: { page?: number, search?: string, sort_by?: string, order?: string }) => {
    let url = "/foods/";
    const queryParams = new URLSearchParams();
    if (params && params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params && params.search) {
      queryParams.append('search', params.search);
    }
    if (params && params.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params && params.order) {
      queryParams.append('order', params.order);
    }
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return fetchJson<PaginatedResponseWithStatus<Food>>(url, {
      method: "GET",
    }, true);
  },

  proposeFood: (proposal: FoodProposal) =>
    fetchJson<FoodProposalResponse>("/foods/manual-proposal/", {
      method: "POST",
      body: JSON.stringify(proposal),
    }, true),

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

  // get other user's profile by username
  getOtherUserProfile: (username: string) => {
    console.log(`Getting user profile for username: ${username}`);
    const url = `/users/@${username}/`;
    console.log('Request URL:', BACKEND_API_URL + url);

    return fetchJson<UserResponse>(url, {
      method: "GET"
    }, true);
  },

  // get common allergens
  getCommonAllergens: () =>
    fetchJson<Array<{ id: number; name: string; common: boolean }>>("/users/allergen/common-list/", {
      method: "GET",
    }, true),

  // update allergens - expects array of allergen objects with optional id or name
  updateAllergens: (allergens: Array<{ id?: number; name?: string; common?: boolean }>) =>
    fetchJson<Array<{ id: number; name: string; common: boolean }>>("/users/allergen/set/", {
      method: "POST",
      body: JSON.stringify(allergens),
    }, true),

  // update profession tags
  updateProfessionTags: (tags: any[]) =>
    fetchJson<UserResponse>("/users/tag/set/", {
      method: "POST",
      body: JSON.stringify(tags),
    }, true),

  // upload certificate
  uploadCertificate: (formData: FormData) => {
    const headers: HeadersInit = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${BACKEND_API_URL}/users/certificate/`, {
      method: "POST",
      headers,
      body: formData,
      credentials: 'include' as RequestCredentials,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    });
  },

  // remove certificate
  removeCertificate: (tagId: number) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${BACKEND_API_URL}/users/certificate/`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ tag_id: tagId }),
      credentials: 'include' as RequestCredentials,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    });
  },

  // upload profile picture
  uploadProfilePicture: (formData: FormData) => {
    const headers: HeadersInit = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${BACKEND_API_URL}/users/image/`, {
      method: "POST",
      headers,
      body: formData,
      credentials: 'include' as RequestCredentials,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    });
  },

  // remove profile picture
  removeProfilePicture: () =>
    fetchJson<void>("/users/image/", {
      method: "DELETE",
    }, true),

  // get liked posts
  getLikedPosts: () =>
    fetchJson<PaginatedResponse<ForumPost>>("/users/profile/liked-posts/", {
      method: "GET"
    }, true),

  // get liked recipes
  getLikedRecipes: () =>
    fetchJson<PaginatedResponse<Recipe>>("/users/profile/liked-recipes/", {
      method: "GET"
    }, true),

  // report user
  reportUser: (data: { userId: string; reason: string; description: string }) =>
    fetchJson<{ message: string }>("/users/report/", {
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
          // Ensure likes is always a non-negative number
          if (typeof postObj.likes !== 'number' || postObj.likes < 0) {
            console.log('[API] Ensuring non-negative like count for post', postObj.id, 'current:', postObj.likes);
            postObj.likes = Math.max(0, postObj.likes || 0);
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
      // Ensure likes is always a non-negative number
      if (typeof responseObj.likes !== 'number' || responseObj.likes < 0) {
        console.log('[API] Ensuring non-negative like count for post detail', postId, 'current:', responseObj.likes);
        responseObj.likes = Math.max(0, responseObj.likes || 0);
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

  
  // Get personalized feed
  getPersonalizedFeed: (params?: PaginationParams) => {
    let url = "/users/feed/";
    
    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params.page_size !== undefined) {
        queryParams.append('page_size', params.page_size.toString());
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    console.log('[API] Fetching personalized feed');
    return fetchJson<PaginatedResponse<ForumPost>>(url, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received personalized feed:`, response);
      
      // Check if backend is using like_count instead of likes in each post
      if (response && response.results) {
        response.results = response.results.map(post => {
          const postObj = post as any;
          if ('like_count' in postObj && !('likes' in postObj)) {
            console.log('[API] Mapping like_count to likes for post', postObj.id);
            postObj.likes = postObj.like_count;
          }
          // Ensure likes is always a non-negative number
          if (typeof postObj.likes !== 'number' || postObj.likes < 0) {
            console.log('[API] Ensuring non-negative like count for post', postObj.id, 'current:', postObj.likes);
            postObj.likes = Math.max(0, postObj.likes || 0);
          }
          return post;
        });
      }
      
      return response;
    });
  },

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

  // search forum posts with fuzzy matching
  searchForumPosts: (query: string) => {
    console.log(`[API] Searching for posts with query: "${query}"`);
    const url = `/forum/posts/search/?q=${encodeURIComponent(query)}`;
    
    return fetchJson<PaginatedResponse<ForumPost>>(url, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received search results for query "${query}":`, response);
      
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
    }).catch(error => {
      console.error(`[API] Error searching for posts with query "${query}":`, error);
      throw error;
    });
  },
  
  // Follow system
  toggleFollowUser: (username: string) => {
    console.log(`[API] Toggling follow for user: ${username}`);
    return fetchJson<{ message: string }>("/users/follow/", {
      method: "POST",
      body: JSON.stringify({ username })
    }, true).then(response => {
      console.log(`[API] Toggle follow response:`, response);
      return response;
    });
  },

  getFollowers: (username: string) => {
    console.log(`[API] Fetching followers for user: ${username}`);
    return fetchJson<{ followers: Array<{ id: number; username: string; profile_image?: string }> }>(`/users/followers/${username}/`, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received followers:`, response);
      return response;
    });
  },

  getFollowing: (username: string) => {
    console.log(`[API] Fetching following for user: ${username}`);
    return fetchJson<{ following: Array<{ id: number; username: string; profile_image?: string }> }>(`/users/following/${username}/`, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received following:`, response);
      return response;
    });
  },

  // logout endpoint
  logout: (refreshToken: string) => {
    console.log('[API] Logging out on the server');
    return fetchJson<void>("/users/token/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    }, true).catch(error => {
      console.error('[API] Error during logout:', error);
      // Even if the server logout fails, we want to continue with the local logout
      // Just log the error but don't throw
    });
  },

  // recipes
  createRecipe: (recipeData: CreateRecipeRequest) =>
    fetchJson<Recipe>("/forum/recipes/", {
      method: "POST",
      body: JSON.stringify(recipeData)
    }, true),
    
  getRecipe: (recipeId: number) =>
    fetchJson<Recipe>(`/forum/recipes/${recipeId}/`, {
      method: "GET"
    }, true),
    
  getRecipeForPost: (postId: number) => {
    console.log(`[API] Fetching recipe for post ID: ${postId}`);
    return fetchJson<PaginatedResponse<Recipe>>(`/forum/recipes/?post=${postId}`, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received recipe for post ID ${postId}:`, response);
      // Return the first recipe if it exists
      if (response && response.results && response.results.length > 0) {
        return response.results[0];
      }
      return null;
    }).catch(error => {
      console.error(`[API] Error fetching recipe for post ID ${postId}:`, error);
      throw error;
    });
  },
    
  updateRecipe: (recipeId: number, updateData: Partial<CreateRecipeRequest>) =>
    fetchJson<Recipe>(`/forum/recipes/${recipeId}/`, {
      method: "PATCH",
      body: JSON.stringify(updateData)
    }, true),

  // Meal planner endpoints
  createMealPlan: (mealPlanData: {
    name: string;
    meals: {
      food_id: number;
      serving_size: number;
      meal_type: string;
    }[];
  }) => {
    console.log(`[API] Creating meal plan with name: ${mealPlanData.name}`);
    const headers: HeadersInit = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    headers["Content-Type"] = "application/json";

    return fetch(`${BACKEND_API_URL}/meal-planner/plans/`, {
      method: "POST",
      headers,
      body: JSON.stringify(mealPlanData),
      credentials: 'include' as RequestCredentials,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    });
  },

  getMealPlans: () => {
    console.log('[API] Fetching meal plans');
    return fetchJson<PaginatedResponse<MealPlan>>("/meal-planner/plans/", {
      method: "GET"
    }, true);
  },

  setCurrentMealPlan: (planId: number) => {
    console.log(`[API] Setting current meal plan to ID: ${planId}`);
    return fetchJson<MealPlan>(`/meal-planner/plans/${planId}/set_current/`, {
      method: "POST"
    }, true);
  },

  getCurrentMealPlan: () => {
    console.log(`[API] Fetching current meal plan`);
    return fetchJson<MealPlan>(`/meal-planner/current/`, {
      method: "GET"
    }, true).then(response => {
      console.log(`[API] Received current meal plan:`, response);
      return response;
    }).catch(error => {
      console.error(`[API] Error fetching current meal plan:`, error);
      throw error;
    });
  },

  // Nutrition Tracking API

  // User Metrics
  getUserMetrics: () =>
    fetchJson<import('../types/nutrition').UserMetrics>("/users/metrics/", {
      method: "GET"
    }, true),

  createUserMetrics: (metrics: import('../types/nutrition').UserMetrics) =>
    fetchJson<import('../types/nutrition').UserMetrics>("/users/metrics/", {
      method: "POST",
      body: JSON.stringify(metrics)
    }, true),

  // Nutrition Targets
  getNutritionTargets: () =>
    fetchJson<import('../types/nutrition').NutritionTargets>("/users/nutrition-targets/", {
      method: "GET"
    }, true),

  updateNutritionTargets: (targets: Partial<import('../types/nutrition').NutritionTargets>) =>
    fetchJson<import('../types/nutrition').NutritionTargets>("/users/nutrition-targets/", {
      method: "PUT",
      body: JSON.stringify(targets)
    }, true),

  resetNutritionTargets: () =>
    fetchJson<import('../types/nutrition').NutritionTargets>("/users/nutrition-targets/reset/", {
      method: "POST"
    }, true),

  // Daily Nutrition Log
  getDailyLog: (date?: string) => {
    let url = "/meal-planner/daily-log/";
    if (date) {
      url += `?date=${date}`;
    }
    return fetchJson<import('../types/nutrition').DailyNutritionLog>(url, {
      method: "GET"
    }, true);
  },

  getDailyLogHistory: (startDate?: string, endDate?: string) => {
    let url = "/meal-planner/daily-log/history/";
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return fetchJson<import('../types/nutrition').DailyNutritionLog[]>(url, {
      method: "GET"
    }, true);
  },

  // Food Log Entries
  addFoodEntry: (entry: {
    food_id: number;
    serving_size: number;
    serving_unit: string;
    meal_type: string;
    date?: string;
  }) =>
    fetchJson<import('../types/nutrition').FoodLogEntry>("/meal-planner/daily-log/entries/", {
      method: "POST",
      body: JSON.stringify(entry)
    }, true),

  updateFoodEntry: (id: number, update: {
    food_id?: number | null;
    private_food_id?: number | null;
    serving_size?: number;
    serving_unit?: string;
    meal_type?: string;
  }) =>
    fetchJson<import('../types/nutrition').FoodLogEntry>(`/meal-planner/daily-log/entries/${id}/`, {
      method: "PUT",
      body: JSON.stringify(update)
    }, true),

  deleteFoodEntry: (id: number) =>
    fetchJson<void>(`/meal-planner/daily-log/entries/${id}/`, {
      method: "DELETE"
    }, true),

  // Nutrition Statistics
  getNutritionStatistics: (period: 'week' | 'month' = 'week') =>
    fetchJson<import('../types/nutrition').NutritionStatistics>(`/meal-planner/nutrition-statistics/?period=${period}`, {
      method: "GET"
    }, true),

  // Moderation endpoints
  moderation: {
    // User management
    getUsers: (params?: { role?: 'staff' | 'users'; search?: string }) => {
      let url = "/users/moderation/";
      const queryParams = new URLSearchParams();

      if (params?.role) {
        queryParams.append('role', params.role);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      return fetchJson<any>(url, { method: "GET" }, true);
    },

    toggleUserActive: (userId: number, isActive: boolean, reason: string) =>
      fetchJson<{ message: string }>(`/users/moderation/${userId}/toggle_active/`, {
        method: "POST",
        body: JSON.stringify({ is_active: isActive, reason }),
      }, true),

    // Content moderation
    getPosts: () =>
      fetchJson<any>("/forum/moderation/posts/", { method: "GET" }, true),

    getComments: () =>
      fetchJson<any>("/forum/moderation/comments/", { method: "GET" }, true),

    deletePost: (postId: number) =>
      fetchJson<void>(`/forum/moderation/posts/${postId}/`, {
        method: "DELETE",
      }, true),

    deleteComment: (commentId: number) =>
      fetchJson<void>(`/forum/moderation/comments/${commentId}/`, {
        method: "DELETE",
      }, true),

    // Food proposals
    getFoodProposals: (params?: { isApproved?: 'null' | 'true' | 'false' }) => {
      let url = "/foods/moderation/food-proposals/";

      if (params?.isApproved) {
        url += `?isApproved=${params.isApproved}`;
      }

      return fetchJson<any>(url, { method: "GET" }, true);
    },

    approveFoodProposal: (proposalId: number, approved: boolean) =>
      fetchJson<{ message: string }>(`/foods/moderation/food-proposals/${proposalId}/approve/`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      }, true),

    // Price moderation
    getPriceThresholds: (params?: { currency?: string }) => {
      let url = "/foods/price-thresholds/";
      if (params?.currency) {
        url += `?currency=${params.currency}`;
      }
      return fetchJson<
        PriceCategoryThreshold[] | PaginatedResponse<PriceCategoryThreshold>
      >(url, { method: "GET" }, true);
    },

    recalculatePriceThreshold: (data: { price_unit: PriceUnit; currency?: string }) =>
      fetchJson<PriceCategoryThreshold>("/foods/price-thresholds/recalculate/", {
        method: "POST",
        body: JSON.stringify({
          price_unit: data.price_unit,
          currency: data.currency,
        }),
      }, true),

    updateFoodPrice: (
      foodId: number,
      payload: {
        base_price: string | number;
        price_unit: PriceUnit;
        currency: string;
        reason?: string;
        override_category?: PriceCategory | null;
        override_reason?: string;
        clear_override?: boolean;
      }
    ) =>
      fetchJson<Food>(`/foods/${foodId}/price/`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, true),

    getPriceAudits: (params?: { food?: number; change_type?: string; price_unit?: PriceUnit }) => {
      let url = "/foods/price-audits/";
      const query = new URLSearchParams();
      if (params?.food) {
        query.append("food", params.food.toString());
      }
      if (params?.change_type) {
        query.append("change_type", params.change_type);
      }
      if (params?.price_unit) {
        query.append("price_unit", params.price_unit);
      }
      const queryString = query.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      return fetchJson<PaginatedResponse<PriceAudit> | PriceAudit[]>(url, { method: "GET" }, true);
    },

    getPriceReports: (params?: { status?: PriceReportStatus }) => {
      let url = "/foods/price-reports/";
      if (params?.status) {
        url += `?status=${params.status}`;
      }
      return fetchJson<PaginatedResponse<PriceReport> | PriceReport[]>(url, { method: "GET" }, true);
    },

    updatePriceReport: (
      reportId: number,
      data: { status?: PriceReportStatus; resolution_notes?: string }
    ) =>
      fetchJson<PriceReport>(`/foods/price-reports/${reportId}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }, true),

    // Certificate verification
    getUserTags: (params?: { has_certificate?: boolean; verified?: boolean }) => {
      let url = "/users/moderation/user-tags/";
      const queryParams = new URLSearchParams();

      if (params?.has_certificate !== undefined) {
        queryParams.append('has_certificate', params.has_certificate.toString());
      }
      if (params?.verified !== undefined) {
        queryParams.append('verified', params.verified.toString());
      }

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      return fetchJson<any>(url, { method: "GET" }, true);
    },

    verifyUserTag: (userTagId: number, approved: boolean) =>
      fetchJson<{ message: string }>(`/users/moderation/user-tags/${userTagId}/verify/`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      }, true),

    // Statistics
    getStats: (range: 'week' | 'month' | 'all' = 'week') =>
      fetchJson<any>(`/users/moderation/stats/?range=${range}`, {
        method: "GET",
      }, true),
  },
};

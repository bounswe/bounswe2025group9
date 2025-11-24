/**
 * Forum service for interacting with the forum-related API endpoints
 */

import { apiClient } from './client';
import { ForumTopic, Comment, PostTagType } from '../../types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked posts
const LIKED_POSTS_STORAGE_KEY = 'nutrihub_liked_posts';

// Initialize liked posts in AsyncStorage if it doesn't exist
const initializeLikedPosts = async (): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    if (existingData === null) {
      await AsyncStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing liked posts storage:', error);
  }
};

// Call initialization on app startup
initializeLikedPosts();

// API response interface for paginated results
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API response interfaces matching backend structure
type ApiAuthor =
  | string
  | {
      id?: number;
      username?: string;
      profile_image?: string | null;
      name?: string | null;
      surname?: string | null;
    };

export interface ApiForumTopic {
  id: number;
  title: string;
  body: string;
  author: ApiAuthor;
  tags: Array<{
    id: number;
    name: string;
  }>;
  like_count: number;
  comments_count?: number; // Some endpoints might include this
  is_liked?: boolean;      // Some endpoints might include this
  created_at: string;
  updated_at: string;
  has_recipe?: boolean;
}

export interface ApiComment {
  id: number;
  post: number;
  body: string;
  author: ApiAuthor;
  like_count?: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiTag {
  id: number;
  name: string;
}

export interface CreatePostRequest {
  title: string;
  body: string;
  tag_ids?: number[];
}

export interface CreateCommentRequest {
  post: number;
  body: string;
}

export interface RecipeIngredient {
  food_id: number;
  amount: number;
}

export interface CreateRecipeRequest {
  post_id: number;
  instructions: string;
  ingredients: RecipeIngredient[];
}

export interface ApiRecipeIngredient {
  id: number;
  food_name: string;
  amount: number;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export interface RecipeDetail {
  id: number;
  post_id?: number;
  post_title?: string;
  author?: any;
  instructions: string;
  ingredients: ApiRecipeIngredient[];
  total_protein: number;
  total_fat: number;
  total_carbohydrates: number;
  total_calories: number;
  created_at?: string;
  updated_at?: string;
}

const normalizeAuthor = (author: ApiAuthor) => {
  if (!author) {
    return {
      username: 'Unknown user',
      displayName: 'Unknown user',
      id: undefined as number | undefined,
      profileImage: undefined as string | undefined,
    };
  }

  if (typeof author === 'string') {
    return {
      username: author,
      displayName: author,
      id: undefined as number | undefined,
      profileImage: undefined as string | undefined,
    };
  }

  const nameParts = [author.name, author.surname].filter(Boolean) as string[];
  const displayName = nameParts.length > 0 ? nameParts.join(' ') : author.username;

  return {
    username: author.username || displayName || 'Unknown user',
    displayName: displayName || author.username || 'Unknown user',
    id: author.id,
    profileImage: author.profile_image ?? undefined,
  };
};

// Convert API response to our ForumTopic type
const mapApiTopicToForumTopic = async (apiTopic: ApiForumTopic): Promise<ForumTopic> => {
  // Check if this post is in our locally stored liked posts
  try {
    const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    const likedPosts: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
    const normalizedAuthor = normalizeAuthor(apiTopic.author);

    // Override isLiked based on local storage if available
    const isLocallyLiked = likedPosts.includes(apiTopic.id);
    const isLiked = isLocallyLiked || apiTopic.is_liked || false;
    
    return {
      id: apiTopic.id,
      title: apiTopic.title,
      content: apiTopic.body,
      author: normalizedAuthor.username,
      authorId: normalizedAuthor.id || 0, // Fallback when ID is not provided
      authorProfileImage: normalizedAuthor.profileImage,
      authorDisplayName: normalizedAuthor.displayName,
      commentsCount: apiTopic.comments_count || 0, // Use API value if available
      likesCount: apiTopic.like_count || 0, // Add fallback for like_count
      isLiked: isLiked,
      tags: apiTopic.tags.map(tag => tag.name),
      createdAt: new Date(apiTopic.created_at),
      updatedAt: apiTopic.updated_at ? new Date(apiTopic.updated_at) : undefined,
      hasRecipe: apiTopic.has_recipe,
    };
  } catch (error) {
    console.error('Error checking liked posts storage in mapApiTopicToForumTopic:', error);
    // Fall back to default behavior if AsyncStorage fails
    const normalizedAuthor = normalizeAuthor(apiTopic.author);
    return {
      id: apiTopic.id,
      title: apiTopic.title,
      content: apiTopic.body,
      author: normalizedAuthor.username,
      authorId: normalizedAuthor.id || 0,
      authorProfileImage: normalizedAuthor.profileImage,
      authorDisplayName: normalizedAuthor.displayName,
      commentsCount: apiTopic.comments_count || 0,
      likesCount: apiTopic.like_count || 0,
      isLiked: apiTopic.is_liked || false,
      tags: apiTopic.tags.map(tag => tag.name),
      createdAt: new Date(apiTopic.created_at),
      updatedAt: apiTopic.updated_at ? new Date(apiTopic.updated_at) : undefined,
      hasRecipe: apiTopic.has_recipe,
    };
  }
};

// Utility function to add/remove post ID from liked posts in AsyncStorage
const updateLikedPostsStorage = async (postId: number, isLiked: boolean): Promise<void> => {
  try {
    const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    let likedPosts: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
    
    if (isLiked) {
      // Add post ID if not already in the list
      if (!likedPosts.includes(postId)) {
        likedPosts.push(postId);
      }
    } else {
      // Remove post ID from the list
      likedPosts = likedPosts.filter(id => id !== postId);
    }
    
    await AsyncStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPosts));
  } catch (error) {
    console.error('Error updating liked posts storage:', error);
  }
};

// Convert API response to our Comment type
const mapApiCommentToComment = (apiComment: ApiComment): Comment => {
  const normalizedAuthor = normalizeAuthor(apiComment.author);
  return {
    id: apiComment.id,
    postId: apiComment.post,
    content: apiComment.body,
    author: normalizedAuthor.username,
    authorId: normalizedAuthor.id || 0, // Fallback when ID is not provided
    authorProfileImage: normalizedAuthor.profileImage,
    authorDisplayName: normalizedAuthor.displayName,
    createdAt: new Date(apiComment.created_at),
    likesCount: apiComment.like_count || 0, // Add fallback
    isLiked: apiComment.is_liked || false, // Add fallback
  };
};

// Helper function to fetch comments count for a post
const fetchCommentsCount = async (postId: number): Promise<number> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiComment>>(`/forum/comments/?post=${postId}`);
    if (response.error) return 0;
    
    return response.data?.count || 0;
  } catch (err) {
    console.warn(`Error fetching comments count for post ${postId}:`, err);
    return 0;
  }
};

export const forumService = {
  // Get all forum posts
  async getPosts(tags?: number[]): Promise<ForumTopic[]> {
    let url = '/forum/posts/';
    if (tags && tags.length > 0) {
      const tagParams = tags.map(tag => `tags=${tag}`).join('&');
      url += `?${tagParams}`;
    }
    
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      console.log("Skipping forum request - no access token available");
      return [];
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>(url);
    if (response.error) {
      if (response.status === 401) {
        console.error("Authentication error in getPosts - token may be invalid");
        throw new Error("Authentication error - please login again");
      }
      throw new Error(response.error);
    }
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected API response format');
    }
    
    // Map posts with async operation for checking local storage
    const mappedPosts = await Promise.all(
      response.data.results.map(apiTopic => mapApiTopicToForumTopic(apiTopic))
    );
    
    // If the API doesn't provide comments_count, fetch them individually
    // (this can be resource-intensive for many posts)
    const postsNeedingCommentCount = mappedPosts.filter(post => post.commentsCount === 0);
    
    if (postsNeedingCommentCount.length > 0) {
      console.log(`Fetching comment counts for ${postsNeedingCommentCount.length} posts...`);
      
      // Fetch comments counts in parallel
      const commentCountPromises = postsNeedingCommentCount.map(post => 
        fetchCommentsCount(post.id).then(count => ({ postId: post.id, count }))
      );
      
      try {
        const commentCounts = await Promise.all(commentCountPromises);
        
        // Update posts with fetched comment counts
        commentCounts.forEach(({ postId, count }) => {
          const post = mappedPosts.find(p => p.id === postId);
          if (post) {
            post.commentsCount = count;
          }
        });
      } catch (err) {
        console.error('Error fetching comment counts:', err);
        // Continue with existing data if there's an error
      }
    }
    
    return mappedPosts;
  },

  // Get single post by ID
  async getPost(id: number): Promise<ForumTopic> {
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error("Cannot fetch post: User not logged in");
    }
    
    const response = await apiClient.get<ApiForumTopic>(`/forum/posts/${id}/`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Post not found');
    }
    
    // Map the post data
    const mappedPost = await mapApiTopicToForumTopic(response.data);
    
    // Fetch comments count if not included in API response
    if (mappedPost.commentsCount === 0) {
      mappedPost.commentsCount = await fetchCommentsCount(id);
    }
    
    return mappedPost;
  },

  // Create a new post
  async createPost(postData: CreatePostRequest): Promise<ForumTopic> {
    const response = await apiClient.post<ApiForumTopic>('/forum/posts/', postData);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to create post');
    }
    
    return await mapApiTopicToForumTopic(response.data);
  },

  // Create a new recipe
  async createRecipe(recipeData: CreateRecipeRequest): Promise<any> {
    const response = await apiClient.post<any>('/forum/recipes/', recipeData);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to create recipe');
    }
    
    return response.data;
  },

  // Get recipe by post ID (uses list endpoint with ?post= filter)
  async getRecipe(postId: number): Promise<RecipeDetail | null> {
    try {
      const response = await apiClient.get<any>(`/forum/recipes/?post=${postId}`);
      if (response.error) {
        console.error('Error fetching recipe:', response.error);
        return null;
      }

      const data = response.data;
      if (!data) return null;

      // DRF paginated response
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return data.results[0] as RecipeDetail;
      }

      // Direct object fallback
      if (data.id && data.ingredients) {
        return data as RecipeDetail;
      }

      return null;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  },

  // Update a post
  async updatePost(id: number, postData: Partial<CreatePostRequest>): Promise<ForumTopic> {
    const response = await apiClient.patch<ApiForumTopic>(`/forum/posts/${id}/`, postData);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to update post');
    }
    
    return await mapApiTopicToForumTopic(response.data);
  },

  // Get all available tags
  async getTags(): Promise<ApiTag[]> {
    try {
      const response = await apiClient.get<ApiTag[] | PaginatedResponse<ApiTag>>('/forum/tags/');
      
      if (response.error) {
        console.error('Error fetching tags:', response.error);
        throw new Error(response.error);
      }
      
      console.log('Raw tags response:', JSON.stringify(response.data));
      
      if (!response.data) {
        console.error('No data in tags response');
        return [];
      }
      
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.error('Unexpected tags response format:', response.data);
        return [];
      }
    } catch (err) {
      console.error('getTags error:', err);
      return []; // Return empty array instead of throwing
    }
  },

  // Toggle like on a post
  async toggleLike(postId: number): Promise<boolean> {
    const response = await apiClient.post<{ liked: boolean }>(`/forum/posts/${postId}/like/`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to toggle like');
    }
    
    // Store the like status in AsyncStorage
    await updateLikedPostsStorage(postId, response.data.liked);
    
    return response.data.liked;
  },

  // Toggle like on a comment
  async toggleCommentLike(commentId: number): Promise<boolean> {
    const response = await apiClient.post<{ liked: boolean }>(`/forum/comments/${commentId}/like/`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to toggle comment like');
    }
    
    return response.data.liked;
  },

  // Get comments for a post
  async getComments(postId: number): Promise<Comment[]> {
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      console.log("Skipping comments request - no access token available");
      return [];
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiComment>>(`/forum/comments/?post=${postId}`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected comment response format:', response.data);
      throw new Error('Unexpected API response format for comments');
    }
    
    return response.data.results.map(mapApiCommentToComment);
  },

  // Create a comment
  async createComment(commentData: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<ApiComment>('/forum/comments/', commentData);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to create comment');
    }
    
    return mapApiCommentToComment(response.data);
  },

  // Search posts
  async searchPosts(query: string): Promise<ForumTopic[]> {
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      console.log("Skipping search request - no access token available");
      return [];
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>(`/forum/posts/search/?q=${query}`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected search response format:', response.data);
      throw new Error('Unexpected API response format for search');
    }
    
    const mappedPosts = await Promise.all(
      response.data.results.map(apiTopic => mapApiTopicToForumTopic(apiTopic))
    );
    
    return mappedPosts;
  },

  /**
   * Get personalized feed of posts from followed users and liked posts
   * @returns Array of ForumTopic objects
   */
  async getFeed(): Promise<ForumTopic[]> {
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      console.log("Skipping feed request - no access token available");
      return [];
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>('/users/feed/');
    if (response.error) {
      if (response.status === 401) {
        console.error("Authentication error in getFeed - token may be invalid");
        throw new Error("Authentication error - please login again");
      }
      throw new Error(response.error);
    }
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected feed response format:', response.data);
      throw new Error('Unexpected API response format for feed');
    }
    
    const mappedPosts = await Promise.all(
      response.data.results.map(apiTopic => mapApiTopicToForumTopic(apiTopic))
    );
    
    return mappedPosts;
  },

  /**
   * Get posts that the current user has liked
   * @returns Array of ForumTopic objects
   */
  async getLikedPosts(): Promise<ForumTopic[]> {
    // Check for token before making the request
    const accessToken = await AsyncStorage.getItem('access_token');
    if (!accessToken) {
      console.log("Skipping liked posts request - no access token available");
      return [];
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>('/users/profile/liked-posts/');
    if (response.error) {
      if (response.status === 401) {
        console.error("Authentication error in getLikedPosts - token may be invalid");
        throw new Error("Authentication error - please login again");
      }
      throw new Error(response.error);
    }
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected liked posts response format:', response.data);
      return [];
    }
    
    // Map posts and ensure isLiked is true for all liked posts
    const mappedPosts = await Promise.all(
      response.data.results.map(async (apiTopic) => {
        const topic = await mapApiTopicToForumTopic(apiTopic);
        // Ensure isLiked is true since these are all liked posts
        topic.isLiked = true;
        return topic;
      })
    );
    
    return mappedPosts;
  }
};

/**
 * Forum service for interacting with the forum-related API endpoints
 */

import { apiClient } from './client';
import { ForumTopic, Comment, PostTagType } from '../../types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API response interface for paginated results
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API response interfaces matching backend structure
export interface ApiForumTopic {
  id: number;
  title: string;
  body: string;
  author: string;
  tags: Array<{
    id: number;
    name: string;
  }>;
  like_count: number;
  comments_count?: number; // Some endpoints might include this
  is_liked?: boolean;      // Some endpoints might include this
  created_at: string;
  updated_at: string;
}

export interface ApiComment {
  id: number;
  post: number;
  body: string;
  author: string;
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

// Convert API response to our ForumTopic type
const mapApiTopicToForumTopic = (apiTopic: ApiForumTopic): ForumTopic => {
  return {
    id: apiTopic.id,
    title: apiTopic.title,
    content: apiTopic.body,
    author: apiTopic.author,
    authorId: 0, // Not provided in API
    commentsCount: apiTopic.comments_count || 0, // Use API value if available
    likesCount: apiTopic.like_count || 0, // Add fallback for like_count
    isLiked: apiTopic.is_liked || false, // Add fallback for is_liked
    tags: apiTopic.tags.map(tag => tag.name),
    createdAt: new Date(apiTopic.created_at),
    updatedAt: apiTopic.updated_at ? new Date(apiTopic.updated_at) : undefined,
  };
};

// Convert API response to our Comment type
const mapApiCommentToComment = (apiComment: ApiComment): Comment => {
  return {
    id: apiComment.id,
    postId: apiComment.post,
    content: apiComment.body,
    author: apiComment.author,
    authorId: 0, // Not provided in API
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
    
    // Map posts and enrich with comments count if needed
    const mappedPosts = response.data.results.map(mapApiTopicToForumTopic);
    
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
    const mappedPost = mapApiTopicToForumTopic(response.data);
    
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
    
    return mapApiTopicToForumTopic(response.data);
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

  // Update a post
  async updatePost(id: number, postData: Partial<CreatePostRequest>): Promise<ForumTopic> {
    const response = await apiClient.patch<ApiForumTopic>(`/forum/posts/${id}/`, postData);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Failed to update post');
    }
    
    return mapApiTopicToForumTopic(response.data);
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
    
    return response.data.results.map(mapApiTopicToForumTopic);
  }
};
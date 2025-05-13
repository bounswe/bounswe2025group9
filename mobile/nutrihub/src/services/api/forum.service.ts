import { apiClient } from './client';
import { ForumTopic, Comment, PostTagType } from '../../types/types';

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
  created_at: string;
  updated_at: string;
}

export interface ApiComment {
  id: number;
  post: number;
  body: string;
  author: string;
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

// Convert API response to our ForumTopic type
const mapApiTopicToForumTopic = (apiTopic: ApiForumTopic): ForumTopic => {
  return {
    id: apiTopic.id,
    title: apiTopic.title,
    content: apiTopic.body,
    author: apiTopic.author,
    authorId: 0, // Not provided in API
    commentsCount: 0, // We'll need to fetch separately 
    likesCount: apiTopic.like_count,
    isLiked: false, // Not provided in basic API response
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
    likesCount: 0, // Not provided in API
    isLiked: false, // Not provided in API
  };
};

export const forumService = {
  // Get all forum posts
  async getPosts(tags?: number[]): Promise<ForumTopic[]> {
    let url = '/forum/posts/';
    if (tags && tags.length > 0) {
      const tagParams = tags.map(tag => `tags=${tag}`).join('&');
      url += `?${tagParams}`;
    }
    
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>(url);
    if (response.error) throw new Error(response.error);
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected API response format');
    }
    
    return response.data.results.map(mapApiTopicToForumTopic);
  },

  // Get single post by ID
  async getPost(id: number): Promise<ForumTopic> {
    const response = await apiClient.get<ApiForumTopic>(`/forum/posts/${id}/`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data) {
      throw new Error('Post not found');
    }
    
    // Fetch comments count for this post
    let commentsCount = 0;
    try {
      const commentsResponse = await apiClient.get<PaginatedResponse<ApiComment>>(`/forum/comments/?post=${id}`);
      if (commentsResponse.data && commentsResponse.data.count) {
        commentsCount = commentsResponse.data.count;
      }
    } catch (err) {
      console.warn('Could not fetch comments count:', err);
    }
    
    const mappedPost = mapApiTopicToForumTopic(response.data);
    return {
      ...mappedPost,
      commentsCount
    };
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

  // Get comments for a post
  async getComments(postId: number): Promise<Comment[]> {
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
    const response = await apiClient.get<PaginatedResponse<ApiForumTopic>>(`/forum/posts/search/?q=${query}`);
    if (response.error) throw new Error(response.error);
    
    if (!response.data || !response.data.results) {
      console.error('Unexpected search response format:', response.data);
      throw new Error('Unexpected API response format for search');
    }
    
    return response.data.results.map(mapApiTopicToForumTopic);
  }
};
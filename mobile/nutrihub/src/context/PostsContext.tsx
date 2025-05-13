/**
 * PostsContext
 * 
 * Global context for managing forum posts
 * Integrated with backend API
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ForumTopic } from '../types/types';
import { forumService } from '../services/api/forum.service';

interface PostsContextType {
  posts: ForumTopic[];
  setPosts: React.Dispatch<React.SetStateAction<ForumTopic[]>>;
  addPost: (post: ForumTopic) => void;
  updatePost: (updatedPost: ForumTopic) => void;
  getPostById: (id: number) => ForumTopic | undefined;
  fetchPosts: () => Promise<ForumTopic[]>;
  fetchPostById: (id: number) => Promise<ForumTopic>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<ForumTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial posts when the context loads
  useEffect(() => {
    fetchPosts();
  }, []);

  // Add a new post to the state
  const addPost = (post: ForumTopic) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  // Update an existing post
  const updatePost = (updatedPost: ForumTopic) => {
    setPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  // Get a post by its ID from the current state
  const getPostById = (id: number): ForumTopic | undefined => {
    return posts.find(post => post.id === id);
  };

  // Fetch all posts from the API
  const fetchPosts = async (tagIds?: number[]): Promise<ForumTopic[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedPosts = await forumService.getPosts(tagIds);
      setPosts(fetchedPosts);
      return fetchedPosts;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch posts';
      console.error('Error in fetchPosts:', errorMsg);
      setError(errorMsg);
      return []; // Return empty array instead of throwing
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a specific post by ID
  const fetchPostById = async (id: number): Promise<ForumTopic> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const post = await forumService.getPost(id);
      // Update the post in our state if it exists
      updatePost(post);
      return post;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to fetch post #${id}`;
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: PostsContextType = {
    posts,
    setPosts,
    addPost,
    updatePost,
    getPostById,
    fetchPosts,
    fetchPostById,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};

export const usePosts = (): PostsContextType => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};
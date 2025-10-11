/**
 * PostsContext
 * 
 * Global context for managing forum posts
 * Integrated with backend API
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { ForumTopic } from '../types/types';
import { forumService } from '../services/api/forum.service';
import { useAuth } from '../context/AuthContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for liked posts - must match the one in forum.service.ts
const LIKED_POSTS_STORAGE_KEY = 'nutrihub_liked_posts';

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
  const { isLoggedIn } = useAuth(); // Get authentication state

  // Only fetch posts when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("User is logged in, fetching initial posts");
      fetchPosts().catch(err => {
        console.error("Error fetching initial posts:", err);
      });
    }
  }, [isLoggedIn]); // Depend on isLoggedIn state

  // Add a new post to the state
  const addPost = (post: ForumTopic) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  // Update an existing post
  const updatePost = (updatedPost: ForumTopic) => {
    setPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
    
    // When a post is liked or unliked, update AsyncStorage
    if (updatedPost.isLiked !== undefined) {
      updateLikedPostsStorage(updatedPost.id, updatedPost.isLiked);
    }
  };
  
  // Helper function to update liked posts in AsyncStorage
  const updateLikedPostsStorage = async (postId: number, isLiked: boolean) => {
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
      console.error('Error updating liked posts in storage:', error);
    }
  };
  
  // Merge posts with liked status from AsyncStorage
  const mergePostsWithLikedStatus = async (fetchedPosts: ForumTopic[]): Promise<ForumTopic[]> => {
    try {
      const likedPostsString = await AsyncStorage.getItem(LIKED_POSTS_STORAGE_KEY);
      const likedPostIds: number[] = likedPostsString ? JSON.parse(likedPostsString) : [];
      
      return fetchedPosts.map(post => {
        const isLocallyLiked = likedPostIds.includes(post.id);
        if (isLocallyLiked) {
          return {
            ...post,
            isLiked: true,
            // Keep the higher like count
            likesCount: Math.max(post.likesCount, post.isLiked ? post.likesCount : post.likesCount + 1)
          };
        }
        return post;
      });
    } catch (error) {
      console.error('Error merging posts with liked status:', error);
      return fetchedPosts;
    }
  };

  // Get a post by its ID from the current state
  const getPostById = (id: number): ForumTopic | undefined => {
    return posts.find(post => post.id === id);
  };

  // Fetch all posts from the API
  const fetchPosts = async (tagIds?: number[]): Promise<ForumTopic[]> => {
    // Only proceed if user is logged in
    if (!isLoggedIn) {
      console.log("Skipping fetchPosts because user is not logged in");
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedPosts = await forumService.getPosts(tagIds);
      
      // Merge with liked status from AsyncStorage
      const mergedPosts = await mergePostsWithLikedStatus(fetchedPosts);
      setPosts(mergedPosts);
      
      return mergedPosts;
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
    // Only proceed if user is logged in
    if (!isLoggedIn) {
      throw new Error("Cannot fetch post: User not logged in");
    }
    
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
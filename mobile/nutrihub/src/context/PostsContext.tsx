/**
 * PostsContext
 * 
 * Global context for managing forum posts
 * Ready for API integration
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ForumTopic } from '../types/types';

interface PostsContextType {
  posts: ForumTopic[];
  setPosts: React.Dispatch<React.SetStateAction<ForumTopic[]>>;
  addPost: (post: ForumTopic) => void;
  updatePost: (updatedPost: ForumTopic) => void;
  getPostById: (id: number) => ForumTopic | undefined;
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

  const addPost = (post: ForumTopic) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  const updatePost = (updatedPost: ForumTopic) => {
    setPosts(prevPosts => 
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  const getPostById = (id: number): ForumTopic | undefined => {
    return posts.find(post => post.id === id);
  };

  const value: PostsContextType = {
    posts,
    setPosts,
    addPost,
    updatePost,
    getPostById,
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
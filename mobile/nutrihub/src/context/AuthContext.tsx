/**
 * Authentication Context
 * 
 * Provides authentication state and functions to the app.
 * This context manages user login, logout, registration, and authentication state.
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/types';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
};

// Auth error types for error handling
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  NETWORK_ERROR = 'network_error',
  USER_EXISTS = 'user_exists',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// Authentication error with type
export interface AuthError {
  type: AuthErrorType;
  message: string;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

// Authentication context interface
interface AuthContextType {
  /**
   * Current authenticated user, or null if not logged in
   */
  user: User | null;
  
  /**
   * Whether the user is logged in
   */
  isLoggedIn: boolean;
  
  /**
   * Whether authentication is in a loading state
   */
  isLoading: boolean;
  
  /**
   * Current authentication error, if any
   */
  error: AuthError | null;
  
  /**
   * Log in with email and password
   */
  login: (credentials: LoginCredentials) => Promise<void>;
  
  /**
   * Register a new user
   */
  register: (data: RegistrationData) => Promise<void>;
  
  /**
   * Log out the current user
   */
  logout: () => Promise<void>;
  
  /**
   * Reset authentication error
   */
  clearError: () => void;
  
  /**
   * Check if a user is authenticated (validate token)
   */
  checkAuth: () => Promise<boolean>;
}

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for development (to be replaced with actual API)
const MOCK_USER: User = {
  id: 1,
  username: 'demouser',
  email: 'demo@example.com',
  fullName: 'Demo User',
  createdAt: new Date(),
};

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  /**
   * Check if user is authenticated based on stored token
   */
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Get stored token and user data
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        // Parse user data
        const parsedUser = JSON.parse(userData) as User;
        setUser(parsedUser);
        setIsLoggedIn(true);
        return true;
      } else {
        setUser(null);
        setIsLoggedIn(false);
        return false;
      }
    } catch (err) {
      console.error('Failed to check authentication status:', err);
      setUser(null);
      setIsLoggedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Log in with email and password
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw {
          type: AuthErrorType.VALIDATION_ERROR,
          message: 'Email and password are required',
        };
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email/password combo that passes validation
      // In a real app, this would make an API call to authenticate
      
      // Store token and user data
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(MOCK_USER));
      
      // Update state
      setUser(MOCK_USER);
      setIsLoggedIn(true);
    } catch (err) {
      const authError = err as AuthError;
      
      if (authError.type) {
        setError(authError);
      } else {
        setError({
          type: AuthErrorType.UNKNOWN_ERROR,
          message: 'An unexpected error occurred during login',
        });
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Register a new user
   */
  const register = async (data: RegistrationData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate input
      if (!data.email || !data.username || !data.password) {
        throw {
          type: AuthErrorType.VALIDATION_ERROR,
          message: 'Email, username, and password are required',
        };
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, always succeed
      // In a real app, this would make an API call to register
      
      // Create user object
      const newUser: User = {
        id: 1,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        createdAt: new Date(),
      };
      
      // Store token and user data
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUser));
      
      // Update state
      setUser(newUser);
      setIsLoggedIn(true);
    } catch (err) {
      const authError = err as AuthError;
      
      if (authError.type) {
        setError(authError);
      } else {
        setError({
          type: AuthErrorType.UNKNOWN_ERROR,
          message: 'An unexpected error occurred during registration',
        });
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Log out the current user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Remove stored token and user data
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Update state
      setUser(null);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clear authentication error
   */
  const clearError = (): void => {
    setError(null);
  };
  
  // Create context value
  const value: AuthContextType = {
    user,
    isLoggedIn,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuth,
  };
  
  // Provide context value to children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
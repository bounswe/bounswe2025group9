/**
 * Authentication Context
 * 
 * Provides authentication state and functions to the app.
 * Integrated with backend API using axios.
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types/types';
import { authService, LoginCredentials, RegistrationData } from '../services/api/auth.service';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
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

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (accessToken) {
        // Get user profile with the token
        const userProfile = await authService.getUserProfile();
        setUser(userProfile);
        setIsLoggedIn(true);
        return true;
      } else {
        setUser(null);
        setIsLoggedIn(false);
        return false;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token invalid, clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      setUser(null);
      setIsLoggedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Log in with username and password
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get tokens
      const tokens = await authService.login(credentials);
      
      // Store tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
      
      // Get user profile
      const userProfile = await authService.getUserProfile();
      
      // Store user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userProfile));
      
      // Update state
      setUser(userProfile);
      setIsLoggedIn(true);
    } catch (err) {
      const error = err as Error;
      let authError: AuthError;
      
      if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        authError = {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid username or password',
        };
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        authError = {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'Network error occurred. Please check your connection.',
        };
      } else {
        authError = {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: error.message || 'An unexpected error occurred',
        };
      }
      
      setError(authError);
      throw authError;
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
      // Register user
      const userProfile = await authService.register(data);
      
      // After successful registration, login with the same credentials
      const tokens = await authService.login({
        username: data.username,
        password: data.password,
      });
      
      // Store tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userProfile));
      
      // Update state
      setUser(userProfile);
      setIsLoggedIn(true);
    } catch (err) {
      const error = err as Error;
      let authError: AuthError;
      
      if (error.message.includes('409') || error.message.includes('already exists')) {
        authError = {
          type: AuthErrorType.USER_EXISTS,
          message: 'User with this email or username already exists',
        };
      } else if (error.message.includes('validation') || error.message.includes('400')) {
        authError = {
          type: AuthErrorType.VALIDATION_ERROR,
          message: error.message,
        };
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        authError = {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'Network error occurred. Please check your connection.',
        };
      } else {
        authError = {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: error.message || 'An unexpected error occurred',
        };
      }
      
      setError(authError);
      throw authError;
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
      // Get refresh token for logout
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (refreshToken) {
        // Call logout endpoint
        await authService.logout(refreshToken);
      }
    } catch (err) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', err);
    } finally {
      // Always clear local storage
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      // Update state
      setUser(null);
      setIsLoggedIn(false);
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
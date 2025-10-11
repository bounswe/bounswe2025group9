import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth, AuthErrorType } from '../src/context/AuthContext';
import { authService } from '../src/services/api/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock auth service
jest.mock('../src/services/api/auth.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getUserProfile: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Wrapper component for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('login', () => {
    it('should login successfully and update state', async () => {
      // Mock successful login response
      const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
      const mockUserProfile = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      (authService.login as jest.Mock).mockResolvedValueOnce(mockTokens);
      (authService.getUserProfile as jest.Mock).mockResolvedValueOnce(mockUserProfile);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.login({ username: 'testuser', password: 'password123' });
      });
      
      // Check if login method was called with correct credentials
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      
      // Check if tokens were stored
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      
      // Check if user profile was fetched and stored
      expect(authService.getUserProfile).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockUserProfile)
      );
      
      // Check if state was updated
      expect(result.current.user).toEqual(mockUserProfile);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('should handle login failure', async () => {
      // Mock login failure
      (authService.login as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid username or password')
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Attempt to login
      await act(async () => {
        try {
          await result.current.login({ username: 'testuser', password: 'wrongpassword' });
        } catch (error) {
          // Expected to throw
        }
      });
      
      // Check that error state is set correctly
      expect(result.current.error).toEqual({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Invalid username or password. Please try again.',
      });
      
      // Check that user remains logged out
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear auth state and storage on logout', async () => {
      // Mock the initial logged in state
      const mockUserProfile = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Manually set up the initial state for testing
      act(() => {
        // @ts-ignore - directly setting the state for testing
        result.current.user = mockUserProfile;
        // @ts-ignore
        result.current.isLoggedIn = true;
      });
      
      // Mock getting the refresh token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('refresh-token');
      (authService.logout as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Check if logout API was called with refresh token
      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
      
      // Check if storage was cleared
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
      
      // Check if state was updated
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });
    
    it('should still clear state even if API call fails', async () => {
      // Setup initial logged in state with a refresh token
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Set initial state
      act(() => {
        // @ts-ignore - directly setting the state for testing
        result.current.user = { id: 1, username: 'testuser' };
        // @ts-ignore
        result.current.isLoggedIn = true;
      });
      
      // Mock getting the refresh token and API failure
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('refresh-token');
      (authService.logout as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Logout
      await act(async () => {
        await result.current.logout();
      });
      
      // Should still clear storage and reset state even if API call fails
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
      
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should restore authenticated state if token exists', async () => {
      // Mock token exists
      const mockUserProfile = { id: 1, username: 'testuser', email: 'test@example.com' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('access-token'); // For token check
      (authService.getUserProfile as jest.Mock).mockResolvedValueOnce(mockUserProfile);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Should check auth on mount
      await act(async () => {
        // Manually trigger checkAuth
        await result.current.checkAuth();
      });
      
      // Should fetch user profile with token
      expect(authService.getUserProfile).toHaveBeenCalled();
      
      // Should update state with authenticated user
      expect(result.current.user).toEqual(mockUserProfile);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should remain logged out if no token exists', async () => {
      // Mock no token exists
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Should check auth on mount
      await act(async () => {
        await result.current.checkAuth();
      });
      
      // Should not fetch user profile
      expect(authService.getUserProfile).not.toHaveBeenCalled();
      
      // Should confirm logged out state
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should clear tokens if auth check fails', async () => {
      // Mock token exists but is invalid
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid-token');
      (authService.getUserProfile as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token')
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Should check auth on mount
      await act(async () => {
        await result.current.checkAuth();
      });
      
      // Should clear tokens if invalid
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
      
      // Should confirm logged out state
      expect(result.current.user).toBeNull();
      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Set an error
      act(() => {
        // @ts-ignore - directly setting the state for testing
        result.current.error = {
          type: AuthErrorType.NETWORK_ERROR,
          message: 'Network error occurred',
        };
      });
      
      // Clear error
      await act(async () => {
        result.current.clearError();
      });
      
      // Error should be cleared - wait for the next update cycle
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});

// Helper function for more robust testing with async act
const waitFor = async (callback: () => boolean | void, timeout = 1000, interval = 50) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = callback();
      if (result !== false) return;
    } catch (error) {
      // Ignore errors, keep waiting
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Last attempt, let errors propagate
  callback();
}; 
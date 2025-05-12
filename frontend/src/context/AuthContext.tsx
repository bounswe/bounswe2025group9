import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiClient, setAccessToken, UserResponse } from '../lib/apiClient';

// auth context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  isLoading: boolean;
  user: UserResponse | null;
  fetchUserProfile: () => Promise<void>;
}

// local storage keys
const ACCESS_TOKEN_KEY = 'nh_access_token';
const REFRESH_TOKEN_KEY = 'nh_refresh_token';

// create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // state for auth status and loading
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // user state to store profile info
  const [user, setUser] = useState<UserResponse | null>(null);
  
  // tokens stored in memory and localStorage
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [, setRefreshToken] = useState<string | null>(null);
  
  // check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      // try to get stored tokens
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (storedAccessToken) {
        // restore tokens
        setAccessTokenState(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
        
        // fetch user profile with the restored token
        try {
          const userProfile = await apiClient.getUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to fetch user profile with stored token:', error);
          // if profile fetch fails, clear auth state
          logout();
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);
  
  // fetch user profile
  const fetchUserProfile = async () => {
    if (!isAuthenticated || !accessToken) {
      console.log('Cannot fetch profile: not authenticated or no token');
      return;
    }
    
    console.log('Fetching user profile...');
    try {
      // Verify the API client can be accessed
      if (!apiClient?.getUserProfile) {
        console.error('API client or getUserProfile method is not available!');
        return;
      }
      
      const userProfile = await apiClient.getUserProfile();
      console.log('User profile fetched successfully:', userProfile);
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // if profile fetch fails, consider the user is not authenticated
      logout();
    }
  };
  
  // login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // call api login function
      const res = await apiClient.login(username, password);
      console.log('Login successful, token received:', res.access.substring(0, 10) + '...');
      
      // First set the access token in the apiClient so it's available for immediate API calls
      setAccessToken(res.access);
      
      // store tokens in memory
      setAccessTokenState(res.access);
      setRefreshToken(res.refresh);
      
      // store tokens in localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, res.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh);
      
      // update auth status
      setIsAuthenticated(true);
      
      // Add a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now fetch the user profile
      try {
        // Fetch profile directly with the received token
        console.log('Fetching profile with fresh token...');
        const userProfile = await apiClient.getUserProfile();
        console.log('User profile fetched during login:', userProfile);
        setUser(userProfile);
      } catch (profileError) {
        console.error('Error fetching profile during login:', profileError);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      // handle login error
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  // logout function
  const logout = () => {
    // clear tokens from memory
    setAccessTokenState(null);
    setRefreshToken(null);
    
    // clear tokens from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // clear the access token in the apiClient
    setAccessToken(null);
    
    // clear user profile
    setUser(null);
    
    // update auth status
    setIsAuthenticated(false);
  };
  
  // get access token for api calls
  const getAccessToken = () => {
    return accessToken;
  };

  // context value
  const value = {
    isAuthenticated,
    login,
    logout,
    getAccessToken,
    isLoading,
    user,
    fetchUserProfile
  };
  
  // provide context to children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 

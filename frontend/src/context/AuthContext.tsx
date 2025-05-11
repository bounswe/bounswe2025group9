import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiClient, JwtResponse, setAccessToken } from '../lib/apiClient';

// auth context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
  isLoading: boolean;
}

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
  
  // tokens stored in memory only, not persisted
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  
  // check auth status on mount
  useEffect(() => {
    // since we're not persisting tokens, just set loading to false
    setIsLoading(false);
  }, []);
  
  // login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // call api login function
      const res = await apiClient.login(username, password);
      
      // store tokens in memory
      setAccessTokenState(res.access);
      setRefreshToken(res.refresh);
      
      // set the access token in the apiClient
      setAccessToken(res.access);
      
      // update auth status
      setIsAuthenticated(true);
    } catch (error) {
      // handle login error
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // logout function
  const logout = () => {
    // clear tokens
    setAccessTokenState(null);
    setRefreshToken(null);
    
    // clear the access token in the apiClient
    setAccessToken(null);
    
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
    isLoading
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
/**
 * ThemeContext
 * 
 * Provides theme-related functionality throughout the app,
 * including theme switching and access to theme properties.
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeType, getTheme, createTextStyles, LIGHT_THEME, DARK_THEME } from '../constants/theme';

// Storage key for theme preference
const THEME_STORAGE_KEY = 'userTheme';

/**
 * Theme context type definition
 */
interface ThemeContextType {
  /**
   * Current theme type ('dark' or 'light')
   */
  themeType: ThemeType;
  
  /**
   * Theme values for the current theme
   */
  theme: Theme;
  
  /**
   * Text styles with appropriate theme colors
   */
  textStyles: ReturnType<typeof createTextStyles>;
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => Promise<void>;
  
  /**
   * Explicitly set theme type
   */
  setThemeType: (type: ThemeType) => Promise<void>;
  
  /**
   * Whether the theme is still loading
   */
  isLoading: boolean;
}

// Create context with undefined initial value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider component
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [themeType, setThemeTypeState] = useState<ThemeType>('dark');
  const [theme, setTheme] = useState<Theme>(DARK_THEME);
  const [textStyles, setTextStyles] = useState<ReturnType<typeof createTextStyles>>(createTextStyles(DARK_THEME));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load saved theme preference on app load
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const themeToSet: ThemeType = savedTheme === 'light' ? 'light' : 'dark';
        
        // Update all theme-related state
        updateTheme(themeToSet);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);
  
  /**
   * Update theme and related styles
   */
  const updateTheme = (newThemeType: ThemeType) => {
    const newTheme = getTheme(newThemeType);
    
    setThemeTypeState(newThemeType);
    setTheme(newTheme);
    setTextStyles(createTextStyles(newTheme));
  };
  
  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = async () => {
    try {
      const newThemeType = themeType === 'dark' ? 'light' : 'dark';
      
      // Update theme state
      updateTheme(newThemeType);
      
      // Save theme preference
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeType);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  /**
   * Explicitly set theme type
   */
  const setThemeType = async (newThemeType: ThemeType) => {
    try {
      // Update theme state
      updateTheme(newThemeType);
      
      // Save theme preference
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeType);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  // Create context value
  const value: ThemeContextType = {
    themeType,
    theme,
    textStyles,
    toggleTheme,
    setThemeType,
    isLoading,
  };
  
  // Provide context value to children
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to use the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
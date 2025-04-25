import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme, getThemeColors } from '../constants/theme';

type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  colors: ColorTheme;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [colors, setColors] = useState<ColorTheme>(getThemeColors('dark'));

  // Check saved theme on app load
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        const themeToSet = savedTheme === 'light' ? 'light' : 'dark';
        setTheme(themeToSet);
        setColors(getThemeColors(themeToSet));
      } catch (e) {
        console.log('Failed to load theme preference');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      setColors(getThemeColors(newTheme));
      await AsyncStorage.setItem('userTheme', newTheme);
    } catch (e) {
      console.log('Failed to save theme preference');
    }
  };

  const value = {
    theme,
    colors,
    toggleTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
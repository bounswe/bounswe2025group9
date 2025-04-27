import { TextStyle, ViewStyle } from 'react-native';

export type ThemeType = 'dark' | 'light';

// Define the structure of our color theme
export interface ColorTheme {
  background: string;
  card: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  placeholder: string;
  buttonSecondary: string;
  buttonSecondaryText: string;

  headerBackground: string;
  headerText: string;
  tabBarColor: string;
}

// Dark theme colors
export const darkColors: ColorTheme = {
  background: '#121212',
  card: '#282828',
  accent: '#007AFF',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#3A3A3A',
  placeholder: '#3A3A3A',
  buttonSecondary: '#3A3A3A',
  buttonSecondaryText: '#B0B0B0',

  headerBackground: '#000000', // Match background
  headerText: '#FFFFFF',
  tabBarColor: '#000000'
};

// Light theme colors 
export const lightColors: ColorTheme = {
  background: '#FEFCE8', // Light amber background 
  card: '#FFFFFF',
  accent: '#000000', // 
  text: '#1E293B', // Slate-800 
  textSecondary: '#334155', // Slate-700 
  border: 'rgba(0, 0, 0, 0.05)',
  placeholder: '#FEF3C7', // amber-200 
  buttonSecondary: '#FEF3C7', // amber-200 
  buttonSecondaryText: '#78350F', // amber-900 

  headerBackground: '#0B7A5C', // Green color
  headerText: '#FFFFFF',
  tabBarColor: '#0B7A5C'
};

// Function to get theme colors
export const getThemeColors = (theme: ThemeType): ColorTheme => {
  return theme === 'light' ? lightColors : darkColors;
};

// Spacing scale (in density-independent pixels)
export const SPACING: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font style factory to create styles with the correct theme colors
export const createFontStyles = (colors: ColorTheme) => ({
  heading: {
    fontSize: 28,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    color: colors.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
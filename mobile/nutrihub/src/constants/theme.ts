import { TextStyle, ViewStyle } from 'react-native';

// Color palette for the app
export const COLORS: Record<string, string> = {
  background: '#121212',
  darkCard: '#282828',
  accent: '#007AFF',
  white: '#FFFFFF',
  lightGray: '#B0B0B0',
  darkGray: '#3A3A3A',
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

// Font style definitions, explicitly typed as TextStyle
export const FONTS: {
  heading: TextStyle;
  subheading: TextStyle;
  body: TextStyle;
  caption: TextStyle;
} = {
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  body: {
    fontSize: 16,
    color: COLORS.lightGray,
  },
  caption: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
};

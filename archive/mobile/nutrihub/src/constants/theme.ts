/**
 * Design system for the NutriHub application
 * 
 * This file contains all theme-related constants including colors, 
 * typography, spacing, and other design tokens.
 */
import { TextStyle, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * The available theme types
 */
export type ThemeType = 'dark' | 'light';

/**
 * Helper function to ensure valid icon names for MaterialCommunityIcons
 * Returns a validated icon name that is guaranteed to work with the icon component
 * Falls back to a default icon if the provided name is invalid
 */
export const getValidIconName = (
  name: string | undefined
): keyof typeof MaterialCommunityIcons.glyphMap => {
  // Default icon if none provided
  if (!name) return 'help-circle';
  
  // Check if the icon name exists in the glyphMap
  if (name in MaterialCommunityIcons.glyphMap) {
    return name as keyof typeof MaterialCommunityIcons.glyphMap;
  }
  
  // Return a fallback icon if the requested one doesn't exist
  return 'help-circle';
};

/**
 * Base palette - Raw color values
 * These are the foundational colors used throughout the app
 */
export const PALETTE = {
  // Core brand colors
  PRIMARY: {
    DEFAULT: '#3b82f6', // Main brand blue (matching frontend --color-primary)
    LIGHT: '#dbeafe', // Lighter blue (matching frontend --color-primary-light)
    DARK: '#2563eb', // Darker blue (matching frontend --color-primary-hover)
    CONTRAST: '#FFFFFF', // Text on primary color
  },
  
  // Secondary/accent colors
  ACCENT: {
    DEFAULT: '#3B82F6', // Blue accent (matching frontend --color-primary)
    LIGHT: '#60A5FA',
    DARK: '#2563EB',
    CONTRAST: '#FFFFFF', // Text on accent color
  },
  
  // Neutral/grayscale colors for text, backgrounds, etc.
  NEUTRAL: {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_50: '#f9fafb', // Matching frontend --color-gray-50
    GRAY_100: '#F3F4F6', // Matching frontend --color-gray-100
    GRAY_200: '#E5E7EB', // Matching frontend --color-gray-200
    GRAY_300: '#D1D5DB', // Matching frontend --color-gray-300
    GRAY_400: '#9CA3AF', // Matching frontend --color-gray-400
    GRAY_500: '#6B7280', // Matching frontend --color-gray-500
    GRAY_600: '#4B5563', // Matching frontend --color-gray-600
    GRAY_700: '#374151', // Matching frontend --color-gray-700
    GRAY_800: '#1F2937', // Matching frontend --color-gray-800
    GRAY_900: '#111827', // Matching frontend --color-gray-900
  },
  
  // Semantic colors for feedback/state
  SUCCESS: {
    DEFAULT: '#059669', // Matching frontend --color-success (dark theme)
    LIGHT: '#D1FAE5',
    DARK: '#065F46',
    CONTRAST: '#FFFFFF',
  },
  WARNING: {
    DEFAULT: '#d97706', // Matching frontend --color-warning (dark theme)
    LIGHT: '#FEF3C7',
    DARK: '#B45309',
    CONTRAST: '#000000', // Black text on warning
  },
  ERROR: {
    DEFAULT: '#dc2626', // Matching frontend --color-error (dark theme)
    LIGHT: '#FEE2E2',
    DARK: '#B91C1C',
    CONTRAST: '#FFFFFF',
  },
  INFO: {
    DEFAULT: '#0284c7', // Matching frontend --color-info (dark theme)
    LIGHT: '#DBEAFE',
    DARK: '#1D4ED8',
    CONTRAST: '#FFFFFF',
  },
  
  // Special purpose colors
  AMBER: {
    DEFAULT: '#FEF3C7', // Light amber background
    LIGHT: '#FFFBEB',
    DARK: '#78350F',
    CONTRAST: '#78350F', // Dark text on amber
  },
  
  // Dark mode specific
  DARK: {
    BACKGROUND: '#090909', // Matching frontend --color-bg-primary (dark)
    SURFACE: '#121212', // Matching frontend --color-bg-secondary (dark)
    SURFACE_ELEVATED: '#1a1a1a', // Matching frontend --color-bg-tertiary (dark)
    BORDER: '#333333',
    TEXT: '#e5e7eb', // Matching frontend --color-light (dark)
    TEXT_SECONDARY: '#d1d5db', // Matching frontend --color-light-hover (dark)
    TEXT_DISABLED: '#9CA3AF', // NEUTRAL.GRAY_400
    DIVIDER: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Light mode specific
  LIGHT: {
    BACKGROUND: '#fffbeb', // Matching frontend --color-bg-primary (light)
    SURFACE: '#fffdf7', // Matching frontend --color-bg-secondary (light)
    SURFACE_VARIANT: '#fef9c3', // Matching frontend --color-bg-tertiary (light)
    BORDER: 'rgba(0, 0, 0, 0.1)',
    TEXT: '#111827', // Matching frontend --color-light (light)
    TEXT_SECONDARY: '#1f2937', // Matching frontend --color-light-hover (light)
    TEXT_DISABLED: '#9CA3AF', // NEUTRAL.GRAY_400
    DIVIDER: 'rgba(0, 0, 0, 0.15)',
    HEADER: '#0d7c5f', // Green color for header/footer (matching frontend --color-dark)
    HEADER_HOVER: '#065f46', // Green hover color (matching frontend --color-dark-hover)
  },

  // Component specific colors
  COMPONENT: {
    TAB_BAR_ACTIVE_DARK: '#3B82F6', // ACCENT.DEFAULT
    TAB_BAR_INACTIVE_DARK: '#E5E7EB', // NEUTRAL.GRAY_300
    TAB_BAR_ACTIVE_LIGHT: '#FFFFFF', // NEUTRAL.WHITE
    TAB_BAR_INACTIVE_LIGHT: 'rgba(255, 255, 255, 0.85)',
    CARD_BACKGROUND_DARK: '#2C2C2C', // DARK.SURFACE_ELEVATED
    CARD_BACKGROUND_LIGHT: '#FFFFFF', // NEUTRAL.WHITE
    BADGE_BACKGROUND_DARK: 'rgba(59, 130, 246, 0.2)', // ACCENT tint
    BADGE_BACKGROUND_LIGHT: 'rgba(11, 122, 92, 0.1)', // PRIMARY tint
    BADGE_TEXT_DARK: '#60A5FA', // ACCENT.LIGHT
    BADGE_TEXT_LIGHT: '#0B7A5C', // PRIMARY.DEFAULT
    SORT_OPTION_ACTIVE_BG_DARK: '#3B82F6', // ACCENT.DEFAULT
    SORT_OPTION_INACTIVE_BG_DARK: 'rgba(255, 255, 255, 0.1)',
    SORT_OPTION_ACTIVE_BG_LIGHT: '#3B82F6', // ACCENT.DEFAULT
    SORT_OPTION_INACTIVE_BG_LIGHT: 'rgba(0, 0, 0, 0.05)',
    ERROR_CONTAINER_BG: 'rgba(239, 68, 68, 0.1)', // ERROR.DEFAULT at 10% opacity
  },
};

/**
 * Theme interface - Defines the structure of our theme
 */
export interface Theme {
  // Base surfaces
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // Interactive elements
  primary: string;
  primaryVariant: string;
  secondary: string;
  secondaryText: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  
  // Borders and dividers
  border: string;
  divider: string;
  
  // Status/feedback colors
  success: string;
  successContrast: string;
  warning: string;
  warningContrast: string;
  error: string;
  errorContrast: string;
  info: string;
  infoContrast: string;
  
  // Component specific
  card: string;
  headerBackground: string;
  headerText: string;
  tabBarBackground: string;
  tabBarActiveColor: string;
  tabBarInactiveColor: string;
  inputBackground: string;
  placeholder: string;
  
  // UI component variants
  badgeBackground: string;
  badgeText: string;
  sortOptionActiveBg: string;
  sortOptionInactiveBg: string;
  errorContainerBg: string;
}

/**
 * Dark theme colors
 */
export const DARK_THEME: Theme = {
  // Base surfaces
  background: PALETTE.DARK.BACKGROUND,
  surface: PALETTE.DARK.SURFACE,
  surfaceVariant: PALETTE.DARK.SURFACE_ELEVATED,
  
  // Text colors
  text: PALETTE.DARK.TEXT,
  textSecondary: PALETTE.DARK.TEXT_SECONDARY,
  textDisabled: PALETTE.DARK.TEXT_DISABLED,
  
  // Interactive elements
  primary: PALETTE.ACCENT.DEFAULT,
  primaryVariant: PALETTE.ACCENT.DARK,
  secondary: PALETTE.NEUTRAL.GRAY_700,
  secondaryText: PALETTE.NEUTRAL.GRAY_200,
  accent: PALETTE.ACCENT.DEFAULT,
  accentLight: PALETTE.ACCENT.LIGHT,
  accentDark: PALETTE.ACCENT.DARK,
  
  // Borders and dividers
  border: PALETTE.DARK.BORDER,
  divider: PALETTE.DARK.DIVIDER,
  
  // Status/feedback colors
  success: PALETTE.SUCCESS.DEFAULT,
  successContrast: PALETTE.SUCCESS.CONTRAST,
  warning: PALETTE.WARNING.DEFAULT,
  warningContrast: PALETTE.WARNING.CONTRAST,
  error: PALETTE.ERROR.DEFAULT,
  errorContrast: PALETTE.ERROR.CONTRAST,
  info: PALETTE.INFO.DEFAULT,
  infoContrast: PALETTE.INFO.CONTRAST,
  
  // Component specific
  card: PALETTE.DARK.SURFACE_ELEVATED,
  headerBackground: PALETTE.DARK.BACKGROUND,
  headerText: PALETTE.NEUTRAL.WHITE,
  tabBarBackground: PALETTE.DARK.BACKGROUND,
  tabBarActiveColor: PALETTE.COMPONENT.TAB_BAR_ACTIVE_DARK,
  tabBarInactiveColor: PALETTE.COMPONENT.TAB_BAR_INACTIVE_DARK,
  inputBackground: PALETTE.DARK.SURFACE_ELEVATED,
  placeholder: PALETTE.NEUTRAL.GRAY_500,
  
  // UI component variants
  badgeBackground: PALETTE.COMPONENT.BADGE_BACKGROUND_DARK,
  badgeText: PALETTE.COMPONENT.BADGE_TEXT_DARK,
  sortOptionActiveBg: PALETTE.COMPONENT.SORT_OPTION_ACTIVE_BG_DARK,
  sortOptionInactiveBg: PALETTE.COMPONENT.SORT_OPTION_INACTIVE_BG_DARK,
  errorContainerBg: PALETTE.COMPONENT.ERROR_CONTAINER_BG,
};

/**
 * Light theme colors
 */
export const LIGHT_THEME: Theme = {
  // Base surfaces
  background: PALETTE.LIGHT.BACKGROUND,
  surface: PALETTE.LIGHT.SURFACE,
  surfaceVariant: PALETTE.LIGHT.SURFACE_VARIANT,
  
  // Text colors
  text: PALETTE.LIGHT.TEXT,
  textSecondary: PALETTE.LIGHT.TEXT_SECONDARY,
  textDisabled: PALETTE.LIGHT.TEXT_DISABLED,
  
  // Interactive elements
  primary: PALETTE.PRIMARY.DEFAULT,
  primaryVariant: PALETTE.PRIMARY.DARK,
  secondary: PALETTE.PRIMARY.DEFAULT,
  secondaryText: PALETTE.AMBER.DARK,
  accent: PALETTE.ACCENT.DEFAULT,
  accentLight: PALETTE.ACCENT.LIGHT,
  accentDark: PALETTE.ACCENT.DARK,
  
  // Borders and dividers
  border: PALETTE.LIGHT.BORDER,
  divider: PALETTE.LIGHT.DIVIDER,
  
  // Status/feedback colors
  success: PALETTE.SUCCESS.DEFAULT,
  successContrast: PALETTE.SUCCESS.CONTRAST,
  warning: PALETTE.WARNING.DEFAULT,
  warningContrast: PALETTE.WARNING.CONTRAST,
  error: PALETTE.ERROR.DEFAULT,
  errorContrast: PALETTE.ERROR.CONTRAST,
  info: PALETTE.INFO.DEFAULT,
  infoContrast: PALETTE.INFO.CONTRAST,
  
  // Component specific
  card: PALETTE.LIGHT.SURFACE,
  headerBackground: PALETTE.LIGHT.HEADER, // Change to green from frontend
  headerText: PALETTE.PRIMARY.CONTRAST, // White text on green header
  tabBarBackground: PALETTE.LIGHT.HEADER, // Change tab bar to green
  tabBarActiveColor: PALETTE.COMPONENT.TAB_BAR_ACTIVE_LIGHT,
  tabBarInactiveColor: PALETTE.COMPONENT.TAB_BAR_INACTIVE_LIGHT,
  inputBackground: PALETTE.LIGHT.SURFACE,
  placeholder: PALETTE.NEUTRAL.GRAY_500,
  
  // UI component variants
  badgeBackground: PALETTE.COMPONENT.BADGE_BACKGROUND_LIGHT,
  badgeText: PALETTE.COMPONENT.BADGE_TEXT_LIGHT,
  sortOptionActiveBg: PALETTE.COMPONENT.SORT_OPTION_ACTIVE_BG_LIGHT,
  sortOptionInactiveBg: PALETTE.COMPONENT.SORT_OPTION_INACTIVE_BG_LIGHT,
  errorContainerBg: PALETTE.COMPONENT.ERROR_CONTAINER_BG,
};

/**
 * Function to get theme based on theme type
 */
export const getTheme = (themeType: ThemeType): Theme => {
  return themeType === 'light' ? LIGHT_THEME : DARK_THEME;
};

/**
 * Spacing scale (in density-independent pixels)
 * Used for consistent margins, paddings, and layouts
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Typography scale for consistent text styling
 */
export const TYPOGRAPHY = {
  heading1: {
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 40,
    fontFamily: 'Poppins_700Bold',
  },
  heading2: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 36,
    fontFamily: 'Poppins_700Bold',
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 32,
    fontFamily: 'Poppins_600SemiBold',
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
  },
} as const;

/**
 * Border radius constants for consistent component styling
 */
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999, // For circular elements
} as const;

/**
 * Shadow styles for consistent elevation
 */
export const SHADOWS = {
  small: {
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: PALETTE.NEUTRAL.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

/**
 * Create text styles with appropriate theme colors
 */
export const createTextStyles = (theme: Theme) => ({
  heading1: {
    ...TYPOGRAPHY.heading1,
    color: theme.text,
  },
  heading2: {
    ...TYPOGRAPHY.heading2,
    color: theme.text,
  },
  heading3: {
    ...TYPOGRAPHY.heading3,
    color: theme.text,
  },
  heading4: {
    ...TYPOGRAPHY.heading4,
    color: theme.text,
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
    color: theme.text,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: theme.text,
  },
  bodySecondary: {
    ...TYPOGRAPHY.body,
    color: theme.textSecondary,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: theme.textSecondary,
  },
  small: {
    ...TYPOGRAPHY.small,
    color: theme.textSecondary,
  },
});
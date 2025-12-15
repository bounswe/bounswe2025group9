/**
 * i18n Configuration
 * 
 * Internationalization setup for NutriHub mobile app.
 * Supports: English (en-US), Turkish (tr-TR), Arabic (ar)
 * Follows W3C Internationalization guidelines and BCP 47 language tags.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enUS from './locales/en-US.json';
import trTR from './locales/tr-TR.json';
import ar from './locales/ar.json';

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'user_language';

// Supported languages with BCP 47 tags
export const SUPPORTED_LANGUAGES = {
  'en-US': {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
  },
  'tr-TR': {
    code: 'tr-TR',
    name: 'Turkish',
    nativeName: 'Türkçe',
    isRTL: false,
  },
  'ar': {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
  },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Get default language based on device locale
const getDefaultLanguage = (): LanguageCode => {
  const deviceLocale = Localization.getLocales()[0]?.languageTag || 'en-US';
  
  // Check if device locale matches any supported language
  if (deviceLocale in SUPPORTED_LANGUAGES) {
    return deviceLocale as LanguageCode;
  }
  
  // Check for language code match (e.g., 'en' matches 'en-US')
  const languageCode = deviceLocale.split('-')[0];
  if (languageCode === 'tr') return 'tr-TR';
  if (languageCode === 'ar') return 'ar';
  if (languageCode === 'en') return 'en-US';
  
  // Default to English
  return 'en-US';
};

// Translation resources
const resources = {
  'en-US': { translation: enUS },
  'tr-TR': { translation: trTR },
  'ar': { translation: ar },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(),
    fallbackLng: 'en-US',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false, // React Native already escapes
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Load saved language preference from storage
 */
export const loadSavedLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && savedLanguage in SUPPORTED_LANGUAGES) {
      return savedLanguage as LanguageCode;
    }
    return null;
  } catch (error) {
    console.error('Error loading saved language:', error);
    return null;
  }
};

/**
 * Save language preference to storage
 */
export const saveLanguage = async (language: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

/**
 * Check if a language is RTL
 */
export const isRTLLanguage = (language: LanguageCode): boolean => {
  return SUPPORTED_LANGUAGES[language]?.isRTL ?? false;
};

export default i18n;


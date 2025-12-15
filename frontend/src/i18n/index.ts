import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enUS from './locales/en-US.json';
import trTR from './locales/tr-TR.json';
import ar from './locales/ar.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Language resources
const resources = {
  'en-US': { translation: enUS },
  'tr-TR': { translation: trTR },
  'ar': { translation: ar },
};

// Local storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'nh_language';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
    
    // Language detection options
    detection: {
      // Order of detection - localStorage first, then browser
      order: ['localStorage', 'navigator'],
      // Key to store in localStorage
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      // Cache language in localStorage
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense to avoid loading states
    },
  });

// Helper function to get direction for current language
export const getLanguageDirection = (langCode: string): 'ltr' | 'rtl' => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === langCode);
  return language?.dir || 'ltr';
};

// Helper function to check if language is RTL
export const isRTL = (langCode: string): boolean => {
  return getLanguageDirection(langCode) === 'rtl';
};

export default i18n;


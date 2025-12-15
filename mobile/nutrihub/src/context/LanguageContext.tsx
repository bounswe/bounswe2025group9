/**
 * Language Context
 * 
 * Provides language state and functions to the app.
 * Supports LTR and RTL languages with persistence.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { I18nManager, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n, {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  loadSavedLanguage,
  saveLanguage,
  isRTLLanguage,
} from '../i18n';

// Try to import expo-updates for app reload (optional)
let Updates: { reloadAsync?: () => Promise<void> } | null = null;
try {
  Updates = require('expo-updates');
} catch {
  // expo-updates not available (development mode)
}

interface LanguageContextType {
  currentLanguage: LanguageCode;
  isRTL: boolean;
  isLoading: boolean;
  changeLanguage: (language: LanguageCode) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  t: ReturnType<typeof useTranslation>['t'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en-US');
  const [isRTL, setIsRTL] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize language on mount
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    setIsLoading(true);
    try {
      // Try to load saved language preference
      const savedLanguage = await loadSavedLanguage();
      
      if (savedLanguage) {
        // Use saved language
        await applyLanguage(savedLanguage, false);
      } else {
        // Use current i18n language (already set to device default)
        const defaultLang = i18n.language as LanguageCode;
        setCurrentLanguage(defaultLang);
        setIsRTL(isRTLLanguage(defaultLang));
      }
    } catch (error) {
      console.error('Error initializing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyLanguage = async (language: LanguageCode, showRestartAlert: boolean = true) => {
    const newIsRTL = isRTLLanguage(language);
    const rtlChanged = newIsRTL !== I18nManager.isRTL;

    // Change i18n language
    await i18n.changeLanguage(language);
    
    // Save language preference
    await saveLanguage(language);
    
    // Update state
    setCurrentLanguage(language);
    setIsRTL(newIsRTL);

    // Handle RTL change
    if (rtlChanged) {
      I18nManager.allowRTL(newIsRTL);
      I18nManager.forceRTL(newIsRTL);
      
      if (showRestartAlert) {
        // Alert user that app needs to restart for RTL changes
        Alert.alert(
          t('language.title'),
          t('language.restartRequired'),
          [
            {
              text: t('common.ok'),
              onPress: async () => {
                // Try to reload the app for RTL changes
                try {
                  // In development, this might not work perfectly
                  // In production with expo-updates, this will reload
                  if (!__DEV__ && Updates?.reloadAsync) {
                    await Updates.reloadAsync();
                  }
                } catch (error) {
                  console.log('Could not reload app:', error);
                }
              },
            },
          ]
        );
      }
    }
  };

  const changeLanguage = async (language: LanguageCode): Promise<void> => {
    if (language === currentLanguage) return;
    
    try {
      await applyLanguage(language, true);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    isLoading,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use the language context
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};


import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { SUPPORTED_LANGUAGES, LanguageCode, getLanguageDirection, isRTL } from '../i18n';

// Language context type
interface LanguageContextType {
  currentLanguage: LanguageCode;
  changeLanguage: (langCode: LanguageCode) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Language provider component
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    (i18nInstance.language as LanguageCode) || 'en-US'
  );

  // Update document direction when language changes
  useEffect(() => {
    const direction = getLanguageDirection(currentLanguage);
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    
    // Add or remove RTL class for styling
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [currentLanguage]);

  // Listen for language changes from i18next
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng as LanguageCode);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Change language function
  const changeLanguage = useCallback(async (langCode: LanguageCode) => {
    try {
      await i18nInstance.changeLanguage(langCode);
      setCurrentLanguage(langCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18nInstance]);

  // Context value
  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t: (key: string, options?: Record<string, unknown>) => String(t(key, options as never)),
    isRTL: isRTL(currentLanguage),
    direction: getLanguageDirection(currentLanguage),
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;


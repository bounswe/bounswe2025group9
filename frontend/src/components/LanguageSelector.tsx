import { useState, useRef, useEffect } from 'react';
import { Globe } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../i18n';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode: LanguageCode) => {
    await changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all hover:bg-white/10"
        title={t('language.select')}
        aria-label={t('language.select')}
        aria-expanded={isOpen}
      >
        <Globe size={20} weight="bold" className="text-white" />
        <span className="text-white text-sm font-medium hidden sm:inline">
          {currentLang?.nativeName || 'EN'}
        </span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg overflow-hidden z-50"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2.5 text-left transition-colors flex items-center justify-between ${
                currentLanguage === lang.code 
                  ? 'bg-primary/10 font-semibold' 
                  : 'hover:bg-primary/5'
              }`}
              style={{ 
                color: currentLanguage === lang.code 
                  ? 'var(--color-primary)' 
                  : 'var(--color-text)'
              }}
            >
              <span>{lang.nativeName}</span>
              {currentLanguage === lang.code && (
                <span className="text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;


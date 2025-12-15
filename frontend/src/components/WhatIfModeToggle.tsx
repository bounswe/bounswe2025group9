import { Lightning, LightningSlash } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

interface WhatIfModeToggleProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const WhatIfModeToggle = ({ isActive, onToggle, disabled = false }: WhatIfModeToggleProps) => {
  const { t } = useLanguage();
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
        transition-all duration-300 shadow-sm
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
      `}
      style={{
        backgroundColor: isActive 
          ? 'var(--whatif-active-bg, #7c3aed)' 
          : 'var(--color-bg-tertiary)',
        color: isActive 
          ? 'var(--whatif-active-text, white)' 
          : 'var(--color-light)',
        border: isActive 
          ? '2px solid var(--whatif-border, #8b5cf6)' 
          : '2px solid transparent',
      }}
      title={isActive ? t('profile.exitWhatIfModeTooltip') : t('profile.enterWhatIfModeTooltip')}
    >
      {isActive ? (
        <>
          <LightningSlash size={18} weight="fill" />
          <span>{t('profile.exitWhatIf')}</span>
        </>
      ) : (
        <>
          <Lightning size={18} weight="fill" />
          <span>{t('profile.whatIf')}</span>
        </>
      )}
    </button>
  );
};

export default WhatIfModeToggle;

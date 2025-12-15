import { useLanguage } from '../context/LanguageContext';

interface WhatIfProgressBarProps {
  label: string;
  current: number;
  planned: number;
  target: number;
  unit?: string;
  color: string;
  plannedColor?: string;
}

const WhatIfProgressBar = ({
  label,
  current,
  planned,
  target,
  unit = '',
  color,
  plannedColor = 'var(--whatif-progress, #8b5cf6)',
}: WhatIfProgressBarProps) => {
  const { t } = useLanguage();
  const total = current + planned;
  const currentPercent = Math.min((current / target) * 100, 100);
  const plannedPercent = Math.min((planned / target) * 100, 100 - currentPercent);
  const totalPercent = Math.min((total / target) * 100, 100);
  const isOverTarget = total > target;

  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--dietary-option-bg)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-sm">
          <span className="font-bold" style={{ color }}>
            {Math.round(current)}
          </span>
          {planned > 0 && (
            <span style={{ color: plannedColor }}>
              {' + '}{Math.round(planned)}
            </span>
          )}
          <span className="nh-text opacity-70">
            {' / '}{Math.round(target)}{unit}
          </span>
        </div>
      </div>
      
      {/* Progress bar with segments */}
      <div 
        className="w-full rounded-full h-2.5 overflow-hidden relative"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Current (actual) progress */}
        <div
          className="h-full rounded-l-full absolute left-0 transition-all duration-300"
          style={{
            width: `${currentPercent}%`,
            backgroundColor: color,
          }}
        />
        
        {/* Planned (what-if) progress - striped pattern */}
        {planned > 0 && (
          <div
            className="h-full absolute transition-all duration-300"
            style={{
              left: `${currentPercent}%`,
              width: `${plannedPercent}%`,
              backgroundColor: plannedColor,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 3px,
                rgba(255,255,255,0.3) 3px,
                rgba(255,255,255,0.3) 6px
              )`,
              borderRadius: currentPercent === 0 ? '9999px 0 0 9999px' : '0',
            }}
          />
        )}
        
        {/* Right cap for the bar */}
        {totalPercent > 0 && (
          <div
            className="h-full w-1 absolute transition-all duration-300"
            style={{
              left: `calc(${Math.min(totalPercent, 100)}% - 2px)`,
              backgroundColor: planned > 0 ? plannedColor : color,
              borderRadius: '0 9999px 9999px 0',
            }}
          />
        )}
      </div>
      
      {/* Over target warning */}
      {isOverTarget && (
        <p className="text-xs mt-1 text-amber-500">
          {Math.round(total - target)}{unit} {t('nutrition.over')} {t('nutrition.target')}
        </p>
      )}
    </div>
  );
};

export default WhatIfProgressBar;

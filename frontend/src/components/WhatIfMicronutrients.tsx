import { useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { isVitamin, isMineral, extractUnit, extractName } from '../types/whatif';
import { NutritionTargets } from '../types/nutrition';

interface WhatIfMicronutrientsProps {
  currentMicronutrients: { [key: string]: number };
  plannedMicronutrients: { [key: string]: number };
  targets: NutritionTargets;
}

const WhatIfMicronutrients = ({
  currentMicronutrients,
  plannedMicronutrients,
  targets,
}: WhatIfMicronutrientsProps) => {
  const [showVitamins, setShowVitamins] = useState(false);
  const [showMinerals, setShowMinerals] = useState(false);

  const targetMicronutrients = targets.micronutrients || {};

  // Get all micronutrient keys from targets
  const allKeys = Object.keys(targetMicronutrients);
  
  const vitamins = allKeys
    .filter(key => isVitamin(key))
    .sort((a, b) => a.localeCompare(b));
  
  const minerals = allKeys
    .filter(key => isMineral(key))
    .sort((a, b) => a.localeCompare(b));

  if (vitamins.length === 0 && minerals.length === 0) {
    return null;
  }

  const renderMicronutrientBar = (key: string, color: string) => {
    const name = extractName(key);
    const unit = extractUnit(key);
    
    const currentValue = currentMicronutrients[name] || 0;
    const plannedValue = plannedMicronutrients[name] || 0;
    
    let targetValue = 0;
    const target = targetMicronutrients[key];
    if (typeof target === 'number') {
      targetValue = target;
    } else if (target && typeof target === 'object' && 'target' in target) {
      targetValue = (target as { target: number }).target;
    }

    if (targetValue === 0) return null;

    const currentPercent = Math.min((currentValue / targetValue) * 100, 100);
    const plannedPercent = Math.min((plannedValue / targetValue) * 100, 100 - currentPercent);
    const total = currentValue + plannedValue;
    const isOverTarget = total > targetValue;

    return (
      <div 
        key={key} 
        className="p-2 rounded text-xs" 
        style={{ backgroundColor: 'var(--dietary-option-bg)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="capitalize">{name}</span>
          <div className="text-right">
            <span className="font-medium" style={{ color }}>
              {currentValue.toFixed(1)}
            </span>
            {plannedValue > 0 && (
              <span style={{ color: 'var(--whatif-text)' }}>
                {' + '}{plannedValue.toFixed(1)}
              </span>
            )}
            <span className="nh-text opacity-70">
              {' / '}{targetValue.toFixed(1)}{unit ? ` ${unit}` : ''}
            </span>
          </div>
        </div>
        
        {/* Progress bar with segments */}
        <div 
          className="w-full rounded-full h-1.5 overflow-hidden relative"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          {/* Current (actual) progress */}
          <div
            className="h-full absolute left-0 transition-all duration-300"
            style={{
              width: `${currentPercent}%`,
              backgroundColor: color,
              borderRadius: plannedValue > 0 ? '9999px 0 0 9999px' : '9999px',
            }}
          />
          
          {/* Planned (what-if) progress - striped pattern */}
          {plannedValue > 0 && (
            <div
              className="h-full absolute transition-all duration-300"
              style={{
                left: `${currentPercent}%`,
                width: `${plannedPercent}%`,
                backgroundColor: 'var(--whatif-progress)',
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.3) 2px,
                  rgba(255,255,255,0.3) 4px
                )`,
                borderRadius: currentPercent === 0 ? '9999px 0 0 9999px' : '0',
              }}
            />
          )}
          
          {/* Right cap */}
          {(currentPercent > 0 || plannedPercent > 0) && (
            <div
              className="h-full w-0.5 absolute transition-all duration-300"
              style={{
                left: `calc(${Math.min(currentPercent + plannedPercent, 100)}% - 1px)`,
                backgroundColor: plannedValue > 0 ? 'var(--whatif-progress)' : color,
                borderRadius: '0 9999px 9999px 0',
              }}
            />
          )}
        </div>
        
        {isOverTarget && (
          <p className="text-xs mt-0.5 text-amber-500">
            {(total - targetValue).toFixed(1)}{unit ? ` ${unit}` : ''} over
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      className="mt-4 pt-4 border-t" 
      style={{ borderColor: 'var(--whatif-border)' }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--whatif-text)' }}>
        Micronutrients
      </p>
      
      {/* Vitamins Section */}
      {vitamins.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowVitamins(!showVitamins)}
            className="w-full flex items-center justify-between p-2 rounded transition-colors"
            style={{ backgroundColor: 'var(--dietary-option-bg)' }}
          >
            <span className="text-xs font-semibold">Vitamins</span>
            {showVitamins ? (
              <CaretDown size={14} style={{ color: 'var(--whatif-text)' }} />
            ) : (
              <CaretRight size={14} style={{ color: 'var(--whatif-text)' }} />
            )}
          </button>
          {showVitamins && (
            <div className="mt-2 space-y-1.5 pl-2">
              {vitamins.map(key => renderMicronutrientBar(key, '#a855f7'))}
            </div>
          )}
        </div>
      )}

      {/* Minerals Section */}
      {minerals.length > 0 && (
        <div>
          <button
            onClick={() => setShowMinerals(!showMinerals)}
            className="w-full flex items-center justify-between p-2 rounded transition-colors"
            style={{ backgroundColor: 'var(--dietary-option-bg)' }}
          >
            <span className="text-xs font-semibold">Minerals</span>
            {showMinerals ? (
              <CaretDown size={14} style={{ color: 'var(--whatif-text)' }} />
            ) : (
              <CaretRight size={14} style={{ color: 'var(--whatif-text)' }} />
            )}
          </button>
          {showMinerals && (
            <div className="mt-2 space-y-1.5 pl-2">
              {minerals.map(key => renderMicronutrientBar(key, '#14b8a6'))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatIfMicronutrients;

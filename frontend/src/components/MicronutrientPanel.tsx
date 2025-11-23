import { useState } from 'react';
import { Pill, Warning, CheckCircle, CaretDown, CaretUp } from '@phosphor-icons/react';
import { MicroNutrient } from '../types/nutrition';

interface MicronutrientPanelProps {
  micronutrients: MicroNutrient[];
}

const MicronutrientPanel = ({ micronutrients }: MicronutrientPanelProps) => {
  const [expandedCategory, setExpandedCategory] = useState<'vitamin' | 'mineral' | null>('vitamin');
  const [showAllVitamins, setShowAllVitamins] = useState(false);
  const [showAllMinerals, setShowAllMinerals] = useState(false);

  const vitamins = micronutrients.filter(m => m.category === 'vitamin');
  const minerals = micronutrients.filter(m => m.category === 'mineral');

  const displayedVitamins = showAllVitamins ? vitamins : vitamins.slice(0, 5);
  const displayedMinerals = showAllMinerals ? minerals : minerals.slice(0, 5);

  const getNutrientStatus = (nutrient: MicroNutrient) => {
    // If no target is set, just show the current value without status
    if (!nutrient.target || nutrient.target === 0) {
      return { status: 'no-target', color: 'var(--color-text)', label: 'No target set' };
    }
    
    const percentage = (nutrient.current / nutrient.target) * 100;
    
    if (nutrient.maximum && nutrient.current > nutrient.maximum) {
      return { status: 'danger', color: 'var(--color-error)', label: 'Over Maximum' };
    }
    if (percentage >= 100) {
      return { status: 'complete', color: 'var(--color-success)', label: 'Met' };
    }
    if (percentage >= 75) {
      return { status: 'good', color: '#22c55e', label: 'Good' };
    }
    if (percentage >= 50) {
      return { status: 'fair', color: 'var(--color-warning)', label: 'Fair' };
    }
    return { status: 'low', color: 'var(--color-error)', label: 'Low' };
  };

  const renderNutrientRow = (nutrient: MicroNutrient) => {
    const hasTarget = nutrient.target && nutrient.target > 0;
    const percentage = hasTarget ? Math.min((nutrient.current / nutrient.target) * 100, 100) : 0;
    const { status, color, label } = getNutrientStatus(nutrient);
    const isOverMax = nutrient.maximum && nutrient.current > nutrient.maximum;

    return (
      <div 
        key={nutrient.name} 
        className="p-3 rounded-lg hover:shadow-sm transition-all cursor-pointer nutrient-row-hover"
        style={{ backgroundColor: 'var(--dietary-option-bg)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Pill size={16} weight="fill" className="opacity-50" />
            <span className="text-sm font-medium">{nutrient.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {status === 'complete' && !isOverMax && (
              <CheckCircle size={16} weight="fill" style={{ color }} />
            )}
            {isOverMax && (
              <Warning size={16} weight="fill" style={{ color }} />
            )}
            <span className="text-xs font-medium" style={{ color }}>
              {label}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm font-bold text-primary">
            {nutrient.current.toFixed(1)}{nutrient.unit}
          </span>
          {hasTarget && (
            <span className="text-xs nh-text opacity-70">
              / {nutrient.target}{nutrient.unit}
            </span>
          )}
          {!hasTarget && (
            <span className="text-xs nh-text opacity-50">
              (no target set)
            </span>
          )}
          {nutrient.maximum && (
            <span className="text-xs nh-text opacity-50">
              (max: {nutrient.maximum}{nutrient.unit})
            </span>
          )}
        </div>

        {/* Progress bar - only show if target is set */}
        {hasTarget && (
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all"
              style={{
                width: `${percentage}%`,
                backgroundColor: color
              }}
            />
            {/* Warning indicator if over maximum */}
            {isOverMax && (
              <div 
                className="absolute top-0 right-0 h-2 w-1 rounded-r-full"
                style={{ backgroundColor: 'var(--color-error)' }}
              />
            )}
          </div>
        )}

        {/* Warning message if over maximum */}
        {isOverMax && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-error)' }}>
            ⚠️ Exceeds safe maximum threshold
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="nh-card">
      <div className="flex items-center gap-2 mb-6">
        <Pill size={28} weight="fill" className="text-primary" />
        <h3 className="nh-subtitle">Micronutrients</h3>
      </div>

      {/* Vitamins Section */}
      <div className="mb-6">
        <button
          onClick={() => setExpandedCategory(expandedCategory === 'vitamin' ? null : 'vitamin')}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors nutrient-row-hover"
        >
          <h4 className="font-semibold text-lg">Vitamins</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm nh-text opacity-70">
              {vitamins.filter(v => v.target && v.target > 0 && (v.current / v.target) * 100 >= 100).length} / {vitamins.filter(v => v.target && v.target > 0).length} met
            </span>
            {expandedCategory === 'vitamin' ? (
              <CaretUp size={20} weight="bold" />
            ) : (
              <CaretDown size={20} weight="bold" />
            )}
          </div>
        </button>

        {expandedCategory === 'vitamin' && (
          <div className="mt-3 space-y-2">
            {displayedVitamins.map(renderNutrientRow)}
            
            {vitamins.length > 5 && (
              <button
                onClick={() => setShowAllVitamins(!showAllVitamins)}
                className="w-full py-2 text-sm text-primary font-medium hover:underline"
              >
                {showAllVitamins ? 'Show Less' : `Show ${vitamins.length - 5} More`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Minerals Section */}
      <div>
        <button
          onClick={() => setExpandedCategory(expandedCategory === 'mineral' ? null : 'mineral')}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors nutrient-row-hover"
        >
          <h4 className="font-semibold text-lg">Minerals</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm nh-text opacity-70">
              {minerals.filter(m => m.target && m.target > 0 && (m.current / m.target) * 100 >= 100).length} / {minerals.filter(m => m.target && m.target > 0).length} met
            </span>
            {expandedCategory === 'mineral' ? (
              <CaretUp size={20} weight="bold" />
            ) : (
              <CaretDown size={20} weight="bold" />
            )}
          </div>
        </button>

        {expandedCategory === 'mineral' && (
          <div className="mt-3 space-y-2">
            {displayedMinerals.map(renderNutrientRow)}
            
            {minerals.length > 5 && (
              <button
                onClick={() => setShowAllMinerals(!showAllMinerals)}
                className="w-full py-2 text-sm text-primary font-medium hover:underline"
              >
                {showAllMinerals ? 'Show Less' : `Show ${minerals.length - 5} More`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Warning Box */}
      <div className="mt-6 p-4 rounded-lg" style={{
        backgroundColor: 'var(--color-warning-light)',
        border: '1px solid var(--color-warning)'
      }}>
        <div className="flex items-start gap-2">
          <Warning size={20} weight="fill" style={{ color: 'var(--color-warning)' }} />
          <div className="text-xs nh-text">
            <p className="font-medium mb-1">Important Note:</p>
            <p>Some micronutrients have maximum safe limits. Exceeding these limits may be harmful to your health. Consult with a healthcare professional if you consistently exceed maximum thresholds.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicronutrientPanel;


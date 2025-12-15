import { Hamburger, Trash, Check, Clock } from '@phosphor-icons/react';
import { WhatIfEntry } from '../types/whatif';
import { useLanguage } from '../context/LanguageContext';

interface WhatIfFoodEntryProps {
  entry: WhatIfEntry;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
}

const WhatIfFoodEntry = ({ entry, onConfirm, onDelete }: WhatIfFoodEntryProps) => {
  const { t } = useLanguage();
  const isPlanned = entry.isPlanned;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all
        ${isPlanned ? 'border-2 border-dashed' : ''}
      `}
      style={{
        backgroundColor: isPlanned 
          ? 'var(--whatif-entry-bg, rgba(124, 58, 237, 0.1))' 
          : 'var(--dietary-option-bg)',
        borderColor: isPlanned 
          ? 'var(--whatif-border, #8b5cf6)' 
          : 'transparent',
        opacity: isPlanned ? 0.85 : 1,
      }}
    >
      {/* Food Image */}
      {entry.image_url ? (
        <img
          src={entry.image_url}
          alt={entry.food_name}
          className="w-14 h-14 rounded-lg object-cover"
          style={{ 
            filter: isPlanned ? 'grayscale(30%)' : 'none',
          }}
        />
      ) : (
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--forum-search-border)' }}
        >
          <Hamburger size={24} weight="fill" className="opacity-50" />
        </div>
      )}

      {/* Food Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 
            className="font-medium truncate"
            style={{ 
              color: isPlanned 
                ? 'var(--whatif-text, #7c3aed)' 
                : 'inherit' 
            }}
          >
            {entry.food_name}
          </h4>
          {isPlanned && (
            <span 
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: 'var(--whatif-badge-bg, rgba(124, 58, 237, 0.2))',
                color: 'var(--whatif-text, #7c3aed)'
              }}
            >
              <Clock size={12} weight="fill" />
              {t('profile.planned')}
            </span>
          )}
        </div>
        <p className="text-xs nh-text opacity-70">
          {(() => {
            const servingSizeNum = Number(entry.serving_size);
            const foodServingSize = entry.food_serving_size || 100;
            if (entry.serving_unit === 'g') {
              const grams = servingSizeNum * foodServingSize;
              return `${Math.round(grams)}g`;
            }
            return `${servingSizeNum.toFixed(2)} ${entry.serving_unit}${servingSizeNum === 1 ? '' : 's'}`;
          })()}
        </p>
      </div>

      {/* Nutrition Info */}
      <div className="text-right">
        <p 
          className="font-semibold"
          style={{ 
            color: isPlanned 
              ? 'var(--whatif-text, #7c3aed)' 
              : 'var(--color-primary)' 
          }}
        >
          {Math.round(entry.calories)} kcal
        </p>
        <p className="text-xs nh-text opacity-70">
          P: {entry.protein.toFixed(1)}g • C: {entry.carbohydrates.toFixed(1)}g • F: {entry.fat.toFixed(1)}g
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {isPlanned && (
          <button
            type="button"
            onClick={() => onConfirm(entry.id)}
            className="p-2 rounded transition-colors"
            style={{ 
              backgroundColor: 'var(--color-success)',
              color: 'white'
            }}
            title={t('nutrition.confirmConsumption')}
          >
            <Check size={18} weight="bold" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="p-2 rounded transition-colors text-red-600"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Delete"
        >
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
};

export default WhatIfFoodEntry;

import { useState, useEffect, useRef } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { apiClient } from '../lib/apiClient';
import { useLanguage } from '../context/LanguageContext';

export interface MicronutrientFilterItem {
  name: string;
  min?: number;
  max?: number;
}

interface MicronutrientFilterProps {
  filters: MicronutrientFilterItem[];
  onChange: (filters: MicronutrientFilterItem[]) => void;
}

interface AvailableMicronutrient {
  name: string;
  unit: string;
}

export const MicronutrientFilter = ({ filters, onChange }: MicronutrientFilterProps) => {
  const { t } = useLanguage();
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterMin, setNewFilterMin] = useState('');
  const [newFilterMax, setNewFilterMax] = useState('');
  const [availableMicronutrients, setAvailableMicronutrients] = useState<AvailableMicronutrient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AvailableMicronutrient[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMicronutrients = async () => {
      try {
        const response = await apiClient.getAvailableMicronutrients();
        setAvailableMicronutrients(response.micronutrients);
      } catch (error) {
        console.error('Error fetching micronutrients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMicronutrients();
  }, []);

  // Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (newFilterName.trim()) {
      const searchTerm = newFilterName.toLowerCase();
      const filtered = availableMicronutrients.filter(m =>
        m.name.toLowerCase().includes(searchTerm)
      ); // Show all matching results
      setFilteredSuggestions(filtered);
    } else {
      // Show all micronutrients when input is empty
      setFilteredSuggestions(availableMicronutrients);
    }
  }, [newFilterName, availableMicronutrients]);

  const addFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: MicronutrientFilterItem = {
      name: newFilterName.trim(),
      ...(newFilterMin && { min: parseFloat(newFilterMin) }),
      ...(newFilterMax && { max: parseFloat(newFilterMax) })
    };

    onChange([...filters, newFilter]);
    setNewFilterName('');
    setNewFilterMin('');
    setNewFilterMax('');
    setShowSuggestions(false);
  };

  const selectSuggestion = (micronutrient: AvailableMicronutrient) => {
    setNewFilterName(micronutrient.name);
    setShowSuggestions(false);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addFilter();
    }
  };

  return (
    <div className="w-full">
      <h3 className="nh-subtitle mb-3">{t('food.micronutrientFilters')}</h3>

      {!loading && availableMicronutrients.length > 0 && (
        <p className="nh-text text-sm mb-3" style={{ color: 'var(--forum-default-text)' }}>
          {t('food.micronutrientFilterDescription')}
        </p>
      )}

      {/* Add new filter */}
      <div className="space-y-2 mb-4">
        <div className="relative" ref={suggestionsRef}>
          <input
            type="text"
            placeholder={loading ? t('food.loadingNutrients') : t('food.nutrientNamePlaceholder')}
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (filteredSuggestions.length > 0 || availableMicronutrients.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={loading}
            className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              className="absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {filteredSuggestions.map((micronutrient, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(micronutrient)}
                  className="w-full px-3 py-2 text-left focus:outline-none transition-colors"
                  style={{
                    color: 'var(--color-text-primary)',
                    borderBottom: index < filteredSuggestions.length - 1 ? '1px solid var(--color-border)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{micronutrient.name}</span>
                    <span className="text-xs opacity-70">({micronutrient.unit})</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full">
          <input
            type="number"
            placeholder={t('food.min')}
            value={newFilterMin}
            onChange={(e) => setNewFilterMin(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-1/2 px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search"
            style={{ minWidth: 0 }}
          />
          <input
            type="number"
            placeholder={t('food.max')}
            value={newFilterMax}
            onChange={(e) => setNewFilterMax(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-1/2 px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary nh-forum-search"
            style={{ minWidth: 0 }}
          />
        </div>

        <button
          onClick={addFilter}
          disabled={!newFilterName.trim() || loading}
          className="w-full nh-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} weight="bold" />
          {loading ? t('common.loading') : t('food.addFilter')}
        </button>
      </div>

	  {/* Current filters */}
	  {filters.length > 0 && (
		  <div className="space-y-2">
      <p className="nh-text font-medium">{t('food.activeFilters')}:</p>
		  {filters.map((filter, index) => {
			  const micronutrient = availableMicronutrients.find(
				  m => m.name.toLowerCase() === filter.name.toLowerCase()
			  );
        const unit = micronutrient ? ` ${micronutrient.unit}` : '';

        const valueText =
          filter.min !== undefined && filter.max !== undefined
            ? t('food.rangeValue', { min: filter.min, max: filter.max, unit })
            : filter.min !== undefined
              ? t('food.minValue', { value: filter.min, unit })
              : filter.max !== undefined
                ? t('food.maxValue', { value: filter.max, unit })
                : t('food.anyAmount');

							  return (
								  <div
								  key={index}
								  className="flex items-center justify-between p-2 rounded-lg"
								  style={{
									  backgroundColor: 'var(--color-bg-secondary)',
									  border: '1px solid var(--color-border)'
								  }}
								  >
								  <div className="flex-1 min-w-0">
								  <p className="nh-text font-medium truncate">{filter.name}</p>
								  <p className="nh-text text-sm opacity-70">{valueText}</p>
								  </div>

								  <button
								  onClick={() => removeFilter(index)}
								  className="p-1 rounded transition-colors flex-shrink-0 ml-2"
								  aria-label={t('common.removeFilter')}
								  style={{
									  color: 'var(--color-error, #ef4444)'
								  }}
								  onMouseEnter={(e) => {
									  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
								  }}
								  onMouseLeave={(e) => {
									  e.currentTarget.style.backgroundColor = 'transparent';
								  }}
								  >
								  <X size={20} weight="bold" />
								  </button>
								  </div>
							  );
		  })}
		  </div>
	  )}
      {filters.length === 0 && (
        <p className="nh-text text-sm italic opacity-60">
          {t('food.noActiveMicronutrientFilters')}
        </p>
      )}
    </div>
  );
};

export const buildMicronutrientQuery = (filters: MicronutrientFilterItem[]): string => {
  return filters.map(({ name, min, max }) => {
    const low = min !== undefined ? min : '';
    const high = max !== undefined ? max : '';
    return `${name}:${low}-${high}`;
  }).join(',');
};

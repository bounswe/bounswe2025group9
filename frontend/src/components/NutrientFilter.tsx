import { useState, useRef, useEffect } from 'react';
import { Plus, X } from '@phosphor-icons/react';

export interface NutrientFilterItem {
  name: string;
  min?: number;
  max?: number;
}

interface AvailableNutrient {
  name: string;
  unit: string;
}

interface NutrientFilterProps {
  title: string;
  description: string;
  availableNutrients: AvailableNutrient[];
  loading?: boolean;
  filters: NutrientFilterItem[];
  onChange: (filters: NutrientFilterItem[]) => void;
  placeholder?: string;
}

export const NutrientFilter = ({
  title,
  description,
  availableNutrients,
  loading = false,
  filters,
  onChange,
  placeholder = "Nutrient name"
}: NutrientFilterProps) => {
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterMin, setNewFilterMin] = useState('');
  const [newFilterMax, setNewFilterMax] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AvailableNutrient[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
      const filtered = availableNutrients.filter(n =>
        n.name.toLowerCase().includes(searchTerm)
      );
      setFilteredSuggestions(filtered);
    } else {
      // Show all nutrients when input is empty
      setFilteredSuggestions(availableNutrients);
    }
  }, [newFilterName, availableNutrients]);

  const addFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: NutrientFilterItem = {
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

  const selectSuggestion = (nutrient: AvailableNutrient) => {
    setNewFilterName(nutrient.name);
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
      <h3 className="nh-subtitle mb-4">{title}</h3>

      {description && !loading && availableNutrients.length > 0 && (
        <p className="nh-text text-sm mb-3 opacity-70" style={{ color: 'var(--forum-default-text)' }}>
          {description}
        </p>
      )}

      {/* Add new filter */}
      <div className="space-y-3 mb-5">
        <div className="relative" ref={suggestionsRef}>
          <input
            type="text"
            placeholder={loading ? "Loading nutrients..." : placeholder}
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (filteredSuggestions.length > 0 || availableNutrients.length > 0) {
                setShowSuggestions(true);
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary nh-forum-search disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--dietary-option-border)'
            }}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              className="absolute z-10 w-full mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--dietary-option-border)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              {filteredSuggestions.map((nutrient, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(nutrient)}
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
                    <span className="text-sm font-medium">{nutrient.name}</span>
                    <span className="text-xs opacity-70">({nutrient.unit})</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full">
          <input
            type="number"
            placeholder="Min"
            value={newFilterMin}
            onChange={(e) => setNewFilterMin(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-1/2 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary nh-forum-search transition-all"
            style={{ 
              minWidth: 0,
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--dietary-option-border)'
            }}
          />
          <input
            type="number"
            placeholder="Max"
            value={newFilterMax}
            onChange={(e) => setNewFilterMax(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-1/2 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary nh-forum-search transition-all"
            style={{ 
              minWidth: 0,
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--dietary-option-border)'
            }}
          />
        </div>

        <button
          onClick={addFilter}
          disabled={!newFilterName.trim() || loading}
          className="w-full nh-button nh-button-primary flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
          <Plus size={18} weight="bold" />
          {loading ? 'Loading...' : 'Add'}
        </button>
      </div>

      {/* Current filters */}
      {filters.length > 0 && (
        <div className="space-y-2.5 mt-5">
          <p className="nh-text font-semibold text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Active Filters
          </p>
          {filters.map((filter, index) => {
            const nutrient = availableNutrients.find(
              n => n.name.toLowerCase() === filter.name.toLowerCase()
            );
            const unit = nutrient ? ` ${nutrient.unit}` : '';

            const valueText =
              filter.min !== undefined && filter.max !== undefined
                ? `${filter.min} - ${filter.max}${unit}`
                : filter.min !== undefined
                  ? `≥ ${filter.min}${unit}`
                  : filter.max !== undefined
                    ? `≤ ${filter.max}${unit}`
                    : `Any amount`;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-sm"
                style={{
                  backgroundColor: 'var(--dietary-option-bg)',
                  border: '1px solid var(--dietary-option-border)'
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="nh-text font-medium truncate text-sm">{filter.name}</p>
                  <p className="nh-text text-xs opacity-70 mt-0.5">{valueText}</p>
                </div>

                <button
                  onClick={() => removeFilter(index)}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2 hover:scale-110"
                  aria-label="Remove filter"
                  style={{
                    color: 'var(--color-error, #ef4444)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const buildNutrientQuery = (filters: NutrientFilterItem[]): string => {
  return filters.map(({ name, min, max }) => {
    const low = min !== undefined ? min : '';
    const high = max !== undefined ? max : '';
    return `${name}:${low}-${high}`;
  }).join(',');
};

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { NutrientFilter, NutrientFilterItem, buildNutrientQuery } from './NutrientFilter';

export interface CombinedNutrientFilterItem extends NutrientFilterItem {}

interface CombinedNutrientFilterProps {
  filters: CombinedNutrientFilterItem[];
  onChange: (filters: CombinedNutrientFilterItem[]) => void;
}

interface AvailableNutrient {
  name: string;
  unit: string;
}

const MACRONUTRIENTS: AvailableNutrient[] = [
  { name: 'Protein', unit: 'g' },
  { name: 'Carbohydrates', unit: 'g' },
  { name: 'Fat', unit: 'g' }
];

export const CombinedNutrientFilter = ({ filters, onChange }: CombinedNutrientFilterProps) => {
  const [availableMicronutrients, setAvailableMicronutrients] = useState<AvailableNutrient[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Combine macro and micro nutrients
  const allNutrients = [...MACRONUTRIENTS, ...availableMicronutrients];

  return (
    <NutrientFilter
      title="Nutrient Filters"
      description=""
      availableNutrients={allNutrients}
      loading={loading}
      filters={filters}
      onChange={onChange}
      placeholder="Nutrient name (e.g., iron, protein)"
    />
  );
};

export const buildCombinedNutrientQuery = buildNutrientQuery;


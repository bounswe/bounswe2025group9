import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { useLanguage } from '../context/LanguageContext';
import { NutrientFilter, NutrientFilterItem, buildNutrientQuery } from './NutrientFilter';

export interface MicronutrientFilterItem extends NutrientFilterItem { }

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
  const [availableMicronutrients, setAvailableMicronutrients] = useState<AvailableMicronutrient[]>([]);
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

  return (
    <NutrientFilter
      title={t('food.micronutrientFilters')}
      description={t('food.micronutrientFilterDescription')}
      availableNutrients={availableMicronutrients}
      loading={loading}
      filters={filters}
      onChange={onChange}
      placeholder={t('food.nutrientNamePlaceholder')}
    />
  );
};

export const buildMicronutrientQuery = buildNutrientQuery;

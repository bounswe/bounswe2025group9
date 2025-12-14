import { NutrientFilter, NutrientFilterItem, buildNutrientQuery } from './NutrientFilter';

export interface MacronutrientFilterItem extends NutrientFilterItem {}

interface MacronutrientFilterProps {
  filters: MacronutrientFilterItem[];
  onChange: (filters: MacronutrientFilterItem[]) => void;
}

interface AvailableMacronutrient {
  name: string;
  unit: string;
}

const AVAILABLE_MACRONUTRIENTS: AvailableMacronutrient[] = [
  { name: 'Protein', unit: 'g' },
  { name: 'Carbohydrates', unit: 'g' },
  { name: 'Fat', unit: 'g' }
];

export const MacronutrientFilter = ({ filters, onChange }: MacronutrientFilterProps) => {
  return (
    <NutrientFilter
      title="Macronutrient Filters"
      description="Filter foods by their macronutrient content per 100g."
      availableNutrients={AVAILABLE_MACRONUTRIENTS}
      loading={false}
      filters={filters}
      onChange={onChange}
      placeholder="Nutrient name (e.g., protein, fat)"
    />
  );
};

export const buildMacronutrientQuery = buildNutrientQuery;

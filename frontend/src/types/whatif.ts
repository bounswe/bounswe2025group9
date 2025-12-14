// Types for "What If" Mode - Unified Tracking & Meal Planning

export interface WhatIfEntry {
  id: string; // Temporary ID for UI tracking (uuid)
  food_id: number;
  food_name: string;
  food_serving_size: number;
  image_url: string;
  serving_size: number;
  serving_unit: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  micronutrients?: { [key: string]: number };
  // What-if specific fields
  isPlanned: boolean; // true = planned (not yet consumed), false = confirmed
  plannedAt: string; // ISO timestamp when added in what-if mode
}

export interface WhatIfState {
  isActive: boolean;
  entries: WhatIfEntry[];
  // Snapshot of actual entries when what-if mode was activated
  // Used to calculate the "delta" for visual feedback
  baselineCalories: number;
  baselineProtein: number;
  baselineCarbs: number;
  baselineFat: number;
}

export type WhatIfAction = 
  | { type: 'ACTIVATE'; baseline: { calories: number; protein: number; carbs: number; fat: number } }
  | { type: 'DEACTIVATE' }
  | { type: 'ADD_ENTRY'; entry: WhatIfEntry }
  | { type: 'REMOVE_ENTRY'; id: string }
  | { type: 'UPDATE_ENTRY'; id: string; updates: Partial<WhatIfEntry> }
  | { type: 'CLEAR_ENTRIES' }
  | { type: 'CONFIRM_ENTRY'; id: string }; // Mark as consumed (no longer planned)

export const initialWhatIfState: WhatIfState = {
  isActive: false,
  entries: [],
  baselineCalories: 0,
  baselineProtein: 0,
  baselineCarbs: 0,
  baselineFat: 0,
};

export function whatIfReducer(state: WhatIfState, action: WhatIfAction): WhatIfState {
  switch (action.type) {
    case 'ACTIVATE':
      return {
        ...state,
        isActive: true,
        entries: [],
        baselineCalories: action.baseline.calories,
        baselineProtein: action.baseline.protein,
        baselineCarbs: action.baseline.carbs,
        baselineFat: action.baseline.fat,
      };
    case 'DEACTIVATE':
      return {
        ...state,
        isActive: false,
        entries: [],
      };
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [...state.entries, action.entry],
      };
    case 'REMOVE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(e => e.id !== action.id),
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e => 
          e.id === action.id ? { ...e, ...action.updates } : e
        ),
      };
    case 'CLEAR_ENTRIES':
      return {
        ...state,
        entries: [],
      };
    case 'CONFIRM_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.id ? { ...e, isPlanned: false } : e
        ),
      };
    default:
      return state;
  }
}

// Helper to calculate totals from what-if entries (including micronutrients)
export function calculateWhatIfTotals(entries: WhatIfEntry[]) {
  const micronutrients: { [key: string]: number } = {};
  
  const macros = entries.reduce(
    (acc, entry) => {
      // Aggregate micronutrients
      if (entry.micronutrients) {
        Object.entries(entry.micronutrients).forEach(([key, value]) => {
          micronutrients[key] = (micronutrients[key] || 0) + value;
        });
      }
      
      return {
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbohydrates,
        fat: acc.fat + entry.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  return { ...macros, micronutrients };
}

// Helper functions for categorizing micronutrients
export function isVitamin(name: string): boolean {
  const lowerName = name.toLowerCase();
  return lowerName.includes('vitamin') || 
         lowerName.includes('thiamin') || 
         lowerName.includes('riboflavin') || 
         lowerName.includes('niacin') || 
         lowerName.includes('folate') || 
         lowerName.includes('folic acid') ||
         lowerName.includes('choline') ||
         lowerName.includes('carotene') ||
         lowerName.includes('lycopene') ||
         lowerName.includes('lutein');
}

export function isMineral(name: string): boolean {
  const lowerName = name.toLowerCase();
  return lowerName.includes('calcium') || 
         lowerName.includes('iron') || 
         lowerName.includes('magnesium') || 
         lowerName.includes('phosphorus') || 
         lowerName.includes('potassium') || 
         lowerName.includes('sodium') || 
         lowerName.includes('zinc') || 
         lowerName.includes('copper') || 
         lowerName.includes('manganese') || 
         lowerName.includes('selenium');
}

export function extractUnit(key: string): string {
  const match = key.match(/\(([^)]+)\)$/);
  return match ? match[1] : '';
}

export function extractName(key: string): string {
  return key.replace(/\s*\([^)]+\)$/, '');
}

// Helper to generate unique ID for what-if entries
export function generateWhatIfId(): string {
  return `whatif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

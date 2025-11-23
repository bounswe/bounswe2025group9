import { describe, it, expect } from 'vitest';
import type { Food } from '../lib/apiClient';
import { rankFoodsByQuery } from './FoodSelector';

const makeFood = (overrides: Partial<Food>): Food => ({
  id: 0,
  name: 'Placeholder',
  category: 'General',
  servingSize: 100,
  caloriesPerServing: 100,
  proteinContent: 10,
  fatContent: 10,
  carbohydrateContent: 10,
  allergens: [],
  dietaryOptions: [],
  nutritionScore: 50,
  imageUrl: '',
  ...overrides,
});

describe('rankFoodsByQuery', () => {
  it('prioritizes close fuzzy name matches', () => {
    const foods = [
      makeFood({ id: 1, name: 'Cucumber' }),
      makeFood({ id: 2, name: 'Zucchini' }),
      makeFood({ id: 3, name: 'Tempeh' }),
    ];

    const ranked = rankFoodsByQuery('cucmber', foods);
    expect(ranked[0].name).toBe('Cucumber');
  });

  it('surfaces matches from category and dietary options', () => {
    const foods = [
      makeFood({ id: 1, name: 'Almond Milk', category: 'Drinks' }),
      makeFood({ id: 2, name: 'Oat Milk', category: 'Drinks', dietaryOptions: ['Vegan', 'Dairy-Free'] }),
      makeFood({ id: 3, name: 'Cheddar', category: 'Cheese' }),
    ];

    const ranked = rankFoodsByQuery('dairy free', foods);
    expect(ranked[0].name).toBe('Oat Milk');
  });

  it('returns original list when query is empty', () => {
    const foods = [
      makeFood({ id: 1, name: 'Apple' }),
      makeFood({ id: 2, name: 'Banana' }),
    ];

    const ranked = rankFoodsByQuery('', foods);
    expect(ranked).toEqual(foods);
  });
});

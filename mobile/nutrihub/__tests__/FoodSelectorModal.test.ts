/**
 * FoodSelectorModal Tests
 * 
 * Tests for the rankFoodsByQuery function used in food search
 */

import { rankFoodsByQuery } from '../src/components/food/FoodSelectorModal';
import { FoodItem } from '../src/types/types';

const makeFood = (overrides: Partial<FoodItem>): FoodItem => ({
  id: 0,
  title: 'Placeholder',
  description: '',
  iconName: 'food',
  category: 'Fruit',
  ...overrides,
});

describe('rankFoodsByQuery', () => {
  it('ranks close fuzzy matches highest', () => {
    const foods = [
      makeFood({ id: 1, title: 'Cucumber' }),
      makeFood({ id: 2, title: 'Zucchini' }),
      makeFood({ id: 3, title: 'Tempeh' }),
    ];

    const ranked = rankFoodsByQuery('cucmber', foods);
    expect(ranked[0].title).toBe('Cucumber');
  });

  it('uses dietary options when scoring', () => {
    const foods = [
      makeFood({ id: 1, title: 'Almond Milk', category: 'Beverage' }),
      makeFood({ id: 2, title: 'Oat Milk', category: 'Beverage', dietaryOptions: ['Vegan', 'Lactose-free'] }),
      makeFood({ id: 3, title: 'Cheddar', category: 'Dairy' }),
    ];

    // "lactose" should match "Lactose-free" in dietaryOptions
    // Oat Milk should rank first because "lactose" is included in "Lactose-free"
    const ranked = rankFoodsByQuery('lactose', foods);
    expect(ranked[0].title).toBe('Oat Milk');
  });

  it('uses category field when scoring', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple', category: 'Fruit' }),
      makeFood({ id: 2, title: 'Banana', category: 'Fruit' }),
      makeFood({ id: 3, title: 'Chicken Breast', category: 'Meat' }),
    ];

    // "fruit" should match category "Fruit"
    const ranked = rankFoodsByQuery('fruit', foods);
    // Both Apple and Banana should rank higher than Chicken Breast
    expect(['Apple', 'Banana']).toContain(ranked[0].title);
    expect(ranked[2].title).toBe('Chicken Breast');
  });

  it('returns original list when query is empty', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple' }),
      makeFood({ id: 2, title: 'Banana' }),
    ];

    const ranked = rankFoodsByQuery('', foods);
    expect(ranked).toEqual(foods);
  });

  it('returns original list when query is only whitespace', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple' }),
      makeFood({ id: 2, title: 'Banana' }),
    ];

    const ranked = rankFoodsByQuery('   ', foods);
    expect(ranked).toEqual(foods);
  });

  it('falls back to best available matches when below threshold', () => {
    const foods = [
      makeFood({ id: 1, title: 'Alpha' }),
      makeFood({ id: 2, title: 'Beta' }),
    ];

    const ranked = rankFoodsByQuery('zzz', foods);
    // Should return all foods even if they don't match well
    expect(ranked.length).toBe(2);
    expect(ranked.map(f => f.title)).toEqual(['Alpha', 'Beta']);
  });

  it('sorts by score then alphabetically when scores are equal', () => {
    const foods = [
      makeFood({ id: 1, title: 'Zebra' }),
      makeFood({ id: 2, title: 'Apple' }),
      makeFood({ id: 3, title: 'Banana' }),
    ];

    // All should score similarly for a non-matching query
    const ranked = rankFoodsByQuery('xyz', foods);
    // Should be sorted alphabetically as tie-breaker
    expect(ranked[0].title).toBe('Apple');
    expect(ranked[1].title).toBe('Banana');
    expect(ranked[2].title).toBe('Zebra');
  });

  it('handles case-insensitive matching', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple' }),
      makeFood({ id: 2, title: 'BANANA' }),
      makeFood({ id: 3, title: 'Cherry' }),
    ];

    const ranked = rankFoodsByQuery('APPLE', foods);
    expect(ranked[0].title).toBe('Apple');
  });

  it('prioritizes exact matches in title over category matches', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple Juice', category: 'Beverage' }),
      makeFood({ id: 2, title: 'Orange', category: 'Apple' }), // Category matches but title doesn't
    ];

    const ranked = rankFoodsByQuery('apple', foods);
    // Apple Juice should rank higher because "apple" is in the title
    expect(ranked[0].title).toBe('Apple Juice');
  });
});


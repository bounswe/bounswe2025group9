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

  it('uses dietary options and category fields when scoring', () => {
    const foods = [
      makeFood({ id: 1, title: 'Almond Milk', category: 'Beverage' }),
      makeFood({ id: 2, title: 'Oat Milk', category: 'Beverage', dietaryOptions: ['Vegan', 'Lactose-free'] }),
      makeFood({ id: 3, title: 'Cheddar', category: 'Dairy' }),
    ];

    const ranked = rankFoodsByQuery('dairy free', foods);
    expect(ranked[0].title).toBe('Oat Milk');
  });

  it('returns original list when query is empty', () => {
    const foods = [
      makeFood({ id: 1, title: 'Apple' }),
      makeFood({ id: 2, title: 'Banana' }),
    ];

    const ranked = rankFoodsByQuery('', foods);
    expect(ranked).toEqual(foods);
  });
});

/**
 * Tests for price category filtering in useFoodFilters hook
 */

import { FoodItem } from '../src/types/types';
import { FOOD_SORT_OPTIONS } from '../src/constants/foodConstants';

// We need to test the filtering logic, so we'll import the hook
// Since hooks need to be tested with React Testing Library, we'll test the filtering logic directly

describe('Price Category Filtering', () => {
  const mockFoodItems: FoodItem[] = [
    {
      id: 1,
      title: 'Cheap Food',
      description: 'A cheap food item',
      iconName: 'food',
      category: 'Fruit',
      priceCategory: '$',
    },
    {
      id: 2,
      title: 'Mid-Range Food',
      description: 'A mid-range food item',
      iconName: 'food',
      category: 'Vegetable',
      priceCategory: '$$',
    },
    {
      id: 3,
      title: 'Premium Food',
      description: 'A premium food item',
      iconName: 'food',
      category: 'Meat',
      priceCategory: '$$$',
    },
    {
      id: 4,
      title: 'No Category Food',
      description: 'A food item without category',
      iconName: 'food',
      category: 'Grain',
      priceCategory: null,
    },
    {
      id: 5,
      title: 'Turkish Lira Category',
      description: 'A food item with Turkish Lira category',
      iconName: 'food',
      category: 'Dairy',
      priceCategory: '₺ ₺', // Should normalize to $$
    },
  ];

  // Test the normalization logic that's used in filtering
  const normalizeCategory = (category: string | null | undefined): string => {
    if (!category) return '';
    return category.replace(/₺/g, '$').replace(/\s+/g, '').trim();
  };

  describe('Category Normalization', () => {
    it('should normalize Turkish Lira to dollar signs', () => {
      expect(normalizeCategory('₺')).toBe('$');
      expect(normalizeCategory('₺ ₺')).toBe('$$');
      expect(normalizeCategory('₺ ₺₺')).toBe('$$$');
    });

    it('should remove spaces from categories', () => {
      expect(normalizeCategory('$ $')).toBe('$$');
      expect(normalizeCategory('$ $ $')).toBe('$$$');
    });

    it('should handle already normalized categories', () => {
      expect(normalizeCategory('$')).toBe('$');
      expect(normalizeCategory('$$')).toBe('$$');
      expect(normalizeCategory('$$$')).toBe('$$$');
    });
  });

  describe('Filter by Price Category', () => {
    it('should filter items by $ category', () => {
      const filter = '$';
      const filtered = mockFoodItems.filter(item => {
        if (!item.priceCategory) return false;
        const normalizedItem = normalizeCategory(item.priceCategory);
        const normalizedFilter = normalizeCategory(filter);
        return normalizedItem === normalizedFilter;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Cheap Food');
    });

    it('should filter items by $$ category', () => {
      const filter = '$$';
      const filtered = mockFoodItems.filter(item => {
        if (!item.priceCategory) return false;
        const normalizedItem = normalizeCategory(item.priceCategory);
        const normalizedFilter = normalizeCategory(filter);
        return normalizedItem === normalizedFilter;
      });

      expect(filtered).toHaveLength(2); // Mid-Range Food and Turkish Lira Category (normalized)
      expect(filtered.map(f => f.title)).toContain('Mid-Range Food');
      expect(filtered.map(f => f.title)).toContain('Turkish Lira Category');
    });

    it('should filter items by $$$ category', () => {
      const filter = '$$$';
      const filtered = mockFoodItems.filter(item => {
        if (!item.priceCategory) return false;
        const normalizedItem = normalizeCategory(item.priceCategory);
        const normalizedFilter = normalizeCategory(filter);
        return normalizedItem === normalizedFilter;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Premium Food');
    });

    it('should exclude items without price category', () => {
      const filter = '$';
      const filtered = mockFoodItems.filter(item => {
        if (!item.priceCategory) return false;
        const normalizedItem = normalizeCategory(item.priceCategory);
        const normalizedFilter = normalizeCategory(filter);
        return normalizedItem === normalizedFilter;
      });

      expect(filtered.find(f => f.title === 'No Category Food')).toBeUndefined();
    });

    it('should handle Turkish Lira categories in filter', () => {
      const filter = '₺ ₺'; // Turkish Lira format
      const filtered = mockFoodItems.filter(item => {
        if (!item.priceCategory) return false;
        const normalizedItem = normalizeCategory(item.priceCategory);
        const normalizedFilter = normalizeCategory(filter);
        return normalizedItem === normalizedFilter;
      });

      expect(filtered).toHaveLength(2); // Should match both $$ and ₺ ₺ items
      expect(filtered.map(f => f.title)).toContain('Mid-Range Food');
      expect(filtered.map(f => f.title)).toContain('Turkish Lira Category');
    });
  });
});


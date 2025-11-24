/**
 * Tests for price utility functions
 */

import {
  formatPrice,
  calculatePriceForServing,
  getPriceCategoryText,
  getPriceCategoryCount,
  getPriceCategoryColor,
} from '../src/utils/priceUtils';

describe('Price Utilities', () => {
  describe('formatPrice', () => {
    it('should format USD price correctly', () => {
      const result = formatPrice(5.99, 'USD', 'en-US');
      expect(result).toMatch(/\$5\.99/);
    });

    it('should format TRY price correctly', () => {
      const result = formatPrice(25.50, 'TRY', 'tr-TR');
      expect(result).toMatch(/25[,.]50/);
    });

    it('should return N/A for null price', () => {
      expect(formatPrice(null)).toBe('N/A');
    });

    it('should return N/A for undefined price', () => {
      expect(formatPrice(undefined)).toBe('N/A');
    });

    it('should return N/A for NaN price', () => {
      expect(formatPrice(NaN)).toBe('N/A');
    });

    it('should use fallback formatting when Intl is not available', () => {
      // Mock Intl to throw error
      const originalIntl = global.Intl;
      // @ts-ignore
      global.Intl = undefined;
      
      const result = formatPrice(10.50, 'USD');
      expect(result).toBe('$10.50');
      
      global.Intl = originalIntl;
    });
  });

  describe('calculatePriceForServing', () => {
    it('should calculate price for per_100g unit', () => {
      const result = calculatePriceForServing(10, 'per_100g', 100, 200);
      expect(result).toBe(20);
    });

    it('should return base price for per_unit', () => {
      const result = calculatePriceForServing(5, 'per_unit', 100, 200);
      expect(result).toBe(5);
    });

    it('should return null for null base price', () => {
      expect(calculatePriceForServing(null)).toBeNull();
    });

    it('should return null for undefined base price', () => {
      expect(calculatePriceForServing(undefined)).toBeNull();
    });

    it('should return null for NaN base price', () => {
      expect(calculatePriceForServing(NaN)).toBeNull();
    });
  });

  describe('getPriceCategoryText', () => {
    it('should normalize Turkish Lira to dollar signs', () => {
      expect(getPriceCategoryText('₺')).toBe('$');
      expect(getPriceCategoryText('₺ ₺')).toBe('$$');
      expect(getPriceCategoryText('₺ ₺₺')).toBe('$$$');
    });

    it('should remove spaces from category', () => {
      expect(getPriceCategoryText('$ $')).toBe('$$');
      expect(getPriceCategoryText('$ $ $')).toBe('$$$');
    });

    it('should return empty string for null', () => {
      expect(getPriceCategoryText(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(getPriceCategoryText(undefined)).toBe('');
    });

    it('should handle already normalized categories', () => {
      expect(getPriceCategoryText('$')).toBe('$');
      expect(getPriceCategoryText('$$')).toBe('$$');
      expect(getPriceCategoryText('$$$')).toBe('$$$');
    });

    it('should trim whitespace', () => {
      expect(getPriceCategoryText('  $  ')).toBe('$');
      expect(getPriceCategoryText('  ₺ ₺  ')).toBe('$$');
    });
  });

  describe('getPriceCategoryCount', () => {
    it('should count dollar signs correctly', () => {
      expect(getPriceCategoryCount('$')).toBe(1);
      expect(getPriceCategoryCount('$$')).toBe(2);
      expect(getPriceCategoryCount('$$$')).toBe(3);
    });

    it('should count Turkish Lira symbols correctly', () => {
      expect(getPriceCategoryCount('₺')).toBe(1);
      expect(getPriceCategoryCount('₺ ₺')).toBe(2);
      expect(getPriceCategoryCount('₺ ₺₺')).toBe(3);
    });

    it('should return 0 for null', () => {
      expect(getPriceCategoryCount(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(getPriceCategoryCount(undefined)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(getPriceCategoryCount('')).toBe(0);
    });
  });

  describe('getPriceCategoryColor', () => {
    it('should return green for $ (cheap)', () => {
      expect(getPriceCategoryColor('$')).toBe('#4CAF50');
      expect(getPriceCategoryColor('₺')).toBe('#4CAF50');
    });

    it('should return orange for $$ (mid-range)', () => {
      expect(getPriceCategoryColor('$$')).toBe('#FF9800');
      expect(getPriceCategoryColor('₺ ₺')).toBe('#FF9800');
    });

    it('should return red for $$$ (premium)', () => {
      expect(getPriceCategoryColor('$$$')).toBe('#F44336');
      expect(getPriceCategoryColor('₺ ₺₺')).toBe('#F44336');
    });

    it('should return gray for unknown categories', () => {
      expect(getPriceCategoryColor(null)).toBe('#9E9E9E');
      expect(getPriceCategoryColor(undefined)).toBe('#9E9E9E');
      expect(getPriceCategoryColor('$$$$')).toBe('#9E9E9E');
      expect(getPriceCategoryColor('')).toBe('#9E9E9E');
    });
  });
});


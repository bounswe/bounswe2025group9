/**
 * Price formatting and utility functions
 */

export type PriceCategory = '$' | '$$' | '$$$' | null;

/**
 * Format price with locale support
 * @param price Price value
 * @param currency Currency code (default: 'USD')
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    // Fallback to simple formatting if Intl is not available
    const symbol = currency === 'USD' ? '$' : currency === 'TRY' ? '₺' : currency;
    return `${symbol}${price.toFixed(2)}`;
  }
};

/**
 * Calculate price for a specific serving size
 * @param basePrice Base price
 * @param priceUnit Price unit ('per_100g' or 'per_unit')
 * @param servingSize Serving size in grams
 * @param targetServingSize Target serving size in grams (default: 100g)
 * @returns Calculated price for target serving size
 */
export const calculatePriceForServing = (
  basePrice: number | null | undefined,
  priceUnit: 'per_100g' | 'per_unit' = 'per_100g',
  servingSize: number = 100,
  targetServingSize: number = 100
): number | null => {
  if (basePrice === null || basePrice === undefined || isNaN(basePrice)) {
    return null;
  }

  if (priceUnit === 'per_unit') {
    // If price is per unit, return as is (assuming 1 unit = servingSize grams)
    return basePrice;
  }

  // If price is per 100g, calculate for target serving size
  return (basePrice / 100) * targetServingSize;
};

/**
 * Get price category display text
 * @param category Price category string
 * @returns Display text for category
 */
export const getPriceCategoryText = (category: string | null | undefined): string => {
  if (!category) return '';
  
  // Normalize to dollar signs if needed and remove spaces
  // Backend returns '₺', '₺ ₺', '₺ ₺₺' which should become '$', '$$', '$$$'
  const normalized = category.replace(/₺/g, '$').replace(/\s+/g, '').trim();
  return normalized;
};

/**
 * Get price category count (number of $ signs)
 * @param category Price category string
 * @returns Number of dollar signs (1, 2, or 3)
 */
export const getPriceCategoryCount = (category: string | null | undefined): number => {
  if (!category) return 0;
  
  const normalized = category.replace(/₺/g, '$').trim();
  return normalized.split('$').length - 1;
};

/**
 * Get color for price category badge
 * @param category Price category string
 * @returns Color code for the category
 */
export const getPriceCategoryColor = (category: string | null | undefined): string => {
  const count = getPriceCategoryCount(category);
  
  switch (count) {
    case 1:
      return '#4CAF50'; // Green for cheap
    case 2:
      return '#FF9800'; // Orange for mid-range
    case 3:
      return '#F44336'; // Red for premium
    default:
      return '#9E9E9E'; // Gray for unknown
  }
};


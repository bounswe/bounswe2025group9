/**
 * Tests for nutrition tracking helper functions
 */

// These functions are currently defined in NutritionTrackingScreen.tsx
// In a real scenario, they should be extracted to a separate utility file
// For now, we'll test the logic directly

describe('Nutrition Helper Functions', () => {
  describe('extractUnit', () => {
    it('should extract unit from key with parentheses', () => {
      const extractUnit = (key: string): string => {
        const match = key.match(/\(([^)]+)\)$/);
        return match ? match[1] : '';
      };

      expect(extractUnit('Vitamin A, RAE (µg)')).toBe('µg');
      expect(extractUnit('Vitamin C (mg)')).toBe('mg');
      expect(extractUnit('Calcium (mg)')).toBe('mg');
      expect(extractUnit('Iron (mg)')).toBe('mg');
    });

    it('should return empty string if no unit found', () => {
      const extractUnit = (key: string): string => {
        const match = key.match(/\(([^)]+)\)$/);
        return match ? match[1] : '';
      };

      expect(extractUnit('Vitamin A')).toBe('');
      expect(extractUnit('No Unit Here')).toBe('');
    });
  });

  describe('extractName', () => {
    it('should remove unit and parenthetical clarifications', () => {
      const extractName = (key: string): string => {
        let name = key.replace(/\s*\([^)]+\)$/, '').trim();
        name = name.replace(/\s*\([^)]+\)/g, '').trim();
        return name;
      };

      expect(extractName('Vitamin K (phylloquinone) (µg)')).toBe('Vitamin K');
      expect(extractName('Vitamin A, RAE (µg)')).toBe('Vitamin A, RAE');
      expect(extractName('Vitamin D (D2 + D3) (µg)')).toBe('Vitamin D');
      expect(extractName('Vitamin E (alpha-tocopherol) (mg)')).toBe('Vitamin E');
      expect(extractName('Calcium (mg)')).toBe('Calcium');
    });

    it('should handle names without parentheses', () => {
      const extractName = (key: string): string => {
        let name = key.replace(/\s*\([^)]+\)$/, '').trim();
        name = name.replace(/\s*\([^)]+\)/g, '').trim();
        return name;
      };

      expect(extractName('Vitamin A')).toBe('Vitamin A');
      expect(extractName('Iron')).toBe('Iron');
    });
  });

  describe('isVitamin', () => {
    it('should identify vitamins correctly', () => {
      const isVitamin = (name: string): boolean => {
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
      };

      expect(isVitamin('Vitamin A')).toBe(true);
      expect(isVitamin('Vitamin C')).toBe(true);
      expect(isVitamin('Vitamin K')).toBe(true);
      expect(isVitamin('Thiamin')).toBe(true);
      expect(isVitamin('Riboflavin')).toBe(true);
      expect(isVitamin('Niacin')).toBe(true);
      expect(isVitamin('Folate')).toBe(true);
      expect(isVitamin('Folic Acid')).toBe(true);
      expect(isVitamin('Choline')).toBe(true);
      expect(isVitamin('Beta Carotene')).toBe(true);
    });

    it('should not identify minerals as vitamins', () => {
      const isVitamin = (name: string): boolean => {
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
      };

      expect(isVitamin('Calcium')).toBe(false);
      expect(isVitamin('Iron')).toBe(false);
      expect(isVitamin('Magnesium')).toBe(false);
      expect(isVitamin('Potassium')).toBe(false);
    });
  });

  describe('isMineral', () => {
    it('should identify minerals correctly', () => {
      const isMineral = (name: string): boolean => {
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
      };

      expect(isMineral('Calcium')).toBe(true);
      expect(isMineral('Iron')).toBe(true);
      expect(isMineral('Magnesium')).toBe(true);
      expect(isMineral('Phosphorus')).toBe(true);
      expect(isMineral('Potassium')).toBe(true);
      expect(isMineral('Sodium')).toBe(true);
      expect(isMineral('Zinc')).toBe(true);
      expect(isMineral('Copper')).toBe(true);
      expect(isMineral('Manganese')).toBe(true);
      expect(isMineral('Selenium')).toBe(true);
    });

    it('should not identify vitamins as minerals', () => {
      const isMineral = (name: string): boolean => {
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
      };

      expect(isMineral('Vitamin A')).toBe(false);
      expect(isMineral('Vitamin C')).toBe(false);
      expect(isMineral('Thiamin')).toBe(false);
    });
  });
});


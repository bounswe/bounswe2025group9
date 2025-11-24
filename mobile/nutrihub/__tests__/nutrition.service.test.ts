/**
 * Tests for Nutrition Service
 */

import { nutritionService } from '../src/services/api/nutrition.service';
import { apiClient } from '../src/services/api/client';

// Mock the API client
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('NutritionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogsForRange', () => {
    it('should handle paginated response from backend', async () => {
      const mockPaginatedResponse = {
        data: {
          count: 2,
          next: null,
          previous: null,
          results: [
            { date: '2024-01-01', total_calories: 2000 },
            { date: '2024-01-02', total_calories: 1800 },
          ],
        },
        status: 200,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockPaginatedResponse);

      const result = await nutritionService.getLogsForRange('2024-01-01', '2024-01-07');

      expect(apiClient.get).toHaveBeenCalledWith('/meal-planner/daily-log/history/', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-07',
        },
      });

      expect(result).toEqual([
        { date: '2024-01-01', total_calories: 2000 },
        { date: '2024-01-02', total_calories: 1800 },
      ]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should handle direct array response', async () => {
      const mockArrayResponse = {
        data: [
          { date: '2024-01-01', total_calories: 2000 },
          { date: '2024-01-02', total_calories: 1800 },
        ],
        status: 200,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockArrayResponse);

      const result = await nutritionService.getLogsForRange('2024-01-01', '2024-01-07');

      expect(result).toEqual([
        { date: '2024-01-01', total_calories: 2000 },
        { date: '2024-01-02', total_calories: 1800 },
      ]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if no data', async () => {
      const mockEmptyResponse = {
        data: null,
        status: 200,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockEmptyResponse);

      const result = await nutritionService.getLogsForRange('2024-01-01', '2024-01-07');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if results is empty', async () => {
      const mockEmptyResults = {
        data: {
          count: 0,
          next: null,
          previous: null,
          results: [],
        },
        status: 200,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockEmptyResults);

      const result = await nutritionService.getLogsForRange('2024-01-01', '2024-01-07');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error if API returns error', async () => {
      const mockErrorResponse = {
        error: 'Failed to fetch logs',
        status: 500,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(
        nutritionService.getLogsForRange('2024-01-01', '2024-01-07')
      ).rejects.toThrow('Failed to fetch logs');
    });
  });
});


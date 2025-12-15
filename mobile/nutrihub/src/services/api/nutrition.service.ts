import { apiClient } from './client';
import {
  DailyNutritionLog,
  NutritionTargets,
  UserMetrics,
  FoodLogEntry,
} from '../../types/nutrition';

/**
 * Nutrition Service
 * Handles all nutrition tracking related API calls
 */
class NutritionService {
  /**
   * Get daily nutrition log for a specific date
   */
  async getDailyLog(date: string): Promise<DailyNutritionLog> {
    try {
      const response = await apiClient.get<DailyNutritionLog>(`/meal-planner/daily-log/`, {
        params: { date }
      });
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error fetching daily nutrition log:', error);
      throw error;
    }
  }

  /**
   * Get nutrition logs for a date range (for weekly view)
   */
  async getLogsForRange(startDate: string, endDate: string): Promise<DailyNutritionLog[]> {
    try {
      const response = await apiClient.get<any>('/meal-planner/daily-log/history/', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      if (response.error) throw new Error(response.error);
      
      // Handle paginated response from Django REST Framework
      // The response can be either:
      // 1. Direct array: [log1, log2, ...]
      // 2. Paginated object: { count: N, next: null, previous: null, results: [log1, log2, ...] }
      if (!response.data) {
        return [];
      }
      
      // Check if it's a paginated response
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      // Otherwise, treat as direct array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching nutrition logs range:', error);
      throw error;
    }
  }

  /**
   * Get user's nutrition targets
   */
  async getTargets(): Promise<NutritionTargets> {
    try {
      const response = await apiClient.get<NutritionTargets>('/users/nutrition-targets/');
      if (response.error) {
        const error: any = new Error(response.error);
        error.status = response.status;
        throw error;
      }
      if (!response.data) {
        const error: any = new Error('No data returned');
        error.status = 404;
        throw error;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrition targets:', error);
      throw error;
    }
  }

  /**
   * Update nutrition targets
   */
  async updateTargets(targets: Partial<NutritionTargets>): Promise<NutritionTargets> {
    try {
      const response = await apiClient.put<NutritionTargets>('/users/nutrition-targets/', targets);
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error updating nutrition targets:', error);
      throw error;
    }
  }

  /**
   * Get user metrics (height, weight, activity level)
   */
  async getUserMetrics(): Promise<UserMetrics | null> {
    try {
      const response = await apiClient.get<UserMetrics>('/users/metrics/');

      // Treat missing metrics as "no data yet" instead of an error
      if (response.status === 404) {
        return null;
      }
      if (response.error) {
        const err: any = new Error(response.error);
        err.status = response.status;
        throw err;
      }
      if (!response.data) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      // Gracefully handle 404 from backend
      const status = error?.status || error?.response?.status;
      if (status === 404) {
        return null;
      }
      console.error('Error fetching user metrics:', error);
      throw error;
    }
  }

  /**
   * Update user metrics and recalculate targets
   */
  async updateUserMetrics(metrics: Partial<UserMetrics>): Promise<UserMetrics> {
    try {
      const response = await apiClient.post<UserMetrics>('/users/metrics/', metrics);
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error updating user metrics:', error);
      throw error;
    }
  }

  /**
   * Add a food entry to a meal
   */
  async addFoodEntry(data: {
    date: string;
    food_id: number;
    serving_size: number;
    serving_unit: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }): Promise<FoodLogEntry> {
    try {
      const response = await apiClient.post<FoodLogEntry>('/meal-planner/daily-log/entries/', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error adding food entry:', error);
      throw error;
    }
  }

  /**
   * Update a food entry
   */
  async updateFoodEntry(
    entryId: number,
    data: Partial<{
      serving_size: number;
      serving_unit: string;
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    }>
  ): Promise<FoodLogEntry> {
    try {
      const response = await apiClient.put<FoodLogEntry>(`/meal-planner/daily-log/entries/${entryId}/`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error updating food entry:', error);
      throw error;
    }
  }

  /**
   * Delete a food entry
   */
  async deleteFoodEntry(entryId: number): Promise<void> {
    try {
      const response = await apiClient.delete(`/meal-planner/daily-log/entries/${entryId}/`);
      if (response.error) throw new Error(response.error);
    } catch (error) {
      console.error('Error deleting food entry:', error);
      throw error;
    }
  }

  /**
   * Reset nutrition targets to auto-calculated values
   */
  async resetTargets(): Promise<NutritionTargets> {
    try {
      const response = await apiClient.post<NutritionTargets>('/users/nutrition-targets/reset/');
      if (response.error) throw new Error(response.error);
      return response.data!;
    } catch (error) {
      console.error('Error resetting targets:', error);
      throw error;
    }
  }

  /**
   * Get nutrition statistics
   */
  async getStatistics(period: 'week' | 'month' = 'week'): Promise<any> {
    try {
      const response = await apiClient.get('/meal-planner/nutrition-statistics/', {
        params: { period }
      });
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const nutritionService = new NutritionService();

// Also export the class for testing purposes
export default NutritionService;


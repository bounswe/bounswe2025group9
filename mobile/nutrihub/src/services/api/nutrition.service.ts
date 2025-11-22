import apiClient from './client';
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
      const response = await apiClient.get(`/nutrition/logs/${date}/`);
      return response.data;
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
      const response = await apiClient.get('/nutrition/logs/', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
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
      const response = await apiClient.get('/nutrition/targets/');
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
      const response = await apiClient.put('/nutrition/targets/', targets);
      return response.data;
    } catch (error) {
      console.error('Error updating nutrition targets:', error);
      throw error;
    }
  }

  /**
   * Get user metrics (height, weight, activity level)
   */
  async getUserMetrics(): Promise<UserMetrics> {
    try {
      const response = await apiClient.get('/nutrition/metrics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      throw error;
    }
  }

  /**
   * Update user metrics and recalculate targets
   */
  async updateUserMetrics(metrics: Partial<UserMetrics>): Promise<{
    metrics: UserMetrics;
    targets: NutritionTargets;
  }> {
    try {
      const response = await apiClient.put('/nutrition/metrics/', metrics);
      return response.data;
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
      const response = await apiClient.post('/nutrition/entries/', data);
      return response.data;
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
      const response = await apiClient.patch(`/nutrition/entries/${entryId}/`, data);
      return response.data;
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
      await apiClient.delete(`/nutrition/entries/${entryId}/`);
    } catch (error) {
      console.error('Error deleting food entry:', error);
      throw error;
    }
  }

  /**
   * Calculate nutrition targets based on user metrics
   * Uses Mifflin-St Jeor equation for BMR and activity multipliers
   */
  async calculateTargetsFromMetrics(metrics: UserMetrics): Promise<NutritionTargets> {
    try {
      const response = await apiClient.post('/nutrition/calculate-targets/', metrics);
      return response.data;
    } catch (error) {
      console.error('Error calculating targets:', error);
      throw error;
    }
  }

  /**
   * Get weekly nutrition summary
   */
  async getWeeklySummary(startDate: string): Promise<{
    daily_logs: DailyNutritionLog[];
    averages: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
    };
    compliance_rate: number; // Percentage of days meeting targets
  }> {
    try {
      const response = await apiClient.get('/nutrition/weekly-summary/', {
        params: { start_date: startDate },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      throw error;
    }
  }

  /**
   * Search foods for adding to nutrition log
   */
  async searchFoods(query: string, page: number = 1): Promise<{
    results: Array<{
      id: number;
      name: string;
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      serving_size: number;
      serving_unit: string;
      image_url?: string;
    }>;
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    try {
      const response = await apiClient.get('/foods/', {
        params: {
          search: query,
          page,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching foods:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const nutritionService = new NutritionService();

// Also export the class for testing purposes
export default NutritionService;


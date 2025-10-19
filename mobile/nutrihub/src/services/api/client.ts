import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // For FormData, remove the default Content-Type to let axios handle it
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is due to an expired token and we haven't tried to refresh yet
        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            error.response?.data?.detail?.includes('expired')) {
          
          if (this.isRefreshing) {
            try {
              // Wait for the refresh to complete
              const token = await new Promise<string>((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
              });
              
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
          
          originalRequest._retry = true;
          this.isRefreshing = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const response = await axios.post(`${API_CONFIG.BASE_URL}/users/token/refresh/`, {
              refresh: refreshToken
            });
            
            if (response.data.access) {
              const newToken = response.data.access;
              await AsyncStorage.setItem('access_token', newToken);
              
              // Update auth header for original request
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Process queue
              this.processQueue(null, newToken);
              
              return this.axiosInstance(originalRequest);
            } else {
              // Unexpected response format
              return Promise.reject(new Error('Failed to refresh token'));
            }
          } catch (error) {
            // Failed to refresh token, clear tokens and reject queue
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            this.processQueue(error, null);
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // For FormData, don't set Content-Type manually to let axios handle the boundary
      if (data instanceof FormData && config?.headers?.['Content-Type']) {
        delete config.headers['Content-Type'];
      }
      
      const response = await this.axiosInstance.post<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }
}

export const apiClient = new ApiClient();
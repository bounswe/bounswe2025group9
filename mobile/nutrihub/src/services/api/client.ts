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
        
        // Network logging for debugging (only in development)
        if (__DEV__) {
          const method = config.method?.toUpperCase() || 'GET';
          const url = `${config.baseURL || ''}${config.url || ''}`;
          console.log(`🌐 [${method}] ${url}`, {
            headers: config.headers,
            params: config.params,
            data: config.data instanceof FormData ? '[FormData]' : config.data,
          });
        }
        
        return config;
      },
      (error) => {
        if (__DEV__) {
          console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Network logging for successful responses (only in development)
        if (__DEV__) {
          const method = response.config.method?.toUpperCase() || 'GET';
          const url = `${response.config.baseURL || ''}${response.config.url || ''}`;
          console.log(`✅ [${method}] ${url} - Status: ${response.status}`, {
            data: response.data,
            headers: response.headers,
          });
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        const shouldAttemptRefresh =
          !!originalRequest &&
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.isTokenInvalidResponse(error);
        
        // If the error is due to an expired/invalid token and we haven't tried to refresh yet
        if (shouldAttemptRefresh) {
          
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
        
        // Network logging for errors (only in development)
        if (__DEV__) {
          const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
          const url = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'Unknown URL';
          console.error(`❌ [${method}] ${url} - Error:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });
        }
        
        return Promise.reject(error);
      }
    );
  }

  private isTokenInvalidResponse(error: any): boolean {
    const detail = error?.response?.data?.detail;
    const code = error?.response?.data?.code;
    const detailText = typeof detail === 'string' ? detail.toLowerCase() : '';

    return (
      code === 'token_not_valid' ||
      detailText.includes('token has expired') ||
      detailText.includes('token is invalid or expired') ||
      detailText.includes('token is invalid') ||
      detailText.includes('given token not valid') ||
      detailText.includes('expired token') ||
      detailText.includes('signature has expired')
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
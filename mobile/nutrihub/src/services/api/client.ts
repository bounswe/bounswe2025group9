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
          console.log(`Adding auth token to request: ${config.url}`);
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log(`No auth token for request: ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = await AsyncStorage.getItem('refresh_token');

          if (refreshToken) {
            try {
              const response = await axios.post(`${API_CONFIG.BASE_URL}/users/token/refresh/`, {
                refresh: refreshToken
              });

              const { access } = response.data;
              await AsyncStorage.setItem('access_token', access);

              this.processQueue(null, access);

              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              this.processQueue(refreshError, null);
              // Clear tokens on refresh failure
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
              await AsyncStorage.removeItem('user_data');
              throw refreshError;
            } finally {
              this.isRefreshing = false;
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
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
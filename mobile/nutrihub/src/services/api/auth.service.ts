import { apiClient } from './client';
import { User, AuthTokens } from '../../types/types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
  address?: string;
  tags?: string[];
  allergens?: string[];
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface RegistrationResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/users/token/', credentials);
    if (response.error) {
      // Check for specific error messages from backend
      if (response.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error(response.error);
    }
    return response.data!;
  },

  async register(data: RegistrationData): Promise<RegistrationResponse> {
    const response = await apiClient.post<User>('/users/create/', data);
    if (response.error) {
      // Check for specific error messages
      if (response.status === 400) {
        // Parse validation errors
        if (response.error.includes('username')) {
          throw new Error('Username already exists');
        }
        if (response.error.includes('email')) {
          throw new Error('Email already exists');
        }
        throw new Error('Invalid registration data');
      }
      throw new Error(response.error);
    }
    return {
      success: true,
      message: 'Registration successful! Please login with your credentials.',
      user: response.data
    };
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/users/token/refresh/', {
      refresh: refreshToken
    });
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async logout(refreshToken: string): Promise<void> {
    const response = await apiClient.post('/users/token/logout/', {
      refresh: refreshToken
    });
    if (response.error) throw new Error(response.error);
  },

  async getUserProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile/');
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const formData = new FormData();
    formData.append('old_password', data.old_password);
    formData.append('new_password', data.new_password);
    
    const response = await apiClient.post('/users/change-password/', formData, config);
    if (response.error) {
      if (response.status === 400) {
        throw new Error('Current password is incorrect');
      }
      throw new Error(response.error);
    }
  },
};
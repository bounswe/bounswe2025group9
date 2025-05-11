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

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/users/token/', credentials);
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async register(data: RegistrationData): Promise<User> {
    const response = await apiClient.post<User>('/users/create/', data);
    if (response.error) throw new Error(response.error);
    return response.data!;
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
    const response = await apiClient.post('/users/change-password/', data);
    if (response.error) throw new Error(response.error);
  },

  // Note: There's no forgot password endpoint in the Postman collection
  // You'll need to implement this on the backend or remove this functionality
  async forgotPassword(email: string): Promise<void> {
    // This endpoint doesn't exist in the Postman collection
    // You can either implement it on the backend or handle it differently
    throw new Error('Password reset functionality not implemented');
  },
};
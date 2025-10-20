import { apiClient } from './client';
import { User } from '../../types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

export interface UploadPhotoResponse {
  profile_image: string; // URL returned by backend
}

export const userService = {
  async getUserByUsername(username: string): Promise<User> {
    // Flexible path: if backend differs, swap here only
    const response = await apiClient.get<User>(`/users/${encodeURIComponent(username)}/profile/`);
    if (response.error) throw new Error(response.error);
    
    // Convert relative profile_image URL to full URL
    if (response.data?.profile_image && !response.data.profile_image.startsWith('http')) {
      const baseUrl = 'https://nutrihub.fit'; // Use the base URL without /api
      response.data.profile_image = `${baseUrl}${response.data.profile_image}`;
    }
    
    return response.data!;
  },

  async getMyProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile/');
    if (response.error) throw new Error(response.error);
    
    // Convert relative profile_image URL to full URL
    if (response.data?.profile_image && !response.data.profile_image.startsWith('http')) {
      const baseUrl = 'https://nutrihub.fit'; // Use the base URL without /api
      response.data.profile_image = `${baseUrl}${response.data.profile_image}`;
    }
    
    return response.data!;
  },

  async uploadProfilePhoto(fileUri: string, fileName: string): Promise<UploadPhotoResponse> {
    // Get auth token
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create FormData
    const formData = new FormData();
    const file = {
      uri: fileUri,
      name: fileName,
      type: fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
    };
    
    formData.append('profile_image', file as any);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Convert relative URL to full URL
      if (data.profile_image && !data.profile_image.startsWith('http')) {
        const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
        data.profile_image = `${baseUrl}${data.profile_image}`;
      }
      
      return data as UploadPhotoResponse;
    } catch (error) {
      throw error;
    }
  },

  async removeProfilePhoto(): Promise<void> {
    const response = await apiClient.delete('/users/image/');
    if (response.error) throw new Error(response.error);
  },
};



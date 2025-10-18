import { apiClient } from './client';
import { User } from '../../types/types';

export interface UploadPhotoResponse {
  profilePhoto: string; // URL returned by backend
}

export const userService = {
  async getUserByUsername(username: string): Promise<User> {
    // Flexible path: if backend differs, swap here only
    const response = await apiClient.get<User>(`/users/${encodeURIComponent(username)}/profile/`);
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async getMyProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile/');
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async uploadProfilePhoto(fileUri: string, fileName: string): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append('photo', {
      // @ts-ignore React Native FormData file
      uri: fileUri,
      name: fileName,
      type: fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
    });

    const response = await apiClient.post<UploadPhotoResponse>('/users/profile/photo/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.error) throw new Error(response.error);
    return response.data!;
  },

  async removeProfilePhoto(): Promise<void> {
    const response = await apiClient.post('/users/profile/photo/remove/');
    if (response.error) throw new Error(response.error);
  },
};



import { apiClient } from './client';
import { User, ProfessionTag } from '../../types/types';
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

  // Profession Tags
  async getProfessionTags(): Promise<ProfessionTag[]> {
    console.log('Fetching profession tags from API...');
    const response = await apiClient.get<User>('/users/profile/');
    if (response.error) {
      console.error('API error:', response.error);
      throw new Error(response.error);
    }
    console.log('API response:', response.data);
    // Extract profession tags from user profile - the API returns 'tags' not 'profession_tags'
    const tags = response.data?.tags || [];
    console.log('Extracted profession tags:', tags);
    return tags;
  },

  async setProfessionTags(tags: { name: string; verified?: boolean }[]): Promise<ProfessionTag[]> {
    console.log('Setting profession tags:', tags);
    const response = await apiClient.post<ProfessionTag[]>('/users/tag/set/', tags);
    if (response.error) {
      console.error('API error setting tags:', response.error);
      throw new Error(response.error);
    }
    console.log('API response for set tags:', response.data);
    return response.data!;
  },

  async uploadCertificate(tagId: number, fileUri: string, fileName: string): Promise<ProfessionTag> {
    console.log('Uploading certificate for tag:', tagId, 'File:', fileName);
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
      type: fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
            fileName.toLowerCase().endsWith('.png') ? 'image/png' : 
            fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream',
    };
    
    formData.append('certificate', file as any);
    formData.append('tag_id', tagId.toString());

    try {
      console.log('Sending certificate upload request...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/certificate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Certificate upload failed:', response.status, errorText);
        throw new Error(`Certificate upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Certificate upload successful:', data);
      return data as ProfessionTag;
    } catch (error) {
      console.error('Certificate upload error:', error);
      throw error;
    }
  },

  // Get other user's profile with profession tags
  async getOtherUserProfile(username: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${encodeURIComponent(username)}/profile/`);
    if (response.error) throw new Error(response.error);
    
    // Convert relative profile_image URL to full URL
    if (response.data?.profile_image && !response.data.profile_image.startsWith('http')) {
      const baseUrl = 'https://nutrihub.fit';
      response.data.profile_image = `${baseUrl}${response.data.profile_image}`;
    }
    
    return response.data!;
  },

  async removeCertificate(tagId: number): Promise<ProfessionTag> {
    console.log('Removing certificate for tag:', tagId);
    // Get auth token
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log('Sending certificate removal request...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/certificate/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag_id: tagId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Certificate removal failed:', response.status, errorText);
        throw new Error(`Certificate removal failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Certificate removal successful:', data);
      return data as ProfessionTag;
    } catch (error) {
      console.error('Certificate removal error:', error);
      throw error;
    }
  },
};



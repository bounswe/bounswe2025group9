import { apiClient } from './client';
import { User, ProfessionTag, UserRecipeSummary } from '../../types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

export interface UploadPhotoResponse {
  profile_image: string;
}

const BASE_HOST = API_CONFIG.BASE_URL.replace('/api', '');

const ensureAbsoluteUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${BASE_HOST}${normalizedPath}`;
};

const normalizeProfessionTag = (tag: any): ProfessionTag => ({
  id: Number(tag?.id),
  name: String(tag?.name ?? ''),
  verified: Boolean(tag?.verified),
  certificate: ensureAbsoluteUrl(tag?.certificate) ?? null,
});

const normalizeRecipes = (recipes?: any[]): UserRecipeSummary[] => {
  if (!Array.isArray(recipes)) {
    return [];
  }

  return recipes
    .filter(recipe => recipe && typeof recipe.id !== 'undefined')
    .map((recipe) => ({
      id: Number(recipe.id),
      name: String(recipe.name ?? ''),
      ingredients: recipe.ingredients,
    }));
};

const normalizeUserProfile = (data: any): User => {
  const normalizedTags = Array.isArray(data?.tags)
    ? data.tags.map(normalizeProfessionTag)
    : [];

  const normalized: User = {
    ...(data || {}),
    id: Number(data?.id ?? 0),
    username: String(data?.username ?? ''),
    email: String(data?.email ?? ''),
    name: data?.name ?? undefined,
    surname: data?.surname ?? undefined,
    address: data?.address ?? undefined,
    profile_image: ensureAbsoluteUrl(data?.profile_image),
    tags: normalizedTags,
    profession_tags: normalizedTags,
    recipes: normalizeRecipes(data?.recipes),
    allergens: data?.allergens,
    followers_count: typeof data?.followers_count === 'number'
      ? data.followers_count
      : Array.isArray(data?.followers)
        ? data.followers.length
        : 0,
    following_count: typeof data?.following_count === 'number'
      ? data.following_count
      : Array.isArray(data?.following)
        ? data.following.length
        : 0,
    is_following: Boolean(data?.is_following),
  };

  return normalized;
};

const listUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<any[]>('/users/');
  if (response.error) {
    throw new Error(response.error);
  }

  const users = Array.isArray(response.data) ? response.data : [];
  return users.map(normalizeUserProfile);
};

const findUser = (
  users: User[],
  { username, userId }: { username?: string; userId?: number }
): User | undefined => {
  if (typeof userId === 'number') {
    const matchById = users.find((user) => user.id === userId);
    if (matchById) {
      return matchById;
    }
  }

  if (username) {
    const lowered = username.toLowerCase();
    return users.find((user) => user.username.toLowerCase() === lowered);
  }

  return undefined;
};

const normalizeUploadResponse = (data: any): UploadPhotoResponse => ({
  profile_image: ensureAbsoluteUrl(data?.profile_image) ?? '',
});

const normalizeTagResponse = (tag: any): ProfessionTag => normalizeProfessionTag(tag);

export const userService = {
  async getUserByUsername(username: string): Promise<User> {
    return this.getOtherUserProfile(username);
  },

  async getMyProfile(forceRefresh: boolean = false): Promise<User> {
    const url = forceRefresh ? `/users/profile/?_=${Date.now()}` : '/users/profile/';
    const response = await apiClient.get<any>(url);
    if (response.error) {
      throw new Error(response.error);
    }
    return normalizeUserProfile(response.data);
  },

  async uploadProfilePhoto(fileUri: string, fileName: string): Promise<UploadPhotoResponse> {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    const file = {
      uri: fileUri,
      name: fileName,
      type: fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
    };

    formData.append('profile_image', file as any);

    const response = await fetch(`${API_CONFIG.BASE_URL}/users/image/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return normalizeUploadResponse(data);
  },

  async removeProfilePhoto(): Promise<void> {
    const response = await apiClient.delete('/users/image/');
    if (response.error) {
      throw new Error(response.error);
    }
  },

  async getProfessionTags(): Promise<ProfessionTag[]> {
    const profile = await this.getMyProfile(true);
    return profile.tags || [];
  },

  async setProfessionTags(tags: { name: string; verified?: boolean }[]): Promise<ProfessionTag[]> {
    const response = await apiClient.post<any[]>('/users/tag/set/', tags);
    if (response.error) {
      throw new Error(response.error);
    }

    const updatedTags = Array.isArray(response.data) ? response.data : [];
    return updatedTags.map(normalizeTagResponse);
  },

  async uploadCertificate(tagId: number, fileUri: string, fileName: string): Promise<ProfessionTag> {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    const file = {
      uri: fileUri,
      name: fileName,
      type: fileName.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : fileName.toLowerCase().endsWith('.png')
          ? 'image/png'
          : fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : 'application/octet-stream',
    };

    formData.append('certificate', file as any);
    formData.append('tag_id', tagId.toString());

    const response = await fetch(`${API_CONFIG.BASE_URL}/users/certificate/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Certificate upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return normalizeTagResponse(data);
  },

  async getOtherUserProfile(username: string, userId?: number): Promise<User> {
    const users = await listUsers();
    const user = findUser(users, { username, userId });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  async removeCertificate(tagId: number): Promise<ProfessionTag> {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/users/certificate/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tag_id: tagId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Certificate removal failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return normalizeTagResponse(data);
  },

  /**
   * Follow or unfollow a user (toggle)
   * @param username - Username of the user to follow/unfollow
   * @returns Response message indicating success
   */
  async toggleFollow(username: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/users/follow/', { username });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data!;
  },

  /**
   * Get list of followers for a user
   * @param username - Username of the user
   * @returns Array of User objects representing followers
   */
  async getFollowers(username: string): Promise<User[]> {
    const response = await apiClient.get<any[]>(`/users/followers/${username}/`);
    if (response.error) {
      throw new Error(response.error);
    }
    const followers = Array.isArray(response.data) ? response.data : [];
    return followers.map(normalizeUserProfile);
  },

  /**
   * Get list of users that a user is following
   * @param username - Username of the user
   * @returns Array of User objects representing following
   */
  async getFollowing(username: string): Promise<User[]> {
    const response = await apiClient.get<any[]>(`/users/following/${username}/`);
    if (response.error) {
      throw new Error(response.error);
    }
    const following = Array.isArray(response.data) ? response.data : [];
    return following.map(normalizeUserProfile);
  },
};

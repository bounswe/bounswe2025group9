import { apiClient } from '../src/services/api/client';
import { userService } from '../src/services/api/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the API client
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('User Service - Follow Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleFollow', () => {
    test('should follow a user successfully', async () => {
      const mockResponse = {
        message: 'You are now following testuser.',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
      });

      const result = await userService.toggleFollow('testuser');

      expect(apiClient.post).toHaveBeenCalledWith('/users/follow/', { username: 'testuser' });
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('following');
    });

    test('should unfollow a user successfully', async () => {
      const mockResponse = {
        message: 'You unfollowed testuser.',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const result = await userService.toggleFollow('testuser');

      expect(apiClient.post).toHaveBeenCalledWith('/users/follow/', { username: 'testuser' });
      expect(result).toEqual(mockResponse);
      expect(result.message).toContain('unfollowed');
    });

    test('should throw error when API request fails', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'User not found',
        status: 404,
      });

      await expect(userService.toggleFollow('nonexistent')).rejects.toThrow('User not found');
    });

    test('should throw error when trying to follow self', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'You cannot follow yourself.',
        status: 400,
      });

      await expect(userService.toggleFollow('currentuser')).rejects.toThrow();
    });
  });

  describe('getFollowers', () => {
    const mockFollowers = [
      {
        id: 1,
        username: 'follower1',
        email: 'follower1@example.com',
        name: 'Follower',
        surname: 'One',
        profile_image: 'http://example.com/image1.jpg',
      },
      {
        id: 2,
        username: 'follower2',
        email: 'follower2@example.com',
        name: 'Follower',
        surname: 'Two',
        profile_image: null,
      },
    ];

    test('should return list of followers', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockFollowers,
        status: 200,
      });

      const result = await userService.getFollowers('testuser');

      expect(apiClient.get).toHaveBeenCalledWith('/users/followers/testuser/');
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('follower1');
      expect(result[0].id).toBe(1);
      expect(result[1].username).toBe('follower2');
    });

    test('should return empty array when user has no followers', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [],
        status: 200,
      });

      const result = await userService.getFollowers('newuser');

      expect(apiClient.get).toHaveBeenCalledWith('/users/followers/newuser/');
      expect(result).toEqual([]);
    });

    test('should throw error when user not found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'User not found',
        status: 404,
      });

      await expect(userService.getFollowers('nonexistent')).rejects.toThrow('User not found');
    });

    test('should normalize user profile data correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockFollowers,
        status: 200,
      });

      const result = await userService.getFollowers('testuser');

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('username');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('profile_image');
    });
  });

  describe('getFollowing', () => {
    const mockFollowing = [
      {
        id: 3,
        username: 'following1',
        email: 'following1@example.com',
        name: 'Following',
        surname: 'One',
        profile_image: 'http://example.com/image3.jpg',
      },
      {
        id: 4,
        username: 'following2',
        email: 'following2@example.com',
        name: 'Following',
        surname: 'Two',
        profile_image: null,
      },
    ];

    test('should return list of users being followed', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockFollowing,
        status: 200,
      });

      const result = await userService.getFollowing('testuser');

      expect(apiClient.get).toHaveBeenCalledWith('/users/following/testuser/');
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('following1');
      expect(result[0].id).toBe(3);
      expect(result[1].username).toBe('following2');
    });

    test('should return empty array when user follows no one', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: [],
        status: 200,
      });

      const result = await userService.getFollowing('lonelyuser');

      expect(apiClient.get).toHaveBeenCalledWith('/users/following/lonelyuser/');
      expect(result).toEqual([]);
    });

    test('should throw error when user not found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'User not found',
        status: 404,
      });

      await expect(userService.getFollowing('nonexistent')).rejects.toThrow('User not found');
    });

    test('should normalize user profile data correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockFollowing,
        status: 200,
      });

      const result = await userService.getFollowing('testuser');

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('username');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('profile_image');
    });
  });

  describe('uploadProfilePhoto', () => {
    const mockFileUri = 'file:///path/to/image.jpg';
    const mockFileName = 'profile.jpg';
    const mockAccessToken = 'mock-access-token';

    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockAccessToken);
    });

    test('should upload profile photo successfully and return URL', async () => {
      const mockResponse = {
        profile_image: 'http://example.com/media/profile_images/uuid123.jpg',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userService.uploadProfilePhoto(mockFileUri, mockFileName);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(global.fetch).toHaveBeenCalled();
      expect(result.profile_image).toBe(mockResponse.profile_image);
    });

    test('should handle PNG file type correctly', async () => {
      const mockResponse = {
        profile_image: 'http://example.com/media/profile_images/uuid123.png',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userService.uploadProfilePhoto(mockFileUri, 'profile.png');

      expect(result).toBeDefined();
      expect(result.profile_image).toBe(mockResponse.profile_image);
    });

    test('should throw error when no authentication token found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await expect(userService.uploadProfilePhoto(mockFileUri, mockFileName)).rejects.toThrow(
        'No authentication token found'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should throw error when upload fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(userService.uploadProfilePhoto(mockFileUri, mockFileName)).rejects.toThrow(
        'Upload failed: 400 - Bad request'
      );
    });

    test('should throw error when file is too large', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        text: async () => 'File size exceeds maximum allowed',
      });

      await expect(userService.uploadProfilePhoto(mockFileUri, mockFileName)).rejects.toThrow(
        'Upload failed: 413'
      );
    });

    test('should normalize relative URL to absolute URL', async () => {
      const mockResponse = {
        profile_image: '/media/profile_images/uuid123.jpg',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userService.uploadProfilePhoto(mockFileUri, mockFileName);

      expect(result.profile_image).toContain('http');
      expect(result.profile_image).toContain('/media/profile_images/uuid123.jpg');
    });
  });

  describe('removeProfilePhoto', () => {
    test('should remove profile photo successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        data: {},
        status: 200,
      });

      await userService.removeProfilePhoto();

      expect(apiClient.delete).toHaveBeenCalledWith('/users/image/');
    });

    test('should throw error when removal fails', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        error: 'No profile image to remove',
        status: 400,
      });

      await expect(userService.removeProfilePhoto()).rejects.toThrow('No profile image to remove');
    });
  });

  describe('getMyProfile', () => {
    const mockProfile = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      profile_image: 'http://example.com/media/profile_images/uuid123.jpg',
    };

    test('should fetch user profile successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockProfile,
        status: 200,
      });

      const result = await userService.getMyProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/users/profile/');
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
    });

    test('should force refresh profile with cache-busting parameter', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockProfile,
        status: 200,
      });

      await userService.getMyProfile(true);

      const callArgs = (apiClient.get as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('_=');
      expect(callArgs).toMatch(/\/users\/profile\/\?_=\d+/);
    });

    test('should throw error when profile fetch fails', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Unauthorized',
        status: 401,
      });

      await expect(userService.getMyProfile()).rejects.toThrow('Unauthorized');
    });
  });
});


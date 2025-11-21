import { apiClient } from '../src/services/api/client';
import { userService } from '../src/services/api/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the API client
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

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
});


import { apiClient } from '../src/services/api/client';
import { forumService } from '../src/services/api/forum.service';
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

describe('Forum Service - Feed Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock that user is logged in for all tests
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'access_token') {
        return Promise.resolve('mock-token');
      } else if (key === 'nutrihub_liked_posts') {
        return Promise.resolve(JSON.stringify([1, 3]));
      }
      return Promise.resolve(null);
    });
  });

  describe('getFeed', () => {
    const mockFeedPosts = [
      {
        id: 1,
        title: 'Post from followed user',
        body: 'This is a post from someone I follow',
        author: {
          id: 2,
          username: 'followeduser',
          profile_image: 'http://example.com/image.jpg',
          name: 'Followed',
          surname: 'User',
        },
        tags: [{ id: 1, name: 'Recipe' }],
        like_count: 10,
        comments_count: 3,
        is_liked: true,
        created_at: '2024-11-20T10:00:00Z',
        updated_at: '2024-11-20T10:30:00Z',
      },
      {
        id: 2,
        title: 'Liked post',
        body: 'This is a post I liked',
        author: {
          id: 3,
          username: 'otheruser',
          profile_image: null,
          name: 'Other',
          surname: 'User',
        },
        tags: [{ id: 2, name: 'Nutrition' }],
        like_count: 5,
        comments_count: 1,
        is_liked: true,
        created_at: '2024-11-19T15:00:00Z',
        updated_at: '2024-11-19T15:00:00Z',
      },
      {
        id: 3,
        title: 'Another followed post',
        body: 'Another post from followed user',
        author: {
          id: 2,
          username: 'followeduser',
          profile_image: 'http://example.com/image.jpg',
          name: 'Followed',
          surname: 'User',
        },
        tags: [{ id: 1, name: 'Recipe' }],
        like_count: 8,
        comments_count: 2,
        is_liked: false,
        created_at: '2024-11-18T12:00:00Z',
        updated_at: '2024-11-18T12:00:00Z',
      },
    ];

    test('should return feed posts on success', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 3,
          next: null,
          previous: null,
          results: mockFeedPosts,
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      expect(apiClient.get).toHaveBeenCalledWith('/users/feed/');
      expect(result.results).toHaveLength(3);
      expect(result.results[0].id).toBe(1);
      expect(result.results[0].title).toBe('Post from followed user');
      expect(result.results[0].author).toBe('followeduser');
      expect(result.results[0].authorId).toBe(2);
      expect(result.results[0].tags).toEqual(['Recipe']);
      expect(result.results[0].likesCount).toBe(10);
      expect(result.results[0].commentsCount).toBe(3);
      expect(result.results[0].createdAt).toBeInstanceOf(Date);
    });

    test('should preserve like status from AsyncStorage', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 3,
          next: null,
          previous: null,
          results: mockFeedPosts,
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      // Post 1 is in liked posts storage, so should be liked
      expect(result.results[0].isLiked).toBe(true);
      // Post 3 is in liked posts storage
      expect(result.results[2].isLiked).toBe(true);
    });

    test('should return empty array when feed is empty', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 0,
          next: null,
          previous: null,
          results: [],
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      expect(result.results).toEqual([]);
      expect(result.count).toBe(0);
    });

    test('should handle paginated feed response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 15,
          next: 'http://api/users/feed/?page=2',
          previous: null,
          results: mockFeedPosts,
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      expect(result.results).toHaveLength(3);
      expect(result.next).toBe('http://api/users/feed/?page=2');
    });

    test('should return empty array when user is not authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await forumService.getFeed();

      expect(result.results).toEqual([]);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    test('should throw error on authentication failure', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Authentication credentials were not provided',
        status: 401,
      });

      await expect(forumService.getFeed()).rejects.toThrow('Authentication error');
    });

    test('should throw error on server error', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Internal server error',
        status: 500,
      });

      await expect(forumService.getFeed()).rejects.toThrow('Internal server error');
    });

    test('should handle unexpected response format', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: null,
        status: 200,
      });

      await expect(forumService.getFeed()).rejects.toThrow('Unexpected API response format');
    });

    test('should map author display name correctly', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [mockFeedPosts[0]],
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      expect(result.results[0].authorDisplayName).toBe('Followed User');
      expect(result.results[0].authorProfileImage).toBe('http://example.com/image.jpg');
    });

    test('should handle author as string fallback', async () => {
      const postWithStringAuthor = {
        ...mockFeedPosts[0],
        author: 'followeduser', // String instead of object
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [postWithStringAuthor],
        },
        status: 200,
      });

      const result = await forumService.getFeed();

      expect(result.results[0].author).toBe('followeduser');
      expect(result.results[0].authorDisplayName).toBe('followeduser');
    });

    test('should append pagination params when provided', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 3,
          next: null,
          previous: null,
          results: mockFeedPosts,
        },
        status: 200,
      });

      await forumService.getFeed({ page: 2, page_size: 5 });

      expect(apiClient.get).toHaveBeenCalledWith('/users/feed/?page=2&page_size=5');
    });
  });
});


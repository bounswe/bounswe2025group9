import { apiClient } from '../src/services/api/client';
import { forumService, ApiForumTopic, ApiComment, CreatePostRequest } from '../src/services/api/forum.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the API client
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Forum Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock that user is logged in for all tests
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'access_token') {
        return Promise.resolve('mock-token');
      } else if (key === 'nutrihub_liked_posts') {
        return Promise.resolve(JSON.stringify([1]));
      }
      return Promise.resolve(null);
    });
  });

  describe('getPosts', () => {
    const mockApiTopics: ApiForumTopic[] = [
      {
        id: 1,
        title: 'Test Post 1',
        body: 'This is test post 1',
        author: 'testuser1',
        tags: [{ id: 1, name: 'test' }, { id: 2, name: 'example' }],
        like_count: 5,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      },
      {
        id: 2,
        title: 'Test Post 2',
        body: 'This is test post 2',
        author: 'testuser2',
        tags: [{ id: 1, name: 'test' }],
        like_count: 3,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      },
    ];

    test('should return mapped forum topics on success', async () => {
      // Mock successful response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 2,
          next: null,
          previous: null,
          results: mockApiTopics,
        },
        status: 200,
      });

      const result = await forumService.getPosts();

      expect(apiClient.get).toHaveBeenCalledWith('/forum/posts/');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('Test Post 1');
      expect(result[0].content).toBe('This is test post 1');
      expect(result[0].tags).toEqual(['test', 'example']);
      expect(result[0].likesCount).toBe(5);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    test('should include tag params in the request when provided', async () => {
      // Mock successful response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [mockApiTopics[0]],
        },
        status: 200,
      });

      await forumService.getPosts([1, 2]);

      expect(apiClient.get).toHaveBeenCalledWith('/forum/posts/?tags=1&tags=2');
    });

    test('should throw error when API request fails', async () => {
      // Mock error response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Failed to fetch posts',
        status: 500,
      });

      await expect(forumService.getPosts()).rejects.toThrow('Failed to fetch posts');
    });
  });

  describe('getPost', () => {
    const mockApiTopic: ApiForumTopic = {
      id: 1,
      title: 'Test Post',
      body: 'This is a test post',
      author: 'testuser',
      tags: [{ id: 1, name: 'test' }],
      like_count: 5,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    };

    const mockComments: ApiComment[] = [
      {
        id: 1,
        post: 1,
        body: 'This is a comment',
        author: 'commenter1',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
      },
      {
        id: 2,
        post: 1,
        body: 'This is another comment',
        author: 'commenter2',
        created_at: '2023-01-02T12:00:00Z',
        updated_at: '2023-01-02T12:00:00Z',
      },
    ];

    test('should return mapped forum topic with comments count', async () => {
      // Mock post response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockApiTopic,
        status: 200,
      });

      // Mock comments response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          count: 2,
          next: null,
          previous: null,
          results: mockComments,
        },
        status: 200,
      });

      const result = await forumService.getPost(1);

      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/forum/posts/1/');
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/forum/comments/?post=1');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Post');
      expect(result.commentsCount).toBe(2);
    });

    test('should throw error when post not found', async () => {
      // Mock error response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Post not found',
        status: 404,
      });

      await expect(forumService.getPost(999)).rejects.toThrow('Post not found');
    });
  });

  describe('createPost', () => {
    const createPostData: CreatePostRequest = {
      title: 'New Post',
      body: 'This is a new post',
      tag_ids: [1, 2],
    };

    const mockApiResponse: ApiForumTopic = {
      id: 3,
      title: 'New Post',
      body: 'This is a new post',
      author: 'testuser',
      tags: [{ id: 1, name: 'test' }, { id: 2, name: 'example' }],
      like_count: 0,
      created_at: '2023-01-05T00:00:00Z',
      updated_at: '2023-01-05T00:00:00Z',
    };

    test('should return newly created post', async () => {
      // Mock successful response
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockApiResponse,
        status: 201,
      });

      const result = await forumService.createPost(createPostData);

      expect(apiClient.post).toHaveBeenCalledWith('/forum/posts/', createPostData);
      expect(result.id).toBe(3);
      expect(result.title).toBe('New Post');
      expect(result.content).toBe('This is a new post');
      expect(result.tags).toEqual(['test', 'example']);
    });

    test('should throw error when creation fails', async () => {
      // Mock error response
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'Validation error',
        status: 400,
      });

      await expect(forumService.createPost(createPostData)).rejects.toThrow('Validation error');
    });
  });
}); 
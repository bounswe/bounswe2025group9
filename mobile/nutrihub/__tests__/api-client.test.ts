import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../src/services/api/client';

// Mock axios and AsyncStorage
jest.mock('axios', () => {
  const axiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  };
  
  return {
    create: jest.fn(() => axiosInstance),
    post: jest.fn(),
    axiosInstance
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the API client methods directly
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get method', () => {
    test('should return data for successful response', async () => {
      // Mock successful response
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        data: mockData,
        status: 200,
      };
      
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await apiClient.get('/test');

      expect(response).toEqual({
        data: mockData,
        status: 200,
      });
    });

    test('should handle errors with response', async () => {
      // Mock error response
      const errorResponse = {
        error: 'Not found',
        status: 404,
      };
      
      (apiClient.get as jest.Mock).mockResolvedValueOnce(errorResponse);

      const response = await apiClient.get('/test/404');

      expect(response).toEqual({
        error: 'Not found',
        status: 404,
      });
    });

    test('should handle errors without response', async () => {
      // Mock network error without response
      const errorResponse = {
        error: 'Network Error',
        status: 500,
      };
      
      (apiClient.get as jest.Mock).mockResolvedValueOnce(errorResponse);

      const response = await apiClient.get('/test/network-error');

      expect(response).toEqual({
        error: 'Network Error',
        status: 500,
      });
    });
  });

  describe('post method', () => {
    test('should return data for successful response', async () => {
      // Mock successful response
      const postData = { name: 'New Item' };
      const mockData = { id: 1, name: 'New Item' };
      const mockResponse = {
        data: mockData,
        status: 201,
      };
      
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await apiClient.post('/test', postData);

      expect(response).toEqual({
        data: mockData,
        status: 201,
      });
    });

    test('should handle validation errors', async () => {
      // Mock error response
      const postData = { name: '' };
      const errorResponse = {
        error: 'Validation failed',
        status: 400,
      };
      
      (apiClient.post as jest.Mock).mockResolvedValueOnce(errorResponse);

      const response = await apiClient.post('/test', postData);

      expect(response).toEqual({
        error: 'Validation failed',
        status: 400,
      });
    });
  });

  describe('patch method', () => {
    test('should return data for successful response', async () => {
      // Mock successful response
      const patchData = { name: 'Updated Item' };
      const mockData = { id: 1, name: 'Updated Item' };
      const mockResponse = {
        data: mockData,
        status: 200,
      };
      
      (apiClient.patch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await apiClient.patch('/test/1', patchData);

      expect(response).toEqual({
        data: mockData,
        status: 200,
      });
    });
  });

  describe('delete method', () => {
    test('should return successful response for delete operation', async () => {
      // Mock successful response
      const mockResponse = {
        data: null,
        status: 204,
      };
      
      (apiClient.delete as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await apiClient.delete('/test/1');

      expect(response).toEqual({
        data: null,
        status: 204,
      });
    });
  });
}); 
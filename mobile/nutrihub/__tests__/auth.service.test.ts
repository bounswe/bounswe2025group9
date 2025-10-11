import { apiClient } from '../src/services/api/client';
import { authService, LoginCredentials, RegistrationData } from '../src/services/api/auth.service';

// Mock the API client
jest.mock('../src/services/api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials: LoginCredentials = {
      username: 'testuser',
      password: 'password123',
    };

    const mockTokenResponse = {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
    };

    test('should return token response on successful login', async () => {
      // Mock successful response
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockTokenResponse,
        status: 200,
      });

      const result = await authService.login(mockCredentials);

      expect(apiClient.post).toHaveBeenCalledWith('/users/token/', mockCredentials);
      expect(result).toEqual(mockTokenResponse);
    });

    test('should throw error on invalid credentials', async () => {
      // Mock error response
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'Invalid credentials',
        status: 401,
      });

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid username or password');
      expect(apiClient.post).toHaveBeenCalledWith('/users/token/', mockCredentials);
    });

    test('should throw general error on other API failures', async () => {
      // Mock general error
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'Server error',
        status: 500,
      });

      await expect(authService.login(mockCredentials)).rejects.toThrow('Server error');
      expect(apiClient.post).toHaveBeenCalledWith('/users/token/', mockCredentials);
    });
  });

  describe('register', () => {
    const mockRegistrationData: RegistrationData = {
      username: 'newuser',
      password: 'password123',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
    };

    const mockUserResponse = {
      id: 1,
      username: 'newuser',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
    };

    test('should return success response on successful registration', async () => {
      // Mock successful response
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockUserResponse,
        status: 201,
      });

      const result = await authService.register(mockRegistrationData);

      expect(apiClient.post).toHaveBeenCalledWith('/users/create/', mockRegistrationData);
      expect(result).toEqual({
        success: true,
        message: 'Registration successful! Please login with your credentials.',
        user: mockUserResponse,
      });
    });

    test('should throw error on username already exists', async () => {
      // Make sure the error message includes the word 'username'
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'A user with that username already exists.',
        status: 400,
      });

      await expect(authService.register(mockRegistrationData)).rejects.toThrow('Username already exists');
      expect(apiClient.post).toHaveBeenCalledWith('/users/create/', mockRegistrationData);
    });
    
    test('should throw error on email already exists', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'A user with that email already exists.',
        status: 400,
      });

      await expect(authService.register(mockRegistrationData)).rejects.toThrow('Email already exists');
      expect(apiClient.post).toHaveBeenCalledWith('/users/create/', mockRegistrationData);
    });
    
    test('should throw general validation error for other 400 errors', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        error: 'Validation failed',
        status: 400,
      });

      await expect(authService.register(mockRegistrationData)).rejects.toThrow('Invalid registration data');
      expect(apiClient.post).toHaveBeenCalledWith('/users/create/', mockRegistrationData);
    });
  });

  describe('getUserProfile', () => {
    const mockUserProfile = {
      id: 1,
      username: 'testuser',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
    };

    test('should return user profile on successful request', async () => {
      // Mock successful response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockUserProfile,
        status: 200,
      });

      const result = await authService.getUserProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/users/profile/');
      expect(result).toEqual(mockUserProfile);
    });

    test('should throw error on failed request', async () => {
      // Mock error response
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        error: 'Unauthorized',
        status: 401,
      });

      await expect(authService.getUserProfile()).rejects.toThrow('Unauthorized');
      expect(apiClient.get).toHaveBeenCalledWith('/users/profile/');
    });
  });
}); 
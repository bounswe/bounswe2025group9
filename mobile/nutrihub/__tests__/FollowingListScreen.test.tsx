import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import FollowingListScreen from '../src/screens/user/FollowingListScreen';
import { userService } from '../src/services/api/user.service';
import { useAuth } from '../src/context/AuthContext';

// Mock dependencies
jest.mock('../src/services/api/user.service');
jest.mock('../src/context/AuthContext');
jest.mock('@expo/vector-icons', () => {
  const { View, Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, size, color, testID }: any) => (
      <View testID={testID || `icon-${name}`}>
        <Text>{name}</Text>
      </View>
    ),
  };
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: { username: 'testuser' },
  })),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View testID="safe-area-view">{children}</View>
    ),
  };
});

jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#0066CC',
      error: '#FF0000',
      buttonText: '#FFFFFF',
      surface: '#F5F5F5',
      border: '#E0E0E0',
    },
    textStyles: {
      h2: { fontSize: 20, fontWeight: '600' },
      h3: { fontSize: 18 },
      body: { fontSize: 16 },
      caption: { fontSize: 14 },
      buttonText: { fontSize: 16 },
      subtitle: { fontSize: 16 },
    },
  }),
}));

describe('FollowingListScreen', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
  };

  const mockFollowing = [
    {
      id: 4,
      username: 'following1',
      name: 'Following',
      surname: 'One',
      email: 'following1@example.com',
      profile_image: 'http://example.com/image4.jpg',
    },
    {
      id: 5,
      username: 'following2',
      name: 'Following',
      surname: 'Two',
      email: 'following2@example.com',
      profile_image: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  test('renders following list successfully', async () => {
    (userService.getFollowing as jest.Mock).mockResolvedValueOnce(mockFollowing);

    const { getByText } = render(<FollowingListScreen />);

    await waitFor(() => {
      expect(getByText('Following')).toBeTruthy();
      expect(getByText('Following One')).toBeTruthy();
      expect(getByText('@following1')).toBeTruthy();
      expect(getByText('Following Two')).toBeTruthy();
      expect(getByText('@following2')).toBeTruthy();
    });
  });

  test('displays empty state when not following anyone', async () => {
    (userService.getFollowing as jest.Mock).mockResolvedValueOnce([]);

    const { getByText } = render(<FollowingListScreen />);

    await waitFor(() => {
      expect(getByText('Not Following Anyone')).toBeTruthy();
      expect(getByText(/is not following anyone yet/)).toBeTruthy();
    });
  });

  test('displays error state on API failure', async () => {
    (userService.getFollowing as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<FollowingListScreen />);

    await waitFor(() => {
      expect(getByText(/Failed to load following/)).toBeTruthy();
    });
  });

  test('navigates to user profile on following tap', async () => {
    const mockPush = jest.fn();
    require('@react-navigation/native').useNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: mockPush,
    });

    (userService.getFollowing as jest.Mock).mockResolvedValueOnce(mockFollowing);

    const { getByText } = render(<FollowingListScreen />);

    await waitFor(() => {
      expect(getByText('Following One')).toBeTruthy();
    });

    fireEvent.press(getByText('Following One'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('UserProfile', {
        username: 'following1',
        userId: 4,
      });
    });
  });

  test('shows loading state initially', () => {
    (userService.getFollowing as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<FollowingListScreen />);

    expect(getByTestId('safe-area-view')).toBeTruthy();
  });

  test('handles retry on error', async () => {
    (userService.getFollowing as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockFollowing);

    const { getByText } = render(<FollowingListScreen />);

    await waitFor(() => {
      expect(getByText(/Failed to load following/)).toBeTruthy();
    });

    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(userService.getFollowing).toHaveBeenCalledTimes(2);
    });
  });
});


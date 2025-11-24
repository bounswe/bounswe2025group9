import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import FollowersListScreen from '../src/screens/user/FollowersListScreen';
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

describe('FollowersListScreen', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
  };

  const mockFollowers = [
    {
      id: 2,
      username: 'follower1',
      name: 'Follower',
      surname: 'One',
      email: 'follower1@example.com',
      profile_image: 'http://example.com/image1.jpg',
    },
    {
      id: 3,
      username: 'follower2',
      name: 'Follower',
      surname: 'Two',
      email: 'follower2@example.com',
      profile_image: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  test('renders followers list successfully', async () => {
    (userService.getFollowers as jest.Mock).mockResolvedValueOnce(mockFollowers);

    const { getByText } = render(<FollowersListScreen />);

    await waitFor(() => {
      expect(getByText('Followers')).toBeTruthy();
      expect(getByText('Follower One')).toBeTruthy();
      expect(getByText('@follower1')).toBeTruthy();
      expect(getByText('Follower Two')).toBeTruthy();
      expect(getByText('@follower2')).toBeTruthy();
    });
  });

  test('displays empty state when no followers', async () => {
    (userService.getFollowers as jest.Mock).mockResolvedValueOnce([]);

    const { getByText } = render(<FollowersListScreen />);

    await waitFor(() => {
      expect(getByText('No Followers Yet')).toBeTruthy();
      expect(getByText(/doesn't have any followers yet/)).toBeTruthy();
    });
  });

  test('displays error state on API failure', async () => {
    (userService.getFollowers as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<FollowersListScreen />);

    await waitFor(() => {
      expect(getByText(/Failed to load followers/)).toBeTruthy();
    });
  });

  test('navigates to user profile on follower tap', async () => {
    const mockPush = jest.fn();
    require('@react-navigation/native').useNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: mockPush,
    });

    (userService.getFollowers as jest.Mock).mockResolvedValueOnce(mockFollowers);

    const { getByText } = render(<FollowersListScreen />);

    await waitFor(() => {
      expect(getByText('Follower One')).toBeTruthy();
    });

    fireEvent.press(getByText('Follower One'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('UserProfile', {
        username: 'follower1',
        userId: 2,
      });
    });
  });

  test('shows loading state initially', () => {
    (userService.getFollowers as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(<FollowersListScreen />);

    expect(getByTestId('safe-area-view')).toBeTruthy();
  });

  test('handles retry on error', async () => {
    (userService.getFollowers as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockFollowers);

    const { getByText } = render(<FollowersListScreen />);

    await waitFor(() => {
      expect(getByText(/Failed to load followers/)).toBeTruthy();
    });

    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(userService.getFollowers).toHaveBeenCalledTimes(2);
    });
  });
});


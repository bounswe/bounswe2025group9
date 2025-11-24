/**
 * HomeScreen Tests
 * 
 * Tests for the HomeScreen component that displays the user's feed
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
  useFocusEffect: jest.fn((callback) => {
    // Don't call callback immediately to avoid infinite loops in tests
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style: any }) => (
      <View style={style} testID="safe-area-view">
        {children}
      </View>
    ),
  };
});

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) => (
      <Text testID={`icon-${name}`}>{name}</Text>
    ),
  };
});

// Mock ThemeContext
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#0066CC',
      buttonText: '#FFFFFF',
    },
    textStyles: {
      heading2: { fontSize: 20, fontWeight: 'bold' },
      heading3: { fontSize: 18, fontWeight: 'bold' },
      body: { fontSize: 16 },
      buttonText: { fontSize: 16, fontWeight: '600' },
    },
  }),
}));

// Mock AuthContext
const mockUseAuth = jest.fn(() => ({
  user: {
    name: 'John',
    surname: 'Doe',
    username: 'johndoe',
  },
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ForumPost component
jest.mock('../src/components/forum/ForumPost', () => {
  const { View, Text } = require('react-native');
  return function MockForumPost({ post }: { post: any }) {
    return (
      <View testID={`forum-post-${post.id}`}>
        <Text>{post.title || post.content}</Text>
      </View>
    );
  };
});

// Mock forum service
const mockGetFeed = jest.fn(() => Promise.resolve([]));
const mockToggleLike = jest.fn(() => Promise.resolve(false));

jest.mock('../src/services/api/forum.service', () => ({
  forumService: {
    getFeed: () => mockGetFeed(),
    toggleLike: () => mockToggleLike(),
  },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        name: 'John',
        surname: 'Doe',
        username: 'johndoe',
      },
    });
    mockGetFeed.mockResolvedValue([]);
  });

  it('renders feed header when user is logged in', async () => {
    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Your NutriFeed')).toBeTruthy();
    });
  });

  it('renders welcome message when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });
    
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Welcome to NutriHub')).toBeTruthy();
    expect(getByText('Please log in to see your personalized NutriFeed')).toBeTruthy();
  });

  it('renders empty feed message when user is logged in but has no posts', async () => {
    mockGetFeed.mockResolvedValue([]);
    
    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Your NutriFeed is Empty')).toBeTruthy();
      expect(getByText('Follow users and like posts to see them here!')).toBeTruthy();
    });
  });

  it('renders posts when feed has data', async () => {
    const mockPosts = [
      { id: 1, title: 'Test Post 1', content: 'Content 1', author: 'user1', authorId: 1, likesCount: 5, isLiked: false },
      { id: 2, title: 'Test Post 2', content: 'Content 2', author: 'user2', authorId: 2, likesCount: 10, isLiked: true },
    ];
    
    mockGetFeed.mockResolvedValue(mockPosts);
    
    const { getByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByTestId('forum-post-1')).toBeTruthy();
      expect(getByTestId('forum-post-2')).toBeTruthy();
    });
  });

  it('calls getFeed when user is logged in', async () => {
    render(<HomeScreen />);
    
    await waitFor(() => {
      expect(mockGetFeed).toHaveBeenCalled();
    });
  });

  it('does not call getFeed when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });
    
    render(<HomeScreen />);
    
    // getFeed should not be called for non-logged-in users
    expect(mockGetFeed).not.toHaveBeenCalled();
  });
});


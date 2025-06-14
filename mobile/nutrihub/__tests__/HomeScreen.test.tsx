import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';
import * as NavigationHooks from '@react-navigation/native';
import { View, Text, TouchableOpacity } from 'react-native';

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

// Mock the SafeAreaView component
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

// Mock the ThemeContext hook
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#0066CC',
      secondary: '#4D88FF',
    },
    textStyles: {
      heading1: { fontSize: 24, fontWeight: 'bold' },
      body: { fontSize: 16 },
    },
  }),
}));

// Mock the AuthContext hook with a default user
jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      name: 'John',
      surname: 'Doe',
      username: 'johndoe',
    },
  })),
}));

// Mock the Button component
jest.mock('../src/components/common/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return function MockButton({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        testID={testID || `button-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  };
});

// Mock the FeatureCard component
jest.mock('../src/components/common/FeatureCard', () => {
  const { View, Text } = require('react-native');
  return function MockFeatureCard({ title, description, iconName }: { title: string; description: string; iconName: string }) {
    return (
      <View testID={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    );
  };
});

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders welcome message with user name', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Welcome, John Doe to NutriHub')).toBeTruthy();
  });

  test('renders feature cards', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    expect(getByTestId('feature-track-nutrition')).toBeTruthy();
    expect(getByTestId('feature-share-recipes')).toBeTruthy();
    expect(getByTestId('feature-get-support')).toBeTruthy();
  });

  test('navigates to Food screen when Explore Foods button is pressed', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(NavigationHooks, 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    } as any);
    
    const { getByTestId } = render(<HomeScreen />);
    const exploreButton = getByTestId('button-explore-foods');
    
    fireEvent.press(exploreButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('Food');
  });

  test('navigates to Forum screen when Join Forum button is pressed', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(NavigationHooks, 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    } as any);
    
    const { getByTestId } = render(<HomeScreen />);
    const forumButton = getByTestId('button-join-forum');
    
    fireEvent.press(forumButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('Forum');
  });

  test('displays generic welcome when user is not logged in', () => {
    // Mock the useAuth hook to return null user for this test
    jest.spyOn(require('../src/context/AuthContext'), 'useAuth').mockReturnValue({
      user: null,
    });
    
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Welcome to NutriHub')).toBeTruthy();
  });
}); 
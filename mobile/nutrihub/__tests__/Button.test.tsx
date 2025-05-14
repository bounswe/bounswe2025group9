import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../src/components/common/Button';
import { View } from 'react-native';

// Mock the ThemeContext hook
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#0066CC',
      secondary: '#4D88FF',
      border: '#E1E1E1',
      error: '#FF3B30',
      success: '#34C759',
      text: '#000000',
      textSecondary: '#8E8E93',
    },
    themeType: 'light',
    textStyles: {
      body: { fontSize: 14 },
      button: { fontSize: 16, fontWeight: 'bold' },
    },
  }),
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: { name: string; size: number; color: string; style?: any; children?: React.ReactNode }) => (
      <View testID={`icon-${props.name}`}>{props.children}</View>
    ),
  };
});

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  test('renders correctly with default props', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    const buttonElement = getByText('Test Button');
    expect(buttonElement).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    const buttonElement = getByText('Test Button');
    fireEvent.press(buttonElement);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    const buttonElement = getByText('Test Button');
    fireEvent.press(buttonElement);
    
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  test('renders with loading indicator when loading is true', () => {
    const { getByTestId, queryByText } = render(
      <Button 
        title="Test Button" 
        onPress={mockOnPress} 
        loading 
        testID="loading-button"
      />
    );
    
    // There should be a loading indicator
    const buttonElement = getByTestId('loading-button');
    expect(buttonElement).toBeTruthy();
    
    // Text should not be visible when loading
    const buttonText = queryByText('Test Button');
    expect(buttonText).toBeNull();
  });

  test('renders with different variants', () => {
    const { getByTestId: getPrimary } = render(
      <Button 
        title="Primary" 
        onPress={mockOnPress} 
        variant="primary" 
        testID="primary-button"
      />
    );
    
    const { getByTestId: getSecondary } = render(
      <Button 
        title="Secondary" 
        onPress={mockOnPress} 
        variant="secondary" 
        testID="secondary-button"
      />
    );
    
    const { getByTestId: getOutline } = render(
      <Button 
        title="Outline" 
        onPress={mockOnPress} 
        variant="outline" 
        testID="outline-button"
      />
    );
    
    expect(getPrimary('primary-button')).toBeTruthy();
    expect(getSecondary('secondary-button')).toBeTruthy();
    expect(getOutline('outline-button')).toBeTruthy();
  });
}); 
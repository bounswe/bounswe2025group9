import '@testing-library/jest-native/extend-expect';

// Mock for expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => 'StatusBar',
}));

// Mock for AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock for react-navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock for expo-font
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

// Mock for Expo Vector Icons
jest.mock('@expo/vector-icons', () => {
  const View = function(props) {
    return {
      ...props,
      type: 'View',
    };
  };
  
  const MaterialCommunityIcons = function(props) {
    return {
      type: 'MaterialCommunityIcons',
      ...props,
    };
  };
  
  MaterialCommunityIcons.font = {
    glyphMap: {},
  };
  
  return {
    MaterialCommunityIcons,
    createIconSet: () => ({
      font: {},
      isLoaded: jest.fn(() => true),
    }),
  };
}); 
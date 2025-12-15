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

// Global mock for LanguageContext (i18n)
// Many components call useLanguage() directly; tests should not need a real provider.
jest.mock('./src/context/LanguageContext', () => {
  const mockEnUS = require('./src/i18n/locales/en-US.json');

  const mockGetByPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  };

  const mockInterpolate = (template, options) => {
    if (!options) return template;
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
      const value = options[key.trim()];
      return value === undefined || value === null ? '' : String(value);
    });
  };

  return {
    useLanguage: () => ({
      currentLanguage: 'en-US',
      isRTL: false,
      changeLanguage: jest.fn(),
      t: (key, options) => {
        const value = mockGetByPath(mockEnUS, key);
        if (typeof value === 'string') return mockInterpolate(value, options);
        // basic plural fallback used in a couple places
        if (options && typeof options.count === 'number') {
          return options.count === 1 ? 'item' : 'items';
        }
        return key;
      },
    }),
  };
});
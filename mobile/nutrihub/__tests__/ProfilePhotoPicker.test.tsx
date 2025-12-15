/**
 * ProfilePhotoPicker Tests
 *
 * Tests for i18n-driven action button labels (Upload/Change/Uploading/Remove)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ProfilePhotoPicker from '../src/components/user/ProfilePhotoPicker';

// Mock ThemeContext
jest.mock('../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#3b82f6',
      placeholder: '#f0f0f0',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
    },
    textStyles: {
      caption: { fontSize: 12 },
      small: { fontSize: 10 },
    },
  }),
}));

// Mock LanguageContext (i18n)
jest.mock('../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'profile.uploadPhoto': 'Upload Photo',
        'profile.changePhoto': 'Change Photo',
        'common.uploading': 'Uploading...',
        'common.remove': 'Remove',
      };
      return dict[key] ?? key;
    },
  }),
}));

// Mock expo modules used by the component
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
}));

// Mock icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MockIcon',
}));

describe('ProfilePhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Upload Photo when no uri provided', () => {
    const { getByText, queryByText } = render(
      <ProfilePhotoPicker
        uri={null}
        uploading={false}
        onUploaded={jest.fn()}
        onRemoved={jest.fn()}
      />
    );

    expect(getByText('Upload Photo')).toBeTruthy();
    expect(queryByText('Remove')).toBeNull();
  });

  it('shows Change Photo and Remove when uri exists', () => {
    const { getByText } = render(
      <ProfilePhotoPicker
        uri={'https://example.com/photo.jpg'}
        uploading={false}
        onUploaded={jest.fn()}
        onRemoved={jest.fn()}
      />
    );

    expect(getByText('Change Photo')).toBeTruthy();
    expect(getByText('Remove')).toBeTruthy();
  });

  it('shows Uploading when uploading=true', () => {
    const { getByText } = render(
      <ProfilePhotoPicker
        uri={'https://example.com/photo.jpg'}
        uploading={true}
        onUploaded={jest.fn()}
        onRemoved={jest.fn()}
      />
    );

    expect(getByText('Uploading...')).toBeTruthy();
  });
});



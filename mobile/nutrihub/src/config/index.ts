import Constants from 'expo-constants';

export const API_CONFIG = {
  BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || 'https://nutrihub.fit/api',
  TIMEOUT: 10000,
};

// src/config/index.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://164.92.234.228/api'  // development url without https
    : 'https://nutrihub.fit/api',  // production
  TIMEOUT: 10000,
};
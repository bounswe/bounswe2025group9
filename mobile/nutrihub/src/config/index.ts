// src/config/index.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://164.92.234.228/api'  // Development, ADD PUBLIC IP HERE!
    : 'http://164.92.234.228/api',  // Production
  TIMEOUT: 10000,
};
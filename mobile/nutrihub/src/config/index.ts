// src/config/index.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://127.0.0.1:8081/'  // Development 
    : 'https://api.nutrihub.com',  // Production
  TIMEOUT: 10000,
};
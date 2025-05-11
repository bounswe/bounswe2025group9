// src/config/index.ts
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? ''  // Development, ADD PUBLIC IP HERE!
    : 'https://api.nutrihub.com',  // Production
  TIMEOUT: 10000,
};
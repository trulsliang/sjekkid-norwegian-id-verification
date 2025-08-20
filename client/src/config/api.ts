import { getHardcodedApiUrl } from './api-hardcoded';

// API Configuration for mobile and web deployment
const getApiBaseUrl = (): string => {
  // Since Vite environment variables aren't working properly for APK builds,
  // we'll use the hardcoded configuration approach
  return getHardcodedApiUrl();
};

export const API_BASE_URL = getApiBaseUrl();

export const createApiUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
};
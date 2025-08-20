// API Configuration for mobile and web deployment
const getApiBaseUrl = (): string => {
  // Check if we're running in a Capacitor app (mobile)
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCapacitor) {
    // For mobile APK, use your deployed server URL
    // Replace this with your actual deployed server URL
    const deployedServerUrl = import.meta.env.VITE_API_URL || 'https://your-deployed-server.replit.app';
    return deployedServerUrl;
  }
  
  // For web deployment, use relative URLs (same origin)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const createApiUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
};
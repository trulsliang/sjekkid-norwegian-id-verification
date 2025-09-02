// Hardcoded API configuration that definitely works for APK builds
// This bypasses Vite's environment variable system which isn't working properly

// Since Vite isn't properly including environment variables, we'll use a different approach
const MOBILE_API_CONFIG = {
  // Use your actual deployed server URL
  DEFAULT_API_URL: 'https://sto-identifier-trulsliang.replit.app',
  // For local testing - use the actual environment variable if available
  LOCAL_API_URL: 'https://sto-identifier-trulsliang.replit.app'
};

console.log('Hardcoded API config loaded:', MOBILE_API_CONFIG);

export const getHardcodedApiUrl = (): string => {
  // Check if we're in mobile environment
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isFile = window.location.protocol === 'file:';
  const isMobileApp = isCapacitor || (isAndroid && isFile) || window.location.href.includes('capacitor://');
  
  console.log('Mobile detection:', { isCapacitor, isAndroid, isFile, isMobileApp });
  console.log('Current location:', window.location.href);
  console.log('User agent:', navigator.userAgent);
  
  if (isMobileApp) {
    // Always use the deployed URL for mobile
    const apiUrl = MOBILE_API_CONFIG.DEFAULT_API_URL;
    
    console.log('✅ Using mobile API URL:', apiUrl);
    return apiUrl;
  }
  
  // For web, use relative URLs
  console.log('Using relative URLs for web');
  return '';
};
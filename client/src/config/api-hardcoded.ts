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
    
    console.log('Using mobile API URL:', apiUrl);
    
    // Validate that we have a proper URL (check for actual placeholder values)
    const isValidUrl = apiUrl && 
                      !apiUrl.includes('REPLACE_WITH_DEPLOYED_URL') && 
                      !apiUrl.includes('your-deployed-server') &&
                      apiUrl.startsWith('http');
    
    if (!isValidUrl) {
      console.error('❌ Mobile API URL not properly configured!');
      console.error('Current API URL:', apiUrl);
      
      // Show error to user
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff4444;
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 9999;
        font-family: sans-serif;
        font-size: 14px;
      `;
      errorDiv.innerHTML = `
        ⚠️ Mobile API Configuration Error<br>
        API URL: ${apiUrl}<br>
        Contact support for APK configuration
      `;
      
      // Remove any existing error divs
      const existingError = document.querySelector('[data-error="mobile-api"]');
      if (existingError) existingError.remove();
      
      errorDiv.setAttribute('data-error', 'mobile-api');
      document.body.appendChild(errorDiv);
      
      // Still return the URL, but it will likely fail
      return apiUrl;
    }
    
    console.log('✅ Mobile API URL configured successfully:', apiUrl);
    return apiUrl;
  }
  
  // For web, use relative URLs
  console.log('Using relative URLs for web');
  return '';
};
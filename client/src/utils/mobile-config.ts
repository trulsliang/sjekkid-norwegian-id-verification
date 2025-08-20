// Mobile configuration utility for APK builds
export const setupMobileConfig = () => {
  // This runs early in the app lifecycle to set up mobile-specific configuration
  
  // Check if we're in a mobile environment
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isFile = window.location.protocol === 'file:';
  const isMobileApp = isCapacitor || (isAndroid && isFile) || window.location.href.includes('capacitor://');
  
  console.log('🔧 Mobile Config Setup:', {
    isCapacitor,
    isAndroid,
    isFile,
    isMobileApp,
    protocol: window.location.protocol,
    host: window.location.host,
    href: window.location.href,
    userAgent: navigator.userAgent
  });
  
  if (isMobileApp) {
    console.log('📱 Detected mobile app environment');
    
    // The hardcoded config should handle the URL now
    // This is just for additional validation
    const hardcodedUrl = 'https://sto-identifier-trulsliang.replit.app';
    
    console.log('✅ Mobile configuration complete');
    console.log('🌐 API URL will be:', hardcodedUrl);
    
    // Store for debugging
    (window as any).__MOBILE_DEBUG__ = {
      isCapacitor,
      isAndroid,
      isFile,
      isMobileApp,
      apiUrl: hardcodedUrl,
      timestamp: new Date().toISOString()
    };
  }
};

export const getMobileApiUrl = (): string | null => {
  const apiUrl = import.meta.env.VITE_API_URL || 
               (window as any).__VITE_API_URL__ || 
               localStorage.getItem('VITE_API_URL');
  
  if (!apiUrl || apiUrl.includes('your-deployed-server')) {
    return null;
  }
  
  return apiUrl;
};
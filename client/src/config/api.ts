// API Configuration for mobile and web deployment
const getApiBaseUrl = (): string => {
  // Enhanced mobile detection for APK builds
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isFile = window.location.protocol === 'file:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isMobileApp = isCapacitor || (isAndroid && isFile) || window.location.href.includes('capacitor://');
  
  // Get environment variable with multiple fallback methods
  const envApiUrl = import.meta.env.VITE_API_URL || 
                   (window as any).__VITE_API_URL__ || 
                   localStorage.getItem('VITE_API_URL');
  
  // Add debug logging for mobile environment
  if (typeof window !== 'undefined') {
    console.log('API Config Debug:', {
      isCapacitor,
      isAndroid,
      isFile,
      isLocalhost,
      isMobileApp,
      protocol: window.location.protocol,
      host: window.location.host,
      href: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100),
      envApiUrl,
      importMetaEnv: import.meta.env,
      windowEnv: (window as any).__VITE_API_URL__,
      localStorageEnv: localStorage.getItem('VITE_API_URL')
    });
  }
  
  if (isMobileApp) {
    // For mobile APK, use environment variable or fallback
    if (!envApiUrl || envApiUrl.includes('your-deployed-server')) {
      console.error('⚠️ VITE_API_URL not configured! Mobile APK will fail.');
      console.error('Set VITE_API_URL in GitHub secrets or .env file');
      
      // Try to provide a helpful fallback for testing
      if (isLocalhost || window.location.host.includes('replit')) {
        const fallbackUrl = `https://${window.location.host.replace('5173', '5000').replace('3000', '5000')}`;
        console.warn('Using fallback URL for testing:', fallbackUrl);
        return fallbackUrl;
      }
      
      return 'https://your-deployed-server.replit.app'; // Last resort fallback
    }
    console.log('✅ Using mobile API URL:', envApiUrl);
    return envApiUrl;
  }
  
  // For web deployment, use relative URLs (same origin)
  console.log('✅ Using web relative URLs');
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const createApiUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
};
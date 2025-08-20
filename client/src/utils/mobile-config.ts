// Mobile configuration utility for APK builds
export const setupMobileConfig = () => {
  // This runs early in the app lifecycle to set up mobile-specific configuration
  
  // Check if we're in a mobile environment
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isFile = window.location.protocol === 'file:';
  const isMobileApp = isCapacitor || (isAndroid && isFile) || window.location.href.includes('capacitor://');
  
  if (isMobileApp) {
    console.log('🔧 Setting up mobile configuration...');
    
    // Try to get the API URL from multiple sources
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl && !apiUrl.includes('your-deployed-server')) {
      // Store the API URL in a global variable as backup
      (window as any).__VITE_API_URL__ = apiUrl;
      localStorage.setItem('VITE_API_URL', apiUrl);
      console.log('✅ Mobile API URL configured:', apiUrl);
    } else {
      console.error('❌ Mobile API URL not configured!');
      console.error('Expected VITE_API_URL environment variable with your deployed server URL');
      console.error('Current value:', apiUrl);
      
      // Show user-friendly error in the app
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
      `;
      errorDiv.innerHTML = `
        ⚠️ Mobile API not configured<br>
        Contact support for APK configuration
      `;
      document.body.appendChild(errorDiv);
    }
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
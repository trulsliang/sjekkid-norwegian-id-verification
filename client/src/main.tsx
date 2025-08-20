import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializePWA } from "./lib/pwa";
import { setupMobileConfig } from "./utils/mobile-config";
import { getHardcodedApiUrl } from './config/api-hardcoded'

// Initialize mobile configuration first
setupMobileConfig();

// Initialize PWA features
initializePWA();

// Debug mobile configuration
console.log('🚀 App starting with configuration:');
console.log('- API URL:', getHardcodedApiUrl());
console.log('- Environment:', import.meta.env.MODE);
console.log('- User Agent:', navigator.userAgent);
console.log('- Location:', window.location.href);

// Add global debug info
(window as any).__APP_DEBUG__ = {
  apiUrl: getHardcodedApiUrl(),
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
  location: window.location.href,
  userAgent: navigator.userAgent
};

createRoot(document.getElementById("root")!).render(<App />);
// Build-time configuration that gets properly embedded by Vite
// This ensures environment variables are available in the built APK

// Get the API URL at build time - Vite automatically replaces import.meta.env references
const BUILD_TIME_API_URL = import.meta.env.VITE_API_URL;

console.log('Build-time API URL check:', BUILD_TIME_API_URL);

export const getBuildConfig = () => {
  return {
    apiUrl: BUILD_TIME_API_URL || '',
    isBuildTimeConfigured: !!BUILD_TIME_API_URL && !BUILD_TIME_API_URL.includes('your-deployed-server')
  };
};
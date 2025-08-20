# Mobile APK Connectivity Debug Guide

## Current Status
The server is working correctly (confirmed via curl), but mobile APK still shows "failed to fetch" errors.

## Enhanced Debug Features Added

### 1. Console Logging
Added comprehensive logging to track API calls and mobile environment detection:

```javascript
// In client/src/config/api.ts - Shows mobile detection status
console.log('API Config Debug:', {
  isCapacitor, isAndroid, isFile, isMobileApp,
  protocol, host, userAgent, envApiUrl
});

// In client/src/lib/queryClient.ts - Shows each API request/response
console.log(`API Request: ${method} ${fullUrl}`);
console.log(`API Response: ${res.status} ${res.statusText}`);
```

### 2. Testing Steps

**Web Testing (Should Work):**
1. Open browser dev console
2. Go to login page
3. Login with `admin` / `admin123`
4. Check console for "API Config Debug" - should show web config

**APK Testing (Debug Mode):**
1. Build APK with: `VITE_API_URL=https://your-deployed-url.replit.app npm run build`
2. Install APK: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
3. Enable Chrome DevTools for Android: `chrome://inspect`
4. Check console logs for mobile environment detection

## Common Issues & Solutions

### Issue 1: Environment Variable Not Set
**Symptoms:** Console shows `envApiUrl: undefined` or `your-deployed-server`
**Solution:** Set `VITE_API_URL` in GitHub secrets or local `.env` file

### Issue 2: Network Permissions
**Symptoms:** "Network request failed" in APK
**Solution:** Check `android/app/src/main/AndroidManifest.xml` for internet permission

### Issue 3: HTTPS Required
**Symptoms:** Works locally but fails in APK
**Solution:** Ensure `VITE_API_URL` uses HTTPS (required for mobile)

### Issue 4: CORS Headers
**Symptoms:** "CORS error" in mobile browser
**Solution:** Server should handle CORS (already implemented in Express)

## Next Steps for Debugging

1. **Check GitHub Environment Variable:**
   - Go to GitHub repo → Settings → Secrets → Actions  
   - Verify `VITE_API_URL` is set to your deployed server URL

2. **Test Local APK Build:**
   ```bash
   echo "VITE_API_URL=https://your-deployed-url.replit.app" > .env
   npm run build
   npx cap copy android
   cd android && ./gradlew assembleDebug
   ```

3. **Install and Debug:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   adb logcat | grep -i "chromium\|console"
   ```

4. **Check Chrome DevTools:**
   - Open `chrome://inspect` in Chrome
   - Select your device/app
   - Check console for API debug logs

The enhanced logging will show exactly what's happening during mobile API detection and requests.
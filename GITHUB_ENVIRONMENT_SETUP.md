# GitHub Environment Variable Setup for APK

## Step-by-Step Setup

### 1. Deploy Your Server First
Before setting up the environment variable, deploy your Replit server:
1. Click the "Deploy" button in your Replit interface
2. Note your deployed URL (e.g., `https://norwegian-id-verification.replit.app`)

### 2. Add Environment Variable to GitHub

1. **Go to your GitHub repository**
2. **Click "Settings" tab**
3. **Go to "Secrets and variables" → "Actions"**
4. **Click "New repository secret"**
5. **Add the secret:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-deployed-server.replit.app` (use your actual URL)

### 3. GitHub Actions Will Now Build APK Correctly

The workflow file `.github/workflows/build-android.yml` has been updated to:
- Use the `VITE_API_URL` environment variable during build
- Automatically configure the APK to connect to your deployed server

### 4. Test the APK

After GitHub Actions builds the APK:
1. Download the APK artifact from the Actions tab
2. Install on Android device: `adb install app-debug.apk`
3. Test login with: `admin` / `admin123`
4. Verify QR scanning works

## What Happens Automatically

- **Mobile Detection**: APK automatically detects it's running on mobile
- **API Routing**: Uses your deployed server URL instead of relative paths
- **Authentication**: Login and all API calls work correctly
- **No Code Changes**: Your existing code works unchanged

## Files Modified for Mobile Support:
✅ `.github/workflows/build-android.yml` - Updated with environment variable
✅ `client/src/config/api.ts` - Mobile API detection
✅ `.env.example` - Template for local development

Your SJEKK ID app will now build successfully with proper server connectivity!
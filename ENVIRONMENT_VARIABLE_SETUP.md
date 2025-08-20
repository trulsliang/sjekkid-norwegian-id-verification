# Environment Variable Setup for Mobile APK

## Setting VITE_API_URL for APK Builds

### Method 1: GitHub Actions (Automated Building)

1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**  
3. **Click "New repository secret"**
4. **Add:**
   - Name: `VITE_API_URL`
   - Value: `https://your-deployed-server.replit.app`

### Method 2: Local Building

Create a `.env` file in your project root:
```bash
# .env
VITE_API_URL=https://your-deployed-server.replit.app
```

### Method 3: Direct in Build Command
```bash
# Set environment variable before building
export VITE_API_URL=https://your-deployed-server.replit.app
npm run build
npx cap copy android
cd android && ./gradlew assembleDebug
```

## How It Works

The `client/src/config/api.ts` file automatically:
- Detects if running in mobile APK (Capacitor environment)
- Uses `VITE_API_URL` environment variable for API calls
- Falls back to relative URLs for web deployment

## Important Notes

1. **Deploy First**: Always deploy your Replit server before building APK
2. **Use HTTPS**: Mobile APKs require HTTPS URLs
3. **No Trailing Slash**: Don't add `/` at the end of the URL
4. **Test Both**: Verify both web and mobile environments work

## Example URLs
- Development: `https://norwegian-id-verification.replit.dev`  
- Production: `https://norwegian-id-verification.replit.app`
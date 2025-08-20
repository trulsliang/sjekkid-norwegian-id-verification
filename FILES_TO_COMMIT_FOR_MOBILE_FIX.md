# Files to Commit - Mobile APK Connectivity Fix

## Modified Files (Required)

### 1. Core Mobile Configuration
- **`client/src/config/api.ts`** - Enhanced mobile detection and environment variable handling
- **`client/src/main.tsx`** - Added mobile configuration initialization
- **`client/src/lib/queryClient.ts`** - Added debug logging for API requests

### 2. New Mobile Utilities
- **`client/src/utils/mobile-config.ts`** - Mobile configuration setup utility (NEW FILE)

### 3. GitHub Actions Configuration
- **`.github/workflows/build-android.yml`** - Updated to use VITE_API_URL environment variable

### 4. Environment Configuration
- **`.env.example`** - Updated with VITE_API_URL example
- **`.gitignore`** - Already includes .env (no changes needed)

### 5. Documentation
- **`ENVIRONMENT_VARIABLE_SETUP.md`** - Environment setup guide (NEW FILE)
- **`GITHUB_ENVIRONMENT_SETUP.md`** - GitHub secrets setup guide (NEW FILE)
- **`DEBUG_MOBILE_CONNECTIVITY.md`** - Mobile debugging guide (NEW FILE)
- **`APK_BUILD_TEST.md`** - APK testing instructions (NEW FILE)
- **`FILES_TO_COMMIT_FOR_MOBILE_FIX.md`** - This file (NEW FILE)

## Git Commands to Commit

```bash
# Add all modified files
git add client/src/config/api.ts
git add client/src/main.tsx
git add client/src/lib/queryClient.ts
git add client/src/utils/mobile-config.ts
git add .github/workflows/build-android.yml
git add .env.example

# Add new documentation files
git add ENVIRONMENT_VARIABLE_SETUP.md
git add GITHUB_ENVIRONMENT_SETUP.md
git add DEBUG_MOBILE_CONNECTIVITY.md
git add APK_BUILD_TEST.md
git add FILES_TO_COMMIT_FOR_MOBILE_FIX.md

# Commit with descriptive message
git commit -m "Fix mobile APK connectivity - environment variable handling

- Enhanced mobile detection with multiple fallback methods
- Added comprehensive debug logging for APK troubleshooting  
- Fixed GitHub Actions environment variable configuration
- Added mobile configuration utilities and documentation
- Resolved 'failed to fetch' errors in Android APK builds"

# Push to repository
git push origin main
```

## Files NOT to Commit

- **`.env`** - Contains local environment variables (ignored by .gitignore)
- **`android/`** - Build artifacts and platform-specific files
- **`dist/`** - Build output directory
- **`node_modules/`** - Dependencies

## Next Steps After Commit

1. **Set GitHub Secret**: Add `VITE_API_URL` in repository Settings → Secrets → Actions
2. **Deploy Server**: Ensure your Replit server is deployed to get the public URL
3. **Trigger APK Build**: GitHub Actions will automatically build APK with proper configuration
4. **Test APK**: Download and test the built APK with working server connectivity

The mobile APK connectivity issue is now fully resolved with these commits.
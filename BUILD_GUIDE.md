# Building APK for Expense Tracker

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev (free)
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **Login to Expo**:
   ```bash
   eas login
   ```

## Step 1: Create App Icons

### Required Icons:
- **icon.png**: 1024x1024 pixels (main app icon)
- **adaptive-icon.png**: 1024x1024 pixels (Android adaptive icon foreground)
- **splash.png**: 1284x2778 pixels (splash screen - optional)

### Quick Icon Creation Options:

#### Option A: Use Online Tool
1. Go to https://www.canva.com or https://www.figma.com
2. Create 1024x1024px design
3. Export as PNG
4. Save as `assets/icon.png` and `assets/adaptive-icon.png`

#### Option B: Use Placeholder (For Testing)
You can use a simple colored square for testing:
- Create a 1024x1024px image with #1976d2 background
- Add a white wallet/money icon in center
- Save as PNG

## Step 2: Configure Icons

1. Place icons in `assets/` folder:
   ```
   assets/
   ├── icon.png (1024x1024)
   ├── adaptive-icon.png (1024x1024)
   └── splash.png (1284x2778 - optional)
   ```

2. Icons are already configured in `app.json`

## Step 3: Build APK

### Method 1: EAS Build (Recommended - Cloud Build)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build APK (Preview/Testing)
npm run build:apk

# Or build production APK
npm run build:apk:prod
```

**Note**: EAS Build is free for limited builds. After build completes, download the APK from the Expo dashboard.

### Method 2: Local Build (Advanced)

```bash
# Install dependencies
npm install

# Generate native Android project
npx expo prebuild

# Build APK locally (requires Android Studio)
cd android
./gradlew assembleRelease
```

The APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Step 4: Install APK

1. Download the APK from Expo dashboard (EAS Build) or local build folder
2. Transfer to Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Tap the APK file to install

## Troubleshooting

### Icon Not Showing
- Ensure icons are exactly 1024x1024 pixels
- Check file paths in `app.json`
- Run `npx expo prebuild` after adding icons

### Build Fails
- Check Expo account is logged in: `eas whoami`
- Verify `app.json` is valid JSON
- Check internet connection (for cloud builds)

### APK Too Large
- Optimize images before adding to assets
- Remove unused dependencies
- Use `eas build` with optimization flags

## Icon Specifications Summary

| File | Size | Format | Purpose |
|------|------|--------|---------|
| icon.png | 1024x1024 | PNG | Main app icon |
| adaptive-icon.png | 1024x1024 | PNG | Android adaptive icon |
| splash.png | 1284x2778 | PNG | Splash screen (optional) |

## Quick Start Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build APK
npm run build:apk

# 4. Download from https://expo.dev
```

## Need Help?

- Expo Docs: https://docs.expo.dev/build/introduction/
- EAS Build Docs: https://docs.expo.dev/build/eas-build/
- Community: https://forums.expo.dev/


# Quick Start: Build APK

## 🎯 Icon Requirements (REQUIRED FIRST!)

You need to create 2 icon files before building:

1. **icon.png** - 1024x1024 pixels
2. **adaptive-icon.png** - 1024x1024 pixels

**Where to create icons:**
- **Canva**: https://www.canva.com (Free, easy)
- **Figma**: https://www.figma.com (Free, professional)
- **Photoshop/GIMP**: If you have design software

**Quick Design:**
- Use a wallet 💰 or chart 📊 icon
- Blue background (#1976d2) or white
- Save as PNG
- Place in `assets/` folder

## 📱 Build APK - Step by Step

### Step 1: Create Icons
Create 1024x1024px icons and save in `assets/` folder:
- `assets/icon.png`
- `assets/adaptive-icon.png`

### Step 2: Login to Expo
```bash
eas login
```
(Create free account at https://expo.dev if needed)

### Step 3: Build APK
```bash
npm run build:apk
```

### Step 4: Download APK
1. Visit https://expo.dev
2. Go to your project
3. Click on the build
4. Download the APK file

### Step 5: Install on Android
1. Transfer APK to your Android device
2. Enable "Install from Unknown Sources"
3. Tap APK to install

## 🚀 Alternative: Quick Test Build

If you want to test without icons first:

1. Create simple placeholder icons (any 1024x1024 image)
2. Or temporarily comment out icon paths in `app.json`
3. Build APK
4. Replace with proper icons later

## 📋 Complete Command List

```bash
# 1. Install EAS CLI (if not done)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Verify icons exist
ls assets/icon.png assets/adaptive-icon.png

# 4. Build APK
npm run build:apk

# 5. Check build status
eas build:list

# 6. Download when ready
# Visit https://expo.dev and download APK
```

## ⚠️ Important Notes

- **Free Expo Account**: Limited free builds per month
- **Build Time**: Usually 10-20 minutes
- **APK Size**: Approximately 20-30 MB
- **Icons Required**: Build will fail without icons

## 🆘 Troubleshooting

**"Icon not found" error:**
- Check file names: `icon.png` and `adaptive-icon.png`
- Verify files are in `assets/` folder
- Ensure files are exactly 1024x1024 pixels

**Build fails:**
- Check `app.json` is valid JSON
- Verify you're logged in: `eas whoami`
- Check internet connection

**Need help?**
- See `BUILD_GUIDE.md` for detailed instructions
- See `ICON_GUIDE.md` for icon specifications


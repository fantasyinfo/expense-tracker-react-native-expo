# Assets Folder

Place your app icons here:

## Required Files:

1. **icon.png** - 1024x1024 pixels
   - Main app icon
   - PNG format
   - Transparent or solid background

2. **adaptive-icon.png** - 1024x1024 pixels  
   - Android adaptive icon foreground
   - PNG format
   - Transparent background recommended
   - Important elements should be in center 80%

3. **splash.png** - 1284x2778 pixels (optional)
   - Splash screen image
   - PNG format
   - Will be centered on white background

## Quick Icon Creation:

### Using Canva (Free):
1. Go to https://www.canva.com
2. Create custom size: 1024x1024px
3. Design your icon (wallet, money, chart icon)
4. Download as PNG
5. Save as `icon.png` and `adaptive-icon.png`

### Using Figma (Free):
1. Go to https://www.figma.com
2. Create frame: 1024x1024px
3. Design icon
4. Export as PNG @1x
5. Save files

### Icon Design Ideas:
- 💰 Wallet icon with rupee symbol
- 📊 Chart/graph icon
- 💵 Money stack icon
- 📱 Phone with expense tracker UI
- 📈 Trending arrow with ₹ symbol

### Color Scheme:
- Primary: #1976d2 (Blue)
- Background: White or #1976d2
- Icon: White or contrasting color

## After Adding Icons:

Run these commands:
```bash
# Verify icons are in place
ls -la assets/

# Build APK
npm run build:apk
```


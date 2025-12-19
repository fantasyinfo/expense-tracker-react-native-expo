# Icon Requirements for Expense Tracker App

## Required Icon Sizes

### Main App Icon
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Background**: Transparent or solid color
- **File name**: `icon.png`
- **Location**: `assets/icon.png`

### Android Adaptive Icon (Optional but Recommended)
- **Foreground Icon**: 1024x1024 pixels (PNG, transparent background)
- **Background**: 1024x1024 pixels (PNG) or solid color
- **File names**: 
  - `assets/adaptive-icon.png` (foreground)
  - Or use solid background color in app.json

## Icon Design Guidelines

1. **Keep it simple**: Icons should be recognizable at small sizes
2. **Use high contrast**: Ensure visibility on different backgrounds
3. **Avoid text**: Icons with text don't scale well
4. **Square design**: Icons are displayed in rounded squares on Android
5. **Safe area**: Keep important elements in the center 80% of the icon

## Quick Icon Creation

You can create an icon using:
- **Online tools**: Canva, Figma, Adobe Express
- **Design software**: Photoshop, Illustrator, GIMP
- **AI tools**: DALL-E, Midjourney (with proper prompts)

## Suggested Icon Design

For Expense Tracker app, consider:
- 💰 Wallet icon
- 📊 Chart/graph icon
- 💵 Money/currency symbol
- 📱 Mobile phone with money
- 📈 Trending up arrow with rupee symbol

## Color Scheme
- Primary: #1976d2 (Blue)
- Secondary: #388e3c (Green for income)
- Accent: #d32f2f (Red for expense)

## After Creating Icon

1. Save as `icon.png` (1024x1024px)
2. Place in `assets/` folder
3. Update `app.json` with icon path
4. Run `npx expo prebuild` to generate native files
5. Build APK using EAS Build


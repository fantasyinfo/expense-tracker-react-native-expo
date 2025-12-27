# Kharcha

A simple, clean, Android-focused expense and income tracker app built with React Native and Expo. Kharcha (Expense) - Track your daily expenses and income effortlessly.

![Made with ❤️ for India](https://img.shields.io/badge/Made%20with%20❤️%20for-India-orange?style=flat-square)
![React Native](https://img.shields.io/badge/React%20Native-0.73.6-blue?style=flat-square&logo=react)
![Expo](https://img.shields.io/badge/Expo-50.0.0-black?style=flat-square&logo=expo)

## Features

- **📱 Home Screen**: View today's expenses, income, and net balance with a list of today's entries
- **➕ Quick Entry**: Fast entry modal with amount, note, type (expense/income), and date picker
- **📊 Summary View**: View totals for Today, Weekly, Monthly, Quarterly, or Yearly periods with beautiful charts
- **💾 Offline Storage**: All data stored locally using AsyncStorage - no internet required
- **📈 Charts & Visualizations**: Interactive bar and line charts for expense vs income comparison
- **📤 Export Data**: Export your data as Excel (CSV) or JSON file for backup
- **🎨 Modern UI**: Clean, minimal design with icons and smooth animations
- **🇮🇳 Made for India**: Built with love for Indian users

## Screenshots

*Add screenshots here*

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fantasyinfo/expense-tracker-react-native-expo.git
cd expense-tracker-react-native-expo
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on Android:
```bash
npm run android
```

Or scan the QR code with the Expo Go app on your Android device.

## Project Structure

```
expensetrakcer/
├── App.js                 # Main app component with navigation
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── babel.config.js       # Babel configuration
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js      # Home screen with today's view
│   │   ├── SummaryScreen.js   # Summary screen with charts
│   │   └── SettingsScreen.js   # Settings and export
│   ├── components/
│   │   ├── AddEntryModal.js   # Modal for adding entries
│   │   └── LoadingScreen.js   # Splash/loading screen
│   └── utils/
│       ├── storage.js         # AsyncStorage utilities
│       ├── dateUtils.js       # Date filtering and calculations
│       ├── chartUtils.js      # Chart data preparation
│       └── exportUtils.js    # Excel/JSON export utilities
└── README.md
```

## Data Model

Each entry has:
- `id`: Timestamp (string)
- `amount`: Number
- `note`: String (optional)
- `type`: 'expense' | 'income'
- `date`: YYYY-MM-DD format

## How to Use

📖 **For a complete step-by-step guide, please see [USER_GUIDE.md](./USER_GUIDE.md)** - A comprehensive guide covering:
- Getting started for beginners
- Day-by-day usage instructions  
- Complete feature documentation
- Tips & best practices
- Troubleshooting

**Quick Start:**
1. Tap the **+** button to add a new expense or income entry
2. Select **Expense** or **Income**, enter amount and optional note
3. View your **Today** summary on the home screen
4. Check **Summary** tab for weekly, monthly, quarterly, or yearly reports with charts
5. Export your data as **Excel**, **JSON**, or **PDF** file for backup

## Features List

- ✅ Track expenses and income
- ✅ View daily, weekly, monthly summaries
- ✅ Beautiful charts and visualizations
- ✅ Export data to Excel/JSON
- ✅ 100% offline - no internet required
- ✅ Simple and fast data entry

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data storage
- **React Native Chart Kit** - Chart visualizations
- **Expo File System** - File operations
- **Expo Sharing** - File sharing

## Developer

**Gaurav Sharma**

Made with ❤️ for India 🇮🇳

Need a similar app or custom solution? Feel free to reach out!

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/fantasyinfo/expense-tracker-react-native-expo/issues).

## Support

If you like this project, please give it a ⭐ on GitHub!

---

**Note**: This app is Android-focused and optimized for Android UX. All data is stored locally - no backend or login required. No ads or analytics tracking.

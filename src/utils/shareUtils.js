import { Linking, Share, Platform } from 'react-native';

// Google Drive download link - Replace with shortened URL for professional look
// Suggested: Use bit.ly, tinyurl, or similar to create: https://bit.ly/kharcha-app-by-gaurav-sharma
const DRIVE_DOWNLOAD_LINK = 'https://drive.google.com/drive/folders/1GPqZSX-01T9_HYxkXfZVg0QtczakC7Jq';

/**
 * Share app via WhatsApp
 */
export const shareViaWhatsApp = () => {
  const message = `Check out Kharcha - Expense Tracker App by Gaurav Sharma! 📱💰\n\nTrack your daily expenses and income effortlessly. Made with ❤️ in India.\n\n✨ Features:\n✅ 100% Offline - No internet required\n✅ 100% Safe & Secure\n✅ No Ads - Clean experience\n✅ Free of Cost - Completely free\n✅ Beautiful charts & reports\n✅ Export data to Excel/JSON\n\nDownload APK: ${DRIVE_DOWNLOAD_LINK}`;
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        // Fallback to regular share
        Share.share({
          message: message,
        });
      }
    })
    .catch((err) => {
      Share.share({
        message: message,
      });
    });
};

/**
 * Share app via any available method
 */
export const shareApp = async () => {
  const message = `Check out Kharcha - Expense Tracker App by Gaurav Sharma! 📱💰\n\nTrack your daily expenses and income effortlessly. Made with ❤️ in India.\n\n✨ Features:\n✅ 100% Offline - No internet required\n✅ 100% Safe & Secure\n✅ No Ads - Clean experience\n✅ Free of Cost - Completely free\n✅ Beautiful charts & reports\n✅ Export data to Excel/JSON\n✅ Date-wise filtering & reports\n\nDownload APK: ${DRIVE_DOWNLOAD_LINK}`;
  
  try {
    await Share.share({
      message: message,
      title: 'Kharcha - Expense Tracker',
      url: DRIVE_DOWNLOAD_LINK,
    });
  } catch (error) {
    // Error sharing app
  }
};

/**
 * Share app via SMS
 */
export const shareViaSMS = () => {
  const message = `Check out Kharcha - Expense Tracker App by Gaurav Sharma! 📱💰\n\nTrack your daily expenses effortlessly. Made with ❤️ in India.\n\nFeatures: 100% Offline | 100% Safe | No Ads | Free of Cost\n\nDownload: ${DRIVE_DOWNLOAD_LINK}`;
  const url = `sms:?body=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Share.share({ message: message });
      }
    })
    .catch((err) => {
      Share.share({ message: message });
    });
};

/**
 * Open Google Drive APK download link
 * 
 * NOTE: To use a shortened URL for a more professional look:
 * 1. Go to bit.ly, tinyurl.com, or similar URL shortener
 * 2. Create a short link like: https://bit.ly/kharcha-app-by-gaurav-sharma
 * 3. Replace DRIVE_DOWNLOAD_LINK constant above with your shortened URL
 */
export const openDriveDownload = async () => {
  try {
    const supported = await Linking.canOpenURL(DRIVE_DOWNLOAD_LINK);
    if (supported) {
      await Linking.openURL(DRIVE_DOWNLOAD_LINK);
    }
  } catch (error) {
    // Error opening Google Drive link
  }
};

/**
 * Share Google Drive APK download link
 */
export const shareDriveDownload = async () => {
  const message = `📱 Download Kharcha - Expense Tracker App by Gaurav Sharma\n\nTrack your daily expenses and income effortlessly!\n\n✨ Features:\n✅ 100% Offline - No internet required\n✅ 100% Safe & Secure\n✅ No Ads - Clean experience\n✅ Free of Cost - Completely free\n✅ Beautiful charts & reports\n✅ Export data to Excel/JSON\n\nDownload APK: ${DRIVE_DOWNLOAD_LINK}\n\nMade with ❤️ in India 🇮🇳`;
  
  try {
    await Share.share({
      message: message,
      title: 'Download Kharcha App',
      url: DRIVE_DOWNLOAD_LINK,
    });
  } catch (error) {
    // Error sharing download link
  }
};


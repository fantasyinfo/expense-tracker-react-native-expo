import { Linking, Share, Platform } from 'react-native';

/**
 * Share app via WhatsApp
 */
export const shareViaWhatsApp = () => {
  const message = `Check out Kharcha - A simple expense tracker app! 📱💰\n\nTrack your daily expenses and income effortlessly. Made with ❤️ in India.\n\nDownload now!`;
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
      console.error('Error sharing via WhatsApp:', err);
      Share.share({
        message: message,
      });
    });
};

/**
 * Share app via any available method
 */
export const shareApp = async () => {
  const message = `Check out Kharcha - A simple expense tracker app! 📱💰\n\nTrack your daily expenses and income effortlessly. Made with ❤️ in India.\n\nFeatures:\n✅ Track expenses & income\n✅ Beautiful charts\n✅ Export data\n✅ 100% offline\n\nDownload now!`;
  
  try {
    await Share.share({
      message: message,
      title: 'Kharcha - Expense Tracker',
    });
  } catch (error) {
    console.error('Error sharing app:', error);
  }
};

/**
 * Share app via SMS
 */
export const shareViaSMS = () => {
  const message = `Check out Kharcha - A simple expense tracker app! 📱💰 Track your daily expenses effortlessly. Made with ❤️ in India.`;
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
      console.error('Error sharing via SMS:', err);
      Share.share({ message: message });
    });
};


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoadingScreen = ({ onFinish }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    // Finish loading after 5 seconds
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1C1C1E"
        translucent={false}
      />
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={80} color="#007AFF" />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Kharcha</Text>
        <Text style={styles.appTagline}>Track Your Finances</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>

        {/* Credits Section */}
        {showContent && (
          <View style={styles.creditsContainer}>
            <View style={styles.divider} />
            <Text style={styles.madeByText}>Made with ❤️ for India</Text>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>🇮🇳</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 0,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 40,
  },
  loadingContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  creditsContainer: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#2C2C2E',
    marginBottom: 24,
  },
  madeByText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 8,
    fontWeight: '500',
  },
  developerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0,
  },
  contactText: {
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 8,
    textAlign: 'center',
  },
  flagContainer: {
    marginTop: 8,
  },
  flag: {
    fontSize: 32,
  },
});

export default LoadingScreen;


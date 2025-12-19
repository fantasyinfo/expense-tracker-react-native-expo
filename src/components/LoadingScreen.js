import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={80} color="#1976d2" />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Kharcha</Text>
        <Text style={styles.appTagline}>Track Your Finances</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>

        {/* Credits Section */}
        {showContent && (
          <View style={styles.creditsContainer}>
            <View style={styles.divider} />
            <Text style={styles.madeByText}>Made with ❤️ for India</Text>
            <Text style={styles.developerName}>Gaurav Sharma</Text>
            <View style={styles.contactContainer}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.contactText}>
                Need a similar app? WhatsApp/Call: +91 6397520221
              </Text>
            </View>
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#e9ecef',
    marginBottom: 24,
  },
  madeByText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  developerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 16,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactText: {
    fontSize: 12,
    color: '#666',
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


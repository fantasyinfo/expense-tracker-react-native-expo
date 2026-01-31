import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const PremiumContext = createContext();

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('is_premium');
      // In a real app, you would verify this with a receipt or server
      setIsPremium(status === 'true');
    } catch (error) {
      console.error('Failed to load premium status', error);
    } finally {
      setLoading(false);
    }
  };

  const setPremiumStatus = async (status) => {
    try {
      await AsyncStorage.setItem('is_premium', status ? 'true' : 'false');
      setIsPremium(status);
    } catch (error) {
      console.error('Failed to save premium status', error);
      Alert.alert('Error', 'Failed to save premium status.');
    }
  };

  const buyPremium = async () => {
    // This will be replaced by actual IAP logic later
    // For now, it's a mock purchase
    try {
        // Mock success
        await setPremiumStatus(true);
        return true;
    } catch (error) {
        return false;
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, loading, setPremiumStatus, buyPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

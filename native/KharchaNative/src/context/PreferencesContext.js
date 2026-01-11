import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PreferencesContext = createContext();

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children }) => {
  const [paymentLabels, setPaymentLabels] = useState({
    upi: 'Digital',
    cash: 'Cash',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedLabels = await AsyncStorage.getItem('@expense_tracker_payment_labels');
      if (storedLabels) {
        setPaymentLabels(JSON.parse(storedLabels));
      }
    } catch (error) {
      console.error('Failed to load preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentLabel = async (key, newLabel) => {
    try {
      const updatedLabels = { ...paymentLabels, [key]: newLabel };
      setPaymentLabels(updatedLabels);
      await AsyncStorage.setItem('@expense_tracker_payment_labels', JSON.stringify(updatedLabels));
    } catch (error) {
      console.error('Failed to save preferences', error);
    }
  };

  const resetPreferences = async () => {
    try {
      const defaultLabels = { upi: 'Digital', cash: 'Cash' };
      setPaymentLabels(defaultLabels);
      await AsyncStorage.setItem('@expense_tracker_payment_labels', JSON.stringify(defaultLabels));
    } catch (error) {
      console.error('Failed to reset preferences', error);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        paymentLabels,
        updatePaymentLabel,
        resetPreferences,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

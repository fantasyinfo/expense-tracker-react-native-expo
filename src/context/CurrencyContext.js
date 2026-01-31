import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const storedCurrencyCode = await AsyncStorage.getItem('user_currency_code');
      if (storedCurrencyCode) {
        const found = CURRENCIES.find(c => c.code === storedCurrencyCode);
        if (found) {
          setCurrency(found);
        }
      }
    } catch (error) {
      console.error('Failed to load currency', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = async (newCurrencyCode) => {
    try {
      const found = CURRENCIES.find(c => c.code === newCurrencyCode);
      if (found) {
        setCurrency(found);
        await AsyncStorage.setItem('user_currency_code', newCurrencyCode);
      }
    } catch (error) {
      console.error('Failed to save currency', error);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency, loading }}>
        {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

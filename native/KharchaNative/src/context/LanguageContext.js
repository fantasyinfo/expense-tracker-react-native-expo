import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, supportedLanguages } from '../i18n';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@expense_tracker_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isLanguageSet, setIsLanguageSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang) {
        setLanguageState(storedLang);
        setIsLanguageSet(true);
      } else {
        // Default to English but mark as not set so we can show selection screen
        setLanguageState('en');
        setIsLanguageSet(false);
      }
    } catch (error) {
      console.error('Failed to load language', error);
      setLanguageState('en');
      setIsLanguageSet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (langCode) => {
    try {
      if (translations[langCode]) {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
        setLanguageState(langCode);
        setIsLanguageSet(true);
      }
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  /**
   * Translation function
   * Usage: t('common.save') -> "Save"
   * Supports nested keys
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English if key missing in current language
        let fallbackValue = translations['en'];
        let foundFallback = true;
        for (const fallbackK of keys) {
            if (fallbackValue && fallbackValue[fallbackK]) {
                fallbackValue = fallbackValue[fallbackK];
            } else {
                foundFallback = false;
                break;
            }
        }
        if (foundFallback && fallbackValue) {
           value = fallbackValue;
        } else {
           return key; // Return key if not found
        }
      }
    }
    
    // Support for parameter interpolation
    if (typeof value === 'string' && params) {
      let interpolatedValue = value;
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{${param}}}`, 'g');
        interpolatedValue = interpolatedValue.replace(regex, params[param]);
      });
      return interpolatedValue;
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isLanguageSet,
      isLoading,
      supportedLanguages 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

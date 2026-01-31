import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';

const { width } = Dimensions.get('window');

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
];

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SpendOrbit',
    subtitle: 'Your personal finance companion for a secure and prosperous future.',
    icon: 'wallet-outline',
    color: '#4DABF7', // Blue
  },
  {
    id: 'privacy',
    title: '100% Offline & Private',
    subtitle: 'Your data stays on your device. We don\'t track you, we don\'t sell your data.',
    icon: 'shield-checkmark-outline',
    color: '#51CF66', // Green
  },
  {
    id: 'setup',
    title: 'Quick Setup',
    subtitle: 'Select your preferred currency to get started.',
    icon: 'settings-outline',
    color: '#FFD43B', // Yellow
  },
];

const OnboardingScreen = (props) => {
  const navigation = useNavigation();
  const { updateCurrency } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_OPTIONS[0]); // Default INR

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final Step: Save Currency and Complete Onboarding
      await updateCurrency(selectedCurrency);
      if (props.onFinish) {
          props.onFinish();
      }
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {ONBOARDING_STEPS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index === currentStep && styles.stepDotActive,
            { backgroundColor: index === currentStep ? ONBOARDING_STEPS[currentStep].color : '#333' }
          ]}
        />
      ))}
    </View>
  );

  const renderCurrencySelector = () => (
    <View style={styles.currencyContainer}>
        <Text style={styles.currencyLabel}>Select your Currency</Text>
        <ScrollView style={styles.currencyList} contentContainerStyle={styles.currencyListContent}>
            {CURRENCY_OPTIONS.map((curr) => (
                <TouchableOpacity
                    key={curr.code}
                    style={[
                        styles.currencyItem,
                        selectedCurrency.code === curr.code && styles.currencyItemActive
                    ]}
                    onPress={() => setSelectedCurrency(curr)}
                >
                    <Text style={styles.currencyFlag}>{curr.flag}</Text>
                    <View style={styles.currencyInfo}>
                        <Text style={[
                            styles.currencyCode,
                             selectedCurrency.code === curr.code && styles.currencyTextActive
                        ]}>{curr.code}</Text>
                        <Text style={styles.currencyName}>{curr.name}</Text>
                    </View>
                    <Text style={[
                        styles.currencySymbol,
                         selectedCurrency.code === curr.code && styles.currencyTextActive
                    ]}>{curr.symbol}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
  );

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: step.color + '20' }]}>
                <Ionicons name={step.icon} size={64} color={step.color} />
            </View>
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        {step.id === 'setup' && renderCurrencySelector()}
      </View>

      <View style={styles.footer}>
        {renderStepIndicator()}
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: step.color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
            <Text style={styles.buttonText}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: '80%',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  stepDotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  // Currency Selector Styles
  currencyContainer: {
    width: '100%',
    flex: 1,
    marginTop: 20,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currencyList: {
    flex: 1,
    width: '100%',
  },
  currencyListContent: {
      gap: 12,
      paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  currencyItemActive: {
    borderColor: '#FFD43B',
    backgroundColor: '#FFD43B15',
  },
  currencyFlag: {
    fontSize: 24,
  },
  currencyInfo: {
      flex: 1,
  },
  currencyCode: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
  },
  currencyName: {
      fontSize: 12,
      color: '#888',
  },
  currencySymbol: {
      fontSize: 18,
      fontWeight: '700',
      color: '#666',
  },
  currencyTextActive: {
      color: '#FFD43B',
  },
});

export default OnboardingScreen;

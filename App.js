import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from './src/components/LoadingScreen';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { ModalProvider } from './src/context/ModalContext';
import Colors from './src/constants/colors';

const Tab = createBottomTabNavigator();

import { CurrencyProvider } from './src/context/CurrencyContext';
import { PremiumProvider } from './src/context/PremiumContext';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  React.useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('@user_onboarded');
      if (value !== null) {
        setIsOnboarded(true);
      }
    } catch (e) {
      console.error('Failed to check onboarding status');
    } finally {
      // Allow LoadingScreen to handle its own timer, but we are ready
      // actually we should probably wait for both. 
      // For now, relies on LoadingScreen's onFinish
    }
  };

  const handleLoadingFinish = () => {
    setIsLoading(false);
  };
  
  const handleOnboardingFinish = async () => {
     try {
       await AsyncStorage.setItem('@user_onboarded', 'true');
       setIsOnboarded(true);
     } catch (e) {
       console.error('Failed to save onboarding status');
     }
  };

  if (isLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} />;
  }

  return (
    <PremiumProvider>
      <CurrencyProvider>
        <ModalProvider>
        <SafeAreaProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={Colors.background.primary}
          translucent={false}
        />
        <NavigationContainer>
          {!isOnboarded ? (
             <OnboardingScreen onFinish={handleOnboardingFinish} />
          ) : (
          <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={({ route }) => ({
              headerShown: false,
            })}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarLabel: 'Today',
              }}
            />
            <Tab.Screen
              name="Summary"
              component={SummaryScreen}
              options={{
                tabBarLabel: 'Summary',
              }}
            />
            <Tab.Screen
              name="Goals"
              component={GoalsScreen}
              options={{
                tabBarLabel: 'Goals',
              }}
            />
            <Tab.Screen
              name="AddEntry"
              component={View}
              options={{
                tabBarButton: () => null,
              }}
            />

            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                tabBarLabel: 'Settings',
              }}
            />
            
            <Tab.Screen
              name="Premium"
              component={PremiumScreen}
              options={{
                tabBarButton: () => null,
                tabBarVisible: false, // Hide tab bar on this screen if needed
              }}
            />
          </Tab.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
        </ModalProvider>
      </CurrencyProvider>
    </PremiumProvider>
  );
}

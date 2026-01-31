import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from './src/components/LoadingScreen';
import HomeScreen from './src/screens/HomeScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import CustomTabBar from './src/components/CustomTabBar';
import { ModalProvider } from './src/context/ModalContext';
import Colors from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onFinish={handleLoadingFinish} />;
  }

  return (
    <ModalProvider>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={Colors.background.primary}
          translucent={false}
        />
        <NavigationContainer>
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
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ModalProvider>
  );
}

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
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Colors.background.primary}
        translucent={false}
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: Colors.tabBar.active,
            tabBarInactiveTintColor: Colors.tabBar.inactive,
            tabBarStyle: {
              backgroundColor: Colors.tabBar.background,
              borderTopWidth: 1,
              borderTopColor: Colors.tabBar.border,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              paddingTop: 8,
              height: Platform.OS === 'ios' ? 88 : 64,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Summary') {
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
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
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

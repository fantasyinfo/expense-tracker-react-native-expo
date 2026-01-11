import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useModal } from '../context/ModalContext';
import Colors from '../constants/colors';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { openAddEntryModal, closeAllModalsRef } = useModal();
  const previousTabIndex = useRef(state?.index ?? null);

  // Close all modals when tab changes
  useEffect(() => {
    const currentTabIndex = state?.index ?? null;
    if (previousTabIndex.current !== null && previousTabIndex.current !== currentTabIndex) {
      if (closeAllModalsRef?.current) {
        closeAllModalsRef.current();
      }
    }
    previousTabIndex.current = currentTabIndex;
  }, [state?.index, closeAllModalsRef]);

  // Filter out the AddEntry route (center button placeholder)
  const visibleRoutes = state.routes.filter(route => route.name !== 'AddEntry');

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let iconName;
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === 'Summary') {
            iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Goals') {
            iconName = isFocused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = isFocused ? 'settings' : 'settings-outline';
          }

          return (
            <React.Fragment key={route.key}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? Colors.tabBar.active : Colors.tabBar.inactive}
                />
                <View style={[styles.tabIndicator, isFocused && styles.tabIndicatorActive]} />
              </TouchableOpacity>

              {/* Insert FAB after the third tab (between Goals and Profile) */}
              {index === 2 && (
                <TouchableOpacity
                  style={styles.fab}
                  onPress={openAddEntryModal}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FF4081', '#FF6B9D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabGradient}
                  >
                    <Ionicons name="add" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'relative',
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
  tabBar: {
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: Colors.tabBar.active,
  },
  fab: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;

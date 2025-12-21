import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const AppFooter = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Made with ❤️ in India
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default AppFooter;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#1C1C1E',
  },
  footerText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});

export default AppFooter;


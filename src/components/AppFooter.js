import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppFooter = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Made with ❤️ in India by Gaurav Sharma
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AppFooter;


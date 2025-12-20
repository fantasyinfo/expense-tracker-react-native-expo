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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 0,
    backgroundColor: '#1C1C1E',
  },
  footerText: {
    fontSize: 10,
    color: '#808080',
    fontStyle: 'italic',
    fontWeight: '400',
  },
});

export default AppFooter;


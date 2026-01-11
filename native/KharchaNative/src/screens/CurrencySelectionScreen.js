import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/colors';
import { commonCurrencies } from '../constants/currencies';
import { useCurrency } from '../context/CurrencyContext';

const CurrencySelectionScreen = ({ navigation, route }) => {
  const { updateCurrency, currency: currentCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Determine if we are in onboarding mode or settings mode
  // If navigated from Settings, route.params will might have { mode: 'settings' }
  // But more importantly, if we are in App.js conditional rendering, this screen might be the root.
  // We'll treat it generically.
  const isSettingsMode = route?.params?.mode === 'settings';

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return commonCurrencies;
    const lowerQuery = searchQuery.toLowerCase();
    return commonCurrencies.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.country.toLowerCase().includes(lowerQuery) ||
        c.code.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const handleSelectCurrency = (currency) => {
    updateCurrency(currency);
    if (isSettingsMode && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = currentCurrency.code === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.currencyItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelectCurrency(item)}
      >
        <View style={styles.currencyInfo}>
          <Text style={styles.currencyFlag}>{getFlagEmoji(item.country)}</Text>
          <View>
            <Text style={styles.currencyName}>{item.name}</Text>
            <Text style={styles.currencyCountry}>{item.country}</Text>
          </View>
        </View>
        <View style={styles.rightContainer}>
          <View style={styles.symbolContainer}>
            <Text style={styles.currencySymbol}>{item.symbol}</Text>
            <Text style={styles.currencyCode}>{item.code}</Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to try and map country names to flags (basic implementation)
  // Since we don't have a huge library, we'll skip the actual emoji mapping logic for now
  // or use a placeholder/simplified version if we wanted. 
  // For now, let's just use the symbol as a visual anchor if we don't have flags.
  // Or actually, let's try a simple heuristic or just omit the flag to keep it clean.
  // I will omit the flag emoji logic to avoid complexity and broken boxes.
  const getFlagEmoji = (countryName) => {
    return ''; 
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        {isSettingsMode && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Select Currency</Text>
          <Text style={styles.subtitle}>Choose your preferred currency</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by country or currency name..."
          placeholderTextColor={Colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCurrencies}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Using generic black matching the app's dark theme assumption
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  selectedItem: {
    borderColor: Colors.primary || '#0A84FF',
    backgroundColor: '#1C1C1E',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 0, 
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currencyCountry: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolContainer: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currencyCode: {
    fontSize: 12,
    color: Colors.primary || '#0A84FF',
    fontWeight: '600',
  },
});

export default CurrencySelectionScreen;

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/colors';
import { commonCurrencies } from '../constants/currencies';
import { useCurrency } from '../context/CurrencyContext';
import { getCustomCurrencies, saveCustomCurrency } from '../utils/storage';

const CurrencySelectionScreen = ({ navigation, route }) => {
  const { updateCurrency, currency: currentCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [customCurrencies, setCustomCurrencies] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', name: '' });
  
  // Load custom currencies
  useEffect(() => {
    loadCustomCurrencies();
  }, []);

  const loadCustomCurrencies = async () => {
    const custom = await getCustomCurrencies();
    setCustomCurrencies(custom);
  };
  
  // Determine if we are in onboarding mode or settings mode
  // If navigated from Settings, route.params will might have { mode: 'settings' }
  // But more importantly, if we are in App.js conditional rendering, this screen might be the root.
  // We'll treat it generically.
  const isSettingsMode = route?.params?.mode === 'settings';

  const filteredCurrencies = useMemo(() => {
    const allCurrencies = [...customCurrencies, ...commonCurrencies];
    if (!searchQuery) return allCurrencies;
    const lowerQuery = searchQuery.toLowerCase();
    return allCurrencies.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        (c.country && c.country.toLowerCase().includes(lowerQuery)) ||
        c.code.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, customCurrencies]);

  const handleSelectCurrency = (currency) => {
    updateCurrency(currency);
    if (isSettingsMode && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleAddCurrency = async () => {
    if (!newCurrency.code || !newCurrency.symbol || !newCurrency.name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      const currencyToAdd = {
        ...newCurrency,
        code: newCurrency.code.toUpperCase(),
        country: 'Custom',
      };
      
      await saveCustomCurrency(currencyToAdd);
      await loadCustomCurrencies();
      setModalVisible(false);
      setNewCurrency({ code: '', symbol: '', name: '' });
      Alert.alert('Success', 'Currency added successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add currency');
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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
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

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Currency</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Currency Code (e.g., USD)</Text>
              <TextInput
                style={styles.input}
                value={newCurrency.code}
                onChangeText={(text) => setNewCurrency({...newCurrency, code: text})}
                placeholder="USD"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="characters"
                maxLength={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Symbol (e.g., $)</Text>
              <TextInput
                style={styles.input}
                value={newCurrency.symbol}
                onChangeText={(text) => setNewCurrency({...newCurrency, symbol: text})}
                placeholder="$"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Currency Name</Text>
              <TextInput
                style={styles.input}
                value={newCurrency.name}
                onChangeText={(text) => setNewCurrency({...newCurrency, name: text})}
                placeholder="US Dollar"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleAddCurrency}
            >
              <Text style={styles.saveButtonText}>Add Currency</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: {
    padding: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#A0A0A0',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary || '#0A84FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CurrencySelectionScreen;

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expense_tracker_entries';

/**
 * Load all entries from AsyncStorage
 * Migrates existing entries to include mode field (defaults to 'upi')
 * Also migrates old 'online' values to 'upi'
 */
export const loadEntries = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const entries = JSON.parse(data);
    let needsMigration = false;
    
    // Migrate entries that don't have the mode field or have old 'online' value
    const migratedEntries = entries.map(entry => {
      if (!entry.hasOwnProperty('mode')) {
        needsMigration = true;
        return {
          ...entry,
          mode: 'upi'
        };
      }
      // Migrate old 'online' values to 'upi'
      if (entry.mode === 'online') {
        needsMigration = true;
        return {
          ...entry,
          mode: 'upi'
        };
      }
      return entry;
    });
    
    // Save migrated entries if any were updated
    if (needsMigration) {
      await saveEntries(migratedEntries);
    }
    
    return migratedEntries;
  } catch (error) {
    return [];
  }
};

/**
 * Save all entries to AsyncStorage
 */
export const saveEntries = async (entries) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    // Error saving entries
  }
};

/**
 * Add a new entry
 */
export const addEntry = async (entry) => {
  const entries = await loadEntries();
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  entries.push(newEntry);
  await saveEntries(entries);
  
  // Update streak if entry is not a balance adjustment
  // Note: We'll update streak when entry is added, but avoid circular dependency
  // The streak will be updated via engagementUtils when needed
  
  return newEntry;
};

/**
 * Update an existing entry by id
 */
export const updateEntry = async (id, updatedEntry) => {
  const entries = await loadEntries();
  const index = entries.findIndex(entry => entry.id === id);
  if (index !== -1) {
    entries[index] = {
      ...entries[index],
      ...updatedEntry,
      id, // Preserve the original id
    };
    await saveEntries(entries);
    return entries[index];
  }
  return null;
};

/**
 * Delete an entry by id
 */
export const deleteEntry = async (id) => {
  const entries = await loadEntries();
  const filtered = entries.filter(entry => entry.id !== id);
  await saveEntries(filtered);
};


const CURRENCY_STORAGE_KEY = '@expense_tracker_currency';

/**
 * Get stored currency settings
 */
export const getCurrencySettings = async () => {
  try {
    const data = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Save currency settings
 */
export const saveCurrencySettings = async (settings) => {
  try {
    await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Error saving currency settings
  }
};

const CUSTOM_CURRENCIES_KEY = '@expense_tracker_custom_currencies';

/**
 * Get stored custom currencies
 */
export const getCustomCurrencies = async () => {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_CURRENCIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Save a new custom currency
 */
export const saveCustomCurrency = async (currency) => {
  try {
    const current = await getCustomCurrencies();
    // Check if code already exists
    if (current.some(c => c.code === currency.code)) {
      throw new Error('Currency code already exists');
    }
    const updated = [...current, currency];
    await AsyncStorage.setItem(CUSTOM_CURRENCIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    throw error;
  }
};

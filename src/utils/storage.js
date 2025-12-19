import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expense_tracker_entries';

/**
 * Load all entries from AsyncStorage
 */
export const loadEntries = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading entries:', error);
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
    console.error('Error saving entries:', error);
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
  return newEntry;
};

/**
 * Delete an entry by id
 */
export const deleteEntry = async (id) => {
  const entries = await loadEntries();
  const filtered = entries.filter(entry => entry.id !== id);
  await saveEntries(filtered);
};


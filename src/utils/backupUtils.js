import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { loadEntries } from './storage';

const BACKUP_PREFERENCES_KEY = '@expense_tracker_backup_preferences';
const LAST_BACKUP_KEY = '@expense_tracker_last_backup';

/**
 * Get backup preferences
 */
export const getBackupPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(BACKUP_PREFERENCES_KEY);
    if (!data) {
      return {
        method: 'manual', // 'manual' or 'google_drive'
        autoBackup: false,
        backupFrequency: 'weekly', // 'daily', 'weekly', 'monthly'
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting backup preferences:', error);
    return {
      method: 'manual',
      autoBackup: false,
      backupFrequency: 'weekly',
    };
  }
};

/**
 * Save backup preferences
 */
export const saveBackupPreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem(BACKUP_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving backup preferences:', error);
    throw error;
  }
};

/**
 * Get last backup timestamp
 */
export const getLastBackupTime = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Error getting last backup time:', error);
    return null;
  }
};

/**
 * Save last backup timestamp
 */
export const saveLastBackupTime = async () => {
  try {
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving last backup time:', error);
    throw error;
  }
};

/**
 * Create a manual backup file with timestamp
 */
export const createManualBackup = async () => {
  try {
    const entries = await loadEntries();
    
    if (entries.length === 0) {
      throw new Error('No entries to backup');
    }
    
    // Create backup data with metadata
    const backupData = {
      version: '1.0',
      appName: 'Kharcha',
      backupDate: new Date().toISOString(),
      entryCount: entries.length,
      entries: entries,
    };
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `kharcha_backup_${timestamp}.json`;
    
    // Save backup file
    const fileUri = FileSystem.documentDirectory + fileName;
    const jsonData = JSON.stringify(backupData, null, 2);
    
    await FileSystem.writeAsStringAsync(fileUri, jsonData, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Update last backup time
    await saveLastBackupTime();
    
    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup File',
        UTI: 'public.json',
      });
    }
    
    return {
      success: true,
      fileUri,
      fileName,
      entryCount: entries.length,
      backupDate: new Date(),
    };
  } catch (error) {
    console.error('Error creating manual backup:', error);
    throw error;
  }
};

/**
 * Format backup date for display
 */
export const formatBackupDate = (date) => {
  if (!date) return 'Never';
  
  const now = new Date();
  const backupDate = new Date(date);
  const diffMs = now - backupDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return backupDate.toLocaleDateString();
  }
};


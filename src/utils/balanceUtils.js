import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadEntries } from './storage';

const BANK_BALANCE_KEY = '@expense_tracker_bank_balance';
const CASH_BALANCE_KEY = '@expense_tracker_cash_balance';

/**
 * Get initial bank balance
 */
export const getInitialBankBalance = async () => {
  try {
    const balance = await AsyncStorage.getItem(BANK_BALANCE_KEY);
    return balance ? parseFloat(balance) : null;
  } catch (error) {
    console.error('Error getting initial bank balance:', error);
    return null;
  }
};

/**
 * Get initial cash balance
 */
export const getInitialCashBalance = async () => {
  try {
    const balance = await AsyncStorage.getItem(CASH_BALANCE_KEY);
    return balance ? parseFloat(balance) : null;
  } catch (error) {
    console.error('Error getting initial cash balance:', error);
    return null;
  }
};

/**
 * Set initial bank balance
 */
export const setInitialBankBalance = async (balance) => {
  try {
    await AsyncStorage.setItem(BANK_BALANCE_KEY, balance.toString());
  } catch (error) {
    console.error('Error setting initial bank balance:', error);
    throw error;
  }
};

/**
 * Set initial cash balance
 */
export const setInitialCashBalance = async (balance) => {
  try {
    await AsyncStorage.setItem(CASH_BALANCE_KEY, balance.toString());
  } catch (error) {
    console.error('Error setting initial cash balance:', error);
    throw error;
  }
};

/**
 * Calculate current balance from initial balance and all entries
 * @param {number} initialBalance - Starting balance
 * @param {Array} entries - All entries
 * @param {string} mode - 'upi' or 'cash'
 * @returns {number} Current balance
 */
export const calculateCurrentBalance = (initialBalance, entries, mode) => {
  if (initialBalance === null || initialBalance === undefined) {
    return null;
  }

  return entries.reduce((balance, entry) => {
    // Only process entries for the specified mode
    if (entry.mode !== mode) return balance;

    const amount = parseFloat(entry.amount);
    // Skip invalid amounts
    if (isNaN(amount) || amount <= 0) return balance;

    if (entry.type === 'income') {
      return balance + amount;
    } else if (entry.type === 'expense') {
      return balance - amount;
    } else if (entry.type === 'balance_adjustment') {
      // Balance adjustments: add or subtract based on adjustment_type
      // Default to 'add' if adjustment_type is missing or invalid
      if (entry.adjustment_type === 'add') {
        return balance + amount;
      } else if (entry.adjustment_type === 'subtract') {
        return balance - amount;
      }
      // If adjustment_type is missing, skip this entry (safer than assuming)
      console.warn('Balance adjustment entry missing adjustment_type:', entry);
      return balance;
    }
    return balance;
  }, initialBalance);
};

/**
 * Get current bank balance (calculated from initial balance + entries)
 */
export const getCurrentBankBalance = async () => {
  try {
    const initialBalance = await getInitialBankBalance();
    if (initialBalance === null) return null;

    const entries = await loadEntries();
    return calculateCurrentBalance(initialBalance, entries, 'upi');
  } catch (error) {
    console.error('Error getting current bank balance:', error);
    return null;
  }
};

/**
 * Get current cash balance (calculated from initial balance + entries)
 */
export const getCurrentCashBalance = async () => {
  try {
    const initialBalance = await getInitialCashBalance();
    if (initialBalance === null) return null;

    const entries = await loadEntries();
    return calculateCurrentBalance(initialBalance, entries, 'cash');
  } catch (error) {
    console.error('Error getting current cash balance:', error);
    return null;
  }
};

/**
 * Calculate initial balances from all historical entries
 * This is used for migration - assumes starting balance was 0
 */
export const calculateInitialBalancesFromEntries = async () => {
  try {
    const entries = await loadEntries();
    
    let bankBalance = 0;
    let cashBalance = 0;

    entries.forEach(entry => {
      const amount = parseFloat(entry.amount || 0);
      // Skip invalid amounts
      if (isNaN(amount) || amount <= 0) return;
      
      if (entry.type === 'income') {
        if (entry.mode === 'upi') {
          bankBalance += amount;
        } else if (entry.mode === 'cash') {
          cashBalance += amount;
        }
      } else if (entry.type === 'expense') {
        if (entry.mode === 'upi') {
          bankBalance -= amount;
        } else if (entry.mode === 'cash') {
          cashBalance -= amount;
        }
      } else if (entry.type === 'balance_adjustment') {
        if (entry.mode === 'upi') {
          if (entry.adjustment_type === 'add') {
            bankBalance += amount;
          } else if (entry.adjustment_type === 'subtract') {
            bankBalance -= amount;
          }
          // Skip if adjustment_type is missing or invalid
        } else if (entry.mode === 'cash') {
          if (entry.adjustment_type === 'add') {
            cashBalance += amount;
          } else if (entry.adjustment_type === 'subtract') {
            cashBalance -= amount;
          }
          // Skip if adjustment_type is missing or invalid
        }
      }
    });

    return { bankBalance, cashBalance };
  } catch (error) {
    console.error('Error calculating initial balances from entries:', error);
    return { bankBalance: 0, cashBalance: 0 };
  }
};

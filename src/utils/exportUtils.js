import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { formatDateDisplay, formatDate } from './dateUtils';

/**
 * Save file to device downloads/folder
 * Uses sharing dialog with "Save" option for better compatibility
 */
const saveFileToDevice = async (fileUri, fileName, mimeType) => {
  try {
    // For "save" action, we'll use sharing with a hint to save
    // The sharing dialog on both platforms allows users to save to device
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: mimeType,
        dialogTitle: 'Save File to Device',
        UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json',
      });
      return { success: true, saved: true };
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error saving file to device:', error);
    return { success: false, saved: false, error: error.message };
  }
};

/**
 * Export entries to CSV file (Excel compatible) with options
 * @param {Array} entries - Entries to export
 * @param {Object} options - Export options { action: 'share' | 'save', dateRange: { start, end, period } }
 */
export const exportToExcel = async (entries, options = {}) => {
  try {
    // Prepare CSV data
    let csvContent = 'Date,Type,Amount,Payment Method,Note\n';
    
    entries.forEach((entry) => {
      const date = formatDateDisplay(entry.date);
      let type = '';
      if (entry.type === 'expense') {
        type = 'Expense';
      } else if (entry.type === 'income') {
        type = 'Income';
      } else if (entry.type === 'balance_adjustment') {
        type = 'Balance Adjustment';
      } else if (entry.type === 'cash_withdrawal') {
        type = 'Cash Withdrawal';
      } else if (entry.type === 'cash_deposit') {
        type = 'Cash Deposit';
      } else {
        type = entry.type || 'Unknown';
      }
      const amount = parseFloat(entry.amount).toFixed(2);
      let paymentMethod = '';
      if (entry.type === 'cash_withdrawal') {
        paymentMethod = 'UPI → Cash';
      } else if (entry.type === 'cash_deposit') {
        paymentMethod = 'Cash → UPI';
      } else {
        paymentMethod = (entry.mode || 'upi') === 'upi' ? 'UPI' : 'Cash';
      }
      const note = (entry.note || '').replace(/,/g, ';'); // Replace commas in notes
      csvContent += `${date},${type},${amount},${paymentMethod},${note}\n`;
    });

    // Add summary
    const totalExpense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncome = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const balance = totalIncome - totalExpense;
    
    // Payment method totals
    const expenseUpi = entries
      .filter(e => e.type === 'expense' && (e.mode || 'upi') === 'upi')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const expenseCash = entries
      .filter(e => e.type === 'expense' && (e.mode || 'upi') === 'cash')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const incomeUpi = entries
      .filter(e => e.type === 'income' && (e.mode || 'upi') === 'upi')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const incomeCash = entries
      .filter(e => e.type === 'income' && (e.mode || 'upi') === 'cash')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    csvContent += '\n';
    csvContent += 'SUMMARY\n';
    csvContent += `Total Expense,,${totalExpense.toFixed(2)},,\n`;
    csvContent += `Total Income,,${totalIncome.toFixed(2)},,\n`;
    csvContent += `Net Balance,,${balance.toFixed(2)},,\n`;
    csvContent += '\n';
    csvContent += 'PAYMENT METHOD BREAKDOWN\n';
    csvContent += `Expense - UPI,,${expenseUpi.toFixed(2)},,\n`;
    csvContent += `Expense - Cash,,${expenseCash.toFixed(2)},,\n`;
    csvContent += `Income - UPI,,${incomeUpi.toFixed(2)},,\n`;
    csvContent += `Income - Cash,,${incomeCash.toFixed(2)},,\n`;

    // Generate file name with timestamp and date range info
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName = `expense_tracker_${timestamp}.csv`;
    
    // Add date range info to filename if provided
    if (options.dateRange) {
      if (options.dateRange.period && options.dateRange.period !== 'custom') {
        fileName = `expense_tracker_${options.dateRange.period}_${timestamp}.csv`;
      } else if (options.dateRange.start && options.dateRange.end) {
        const startStr = formatDate(options.dateRange.start).replace(/-/g, '_');
        const endStr = formatDate(options.dateRange.end).replace(/-/g, '_');
        fileName = `expense_tracker_${startStr}_to_${endStr}.csv`;
      }
    }

    // Save file
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Handle export action
    const action = options.action || 'share';
    
    if (action === 'save') {
      // Save to device - opens share dialog with save option
      const saveResult = await saveFileToDevice(fileUri, fileName, 'text/csv');
      if (saveResult.success && saveResult.saved) {
        return { 
          success: true, 
          fileUri,
          saved: true,
          message: 'Choose where to save the file (Downloads, Drive, etc.)'
        };
      } else {
        return { 
          success: false, 
          fileUri,
          saved: false,
          message: saveResult.error || 'Failed to save file'
        };
      }
    } else {
      // Share/download file (CSV can be opened in Excel)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Expense Data',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      return { success: true, fileUri, saved: false };
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Export entries to JSON file with options
 * @param {Array} entries - Entries to export
 * @param {Object} options - Export options { action: 'share' | 'save', dateRange: { start, end, period } }
 */
export const exportToJSON = async (entries, options = {}) => {
  try {
    // Generate file name with timestamp and date range info
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName = `expense_tracker_${timestamp}.json`;
    
    // Add date range info to filename if provided
    if (options.dateRange) {
      if (options.dateRange.period && options.dateRange.period !== 'custom') {
        fileName = `expense_tracker_${options.dateRange.period}_${timestamp}.json`;
      } else if (options.dateRange.start && options.dateRange.end) {
        const startStr = formatDate(options.dateRange.start).replace(/-/g, '_');
        const endStr = formatDate(options.dateRange.end).replace(/-/g, '_');
        fileName = `expense_tracker_${startStr}_to_${endStr}.json`;
      }
    }
    
    const fileUri = FileSystem.documentDirectory + fileName;
    const jsonData = JSON.stringify(entries, null, 2);

    await FileSystem.writeAsStringAsync(fileUri, jsonData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Handle export action
    const action = options.action || 'share';
    
    if (action === 'save') {
      // Save to device - opens share dialog with save option
      const saveResult = await saveFileToDevice(fileUri, fileName, 'application/json');
      if (saveResult.success && saveResult.saved) {
        return { 
          success: true, 
          fileUri,
          saved: true,
          message: 'Choose where to save the file (Downloads, Drive, etc.)'
        };
      } else {
        return { 
          success: false, 
          fileUri,
          saved: false,
          message: saveResult.error || 'Failed to save file'
        };
      }
    } else {
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Expense Data',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      return { success: true, fileUri, saved: false };
    }
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};


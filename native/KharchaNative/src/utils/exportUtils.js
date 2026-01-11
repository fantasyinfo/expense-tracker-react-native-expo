import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform, Alert } from 'react-native';
import { formatDateDisplay, formatDate, parseDate } from './dateUtils';
import { loadCategories } from './categoryStorage';

/**
 * Save file to device downloads/folder
 * Uses sharing dialog with "Save" option for better compatibility
 */
const saveFileToDevice = async (fileUri, fileName, mimeType) => {
  try {
    // For "save" action, we'll use sharing with a hint to save
    // The sharing dialog on both platforms allows users to save to device
    await Share.open({
      url: fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`,
      type: mimeType,
      title: 'Save File to Device',
      filename: fileName,
    });
    return { success: true, saved: true };
  } catch (error) {
    if (error.message === 'User did not share') {
      return { success: false, saved: false, error: 'User cancelled' };
    }
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
    // Prepare CSV data with header note
    // Note: CSV doesn't support bold formatting, but Excel will show the header row
    let csvContent = '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += 'KHARCHA EXPENSE TRACKER - EXPORT REPORT\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += '\n';
    csvContent += 'HEADER (Format as Bold in Excel): Date, Type, Amount, Payment Method, Category, Note\n';
    csvContent += '\n';
    csvContent += 'Date,Type,Amount,Payment Method,Category,Note\n';
    
    // Load categories for display
    const categories = await loadCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    entries.forEach((entry) => {
      // Use YYYY-MM-DD format for date
      const date = entry.date; // Already in YYYY-MM-DD format from storage
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
      const category = entry.category_id ? (categoryMap.get(entry.category_id) || '') : '';
      const note = (entry.note || '').replace(/,/g, ';'); // Replace commas in notes
      csvContent += `${date},${type},${amount},${paymentMethod},${category},${note}\n`;
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
    
    // Advertisement Section
    csvContent += '\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += 'ADVERTISEMENT\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';
    csvContent += 'This report was generated by Kharcha Expense Tracker App\n';
    csvContent += '\n';
    csvContent += '═══════════════════════════════════════════════════════════════════════════════\n';

    // Generate file name with app name and filters
    const getTypeLabel = (type) => {
      const typeMap = {
        'expense': 'expense',
        'income': 'income',
        'withdrawal': 'withdrawal',
        'deposit': 'deposit',
        'all': 'all'
      };
      return typeMap[type] || 'all';
    };
    
    const entryType = options.entryType || 'all';
    const typeLabel = getTypeLabel(entryType);
    
    let fileName = `kharcha-expense-tracker-app-${typeLabel}-report`;
    
    // Add date range info to filename if provided
    if (options.dateRange) {
      if (options.dateRange.period && options.dateRange.period !== 'custom') {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.csv`;
      } else if (options.dateRange.start && options.dateRange.end) {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.csv`;
      } else {
        fileName += `.csv`;
      }
    } else {
      fileName += `.csv`;
    }

    // Save file
    const fileUri = RNFS.DocumentDirectoryPath + '/' + fileName;
    await RNFS.writeFile(fileUri, csvContent, 'utf8');

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
      try {
        await Share.open({
          url: fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`,
          type: 'text/csv',
          title: 'Export Expense Data',
          filename: fileName,
        });
      } catch (error) {
        if (error.message !== 'User did not share') {
          Alert.alert('Error', 'Failed to share file');
        }
      }
      return { success: true, fileUri, saved: false };
    }
  } catch (error) {
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
    // Generate file name with app name and filters
    const getTypeLabel = (type) => {
      const typeMap = {
        'expense': 'expense',
        'income': 'income',
        'withdrawal': 'withdrawal',
        'deposit': 'deposit',
        'all': 'all'
      };
      return typeMap[type] || 'all';
    };
    
    const entryType = options.entryType || 'all';
    const typeLabel = getTypeLabel(entryType);
    
    let fileName = `kharcha-expense-tracker-app-${typeLabel}-report`;
    
    // Add date range info to filename if provided
    if (options.dateRange) {
      if (options.dateRange.period && options.dateRange.period !== 'custom') {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.json`;
      } else if (options.dateRange.start && options.dateRange.end) {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.json`;
      } else {
        fileName += `.json`;
      }
    } else {
      fileName += `.json`;
    }
    
    const fileUri = RNFS.DocumentDirectoryPath + '/' + fileName;
    
    // Create JSON object with data and advertisement
    const jsonExport = {
      metadata: {
        generatedBy: 'Kharcha Expense Tracker App',

        generatedAt: new Date().toISOString(),
        entryCount: entries.length,
        entryType: entryType,
        dateRange: options.dateRange || null,
      },
      data: entries,

    };
    
    const jsonData = JSON.stringify(jsonExport, null, 2);

    await RNFS.writeFile(fileUri, jsonData, 'utf8');

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
      try {
        await Share.open({
          url: Platform.OS === 'android' ? `file://${fileUri}` : fileUri,
          type: 'application/json',
          title: 'Export Expense Data',
          filename: fileName,
        });
      } catch (error) {
        if (error.message !== 'User did not share') {
          Alert.alert('Error', 'Failed to share file');
        }
      }
      return { success: true, fileUri, saved: false };
    }
  } catch (error) {
    throw error;
  }
};


import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
    csvContent += 'Developed by: Gaurav Sharma\n';
    csvContent += 'Phone: +91 6397520221\n';
    csvContent += 'Email: gs27349@gmail.com\n';
    csvContent += '\n';
    csvContent += 'We develop custom mobile and web applications:\n';
    csvContent += '• Expense Tracker Apps\n';
    csvContent += '• E-Commerce Applications\n';
    csvContent += '• Business Management Systems\n';
    csvContent += '• Inventory Management Apps\n';
    csvContent += '• CRM Solutions\n';
    csvContent += '• Food Delivery Apps\n';
    csvContent += '• Healthcare Management Systems\n';
    csvContent += '• Educational Platforms\n';
    csvContent += '• Social Media Apps\n';
    csvContent += '• Real Estate Applications\n';
    csvContent += '\n';
    csvContent += 'If you want to develop an app like this, please contact us!\n';
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
    
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Create JSON object with data and advertisement
    const jsonExport = {
      metadata: {
        generatedBy: 'Kharcha Expense Tracker App',
        developer: 'Gaurav Sharma',
        phone: '+91 6397520221',
        email: 'gs27349@gmail.com',
        generatedAt: new Date().toISOString(),
        entryCount: entries.length,
        entryType: entryType,
        dateRange: options.dateRange || null,
      },
      data: entries,
      advertisement: {
        message: 'This report was generated by Kharcha Expense Tracker App developed by Gaurav Sharma. If you also want to develop an app like this, please contact +91 6397520221 or gs27349@gmail.com',
        services: [
          'Expense Tracker Apps',
          'E-Commerce Applications',
          'Business Management Systems',
          'Inventory Management Apps',
          'CRM Solutions',
          'Food Delivery Apps',
          'Healthcare Management Systems',
          'Educational Platforms',
          'Social Media Apps',
          'Real Estate Applications',
        ],
      },
    };
    
    const jsonData = JSON.stringify(jsonExport, null, 2);

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


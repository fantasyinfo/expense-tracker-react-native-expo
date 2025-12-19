import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatDateDisplay } from './dateUtils';

/**
 * Export entries to CSV file (Excel compatible) and share/download
 */
export const exportToExcel = async (entries) => {
  try {
    // Prepare CSV data
    let csvContent = 'Date,Type,Amount,Note\n';
    
    entries.forEach((entry) => {
      const date = formatDateDisplay(entry.date);
      const type = entry.type === 'expense' ? 'Expense' : 'Income';
      const amount = parseFloat(entry.amount).toFixed(2);
      const note = (entry.note || '').replace(/,/g, ';'); // Replace commas in notes
      csvContent += `${date},${type},${amount},${note}\n`;
    });

    // Add summary
    const totalExpense = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncome = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const balance = totalIncome - totalExpense;

    csvContent += '\n';
    csvContent += 'SUMMARY\n';
    csvContent += `Total Expense,,${totalExpense.toFixed(2)},\n`;
    csvContent += `Total Income,,${totalIncome.toFixed(2)},\n`;
    csvContent += `Net Balance,,${balance.toFixed(2)},\n`;

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `expense_tracker_${timestamp}.csv`;

    // Save file
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share/download file (CSV can be opened in Excel)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expense Data',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      alert('Sharing is not available on this device');
    }

    return { success: true, fileUri };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Export entries to JSON file
 */
export const exportToJSON = async (entries) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `expense_tracker_${timestamp}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;
    const jsonData = JSON.stringify(entries, null, 2);

    await FileSystem.writeAsStringAsync(fileUri, jsonData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Expense Data',
      });
    }

    return { success: true, fileUri };
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};


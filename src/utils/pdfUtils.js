import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { formatDate, parseDate } from './dateUtils';
import { loadCategories } from './categoryStorage';

/**
 * Generate HTML content for PDF
 */
const generatePDFHTML = async (entries, options = {}) => {
  const categories = await loadCategories();
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
  
  // Calculate totals
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
  
  // Date range info
  let dateRangeText = 'All Entries';
  if (options.dateRange) {
    if (options.dateRange.period && options.dateRange.period !== 'custom') {
      dateRangeText = `${options.dateRange.period.charAt(0).toUpperCase() + options.dateRange.period.slice(1)} Report`;
    } else if (options.dateRange.start && options.dateRange.end) {
      dateRangeText = `${formatDate(options.dateRange.start)} to ${formatDate(options.dateRange.end)}`;
    }
  }
  
  const entryTypeLabel = options.entryType && options.entryType !== 'all' 
    ? options.entryType.charAt(0).toUpperCase() + options.entryType.slice(1)
    : 'All';
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #ffffff;
          color: #000000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #007AFF;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #007AFF;
          font-weight: 700;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        .summary-card {
          background: #f5f5f5;
          padding: 15px 20px;
          border-radius: 12px;
          min-width: 150px;
          margin: 10px;
          text-align: center;
          border: 2px solid #e0e0e0;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #000;
        }
        .summary-value.expense { color: #FF3B30; }
        .summary-value.income { color: #34C759; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th {
          background: #007AFF;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .amount-expense { color: #FF3B30; font-weight: 600; }
        .amount-income { color: #34C759; font-weight: 600; }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          text-align: center;
          color: #666;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Kharcha Expense Tracker</h1>
        <p>${entryTypeLabel} Report - ${dateRangeText}</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Total Expense</div>
          <div class="summary-value expense">₹${totalExpense.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Income</div>
          <div class="summary-value income">₹${totalIncome.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Net Balance</div>
          <div class="summary-value ${balance >= 0 ? 'income' : 'expense'}">₹${balance.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Entries</div>
          <div class="summary-value">${entries.length}</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Expense - Digital</div>
          <div class="summary-value expense">₹${expenseUpi.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Expense - Cash</div>
          <div class="summary-value expense">₹${expenseCash.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Income - Digital</div>
          <div class="summary-value income">₹${incomeUpi.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Income - Cash</div>
          <div class="summary-value income">₹${incomeCash.toFixed(2)}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Category</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  entries.forEach((entry) => {
    const date = entry.date;
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
      paymentMethod = 'Digital → Cash';
    } else if (entry.type === 'cash_deposit') {
      paymentMethod = 'Cash → Digital';
    } else {
      paymentMethod = (entry.mode || 'upi') === 'upi' ? 'Digital' : 'Cash';
    }
    const category = entry.category_id ? (categoryMap.get(entry.category_id) || '') : '';
    const note = (entry.note || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const amountClass = entry.type === 'expense' ? 'amount-expense' : 'amount-income';
    
    html += `
          <tr>
            <td>${date}</td>
            <td>${type}</td>
            <td class="${amountClass}">₹${amount}</td>
            <td>${paymentMethod}</td>
            <td>${category}</td>
            <td>${note}</td>
          </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
      
      <div class="footer">
        <div class="advertisement-section">
          <h3 style="color: #007AFF; margin-bottom: 15px; font-size: 16px; text-align: center;">
            ════════════════════════════════════════════════════
          </h3>
          <p style="text-align: center; font-weight: 700; color: #007AFF; margin-bottom: 10px; font-size: 14px;">
            This report was generated by Kharcha Expense Tracker App
          </p>
          <p style="text-align: center; margin-bottom: 5px; font-size: 12px;">
            <strong>Developed by:</strong> Gaurav Sharma
          </p>
          <p style="text-align: center; margin-bottom: 5px; font-size: 12px;">
            <strong>Phone:</strong> +91 6397520221
          </p>
          <p style="text-align: center; margin-bottom: 20px; font-size: 12px;">
            <strong>Email:</strong> gs27349@gmail.com
          </p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-weight: 700; color: #000; margin-bottom: 10px; font-size: 13px; text-align: center;">
              We Develop Custom Mobile & Web Applications:
            </p>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Expense Tracker Apps</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">E-Commerce Apps</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Business Management</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Inventory Management</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">CRM Solutions</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Food Delivery Apps</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Healthcare Systems</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Educational Platforms</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Social Media Apps</span>
              <span style="background: #007AFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">Real Estate Apps</span>
            </div>
          </div>
          
          <p style="text-align: center; font-weight: 700; color: #007AFF; margin-top: 15px; font-size: 13px;">
            If you want to develop an app like this, please contact us!
          </p>
          <h3 style="color: #007AFF; margin-top: 15px; font-size: 16px; text-align: center;">
            ════════════════════════════════════════════════════
          </h3>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

/**
 * Export entries to PDF
 * Note: This creates an HTML file that can be converted to PDF using external tools
 * or shared as HTML for viewing/printing
 */
export const exportToPDF = async (entries, options = {}) => {
  try {
    // Generate HTML content
    const htmlContent = await generatePDFHTML(entries, options);
    
    // Generate file name
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
    
    if (options.dateRange) {
      if (options.dateRange.period && options.dateRange.period !== 'custom') {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.html`;
      } else if (options.dateRange.start && options.dateRange.end) {
        const startStr = formatDate(options.dateRange.start);
        const endStr = formatDate(options.dateRange.end);
        fileName += `-${startStr}-to-${endStr}.html`;
      } else {
        fileName += `.html`;
      }
    } else {
      fileName += `.html`;
    }
    
    // Save HTML file
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Handle export action
    const action = options.action || 'share';
    
    if (action === 'save') {
      const saveResult = await saveFileToDevice(fileUri, fileName, 'text/html');
      if (saveResult.success && saveResult.saved) {
        return { 
          success: true, 
          fileUri,
          saved: true,
          message: 'HTML file saved. You can open it in a browser and print to PDF.'
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
      // Share HTML file (can be opened in browser and printed to PDF)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Export Expense Report',
          UTI: 'public.html',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      return { 
        success: true, 
        fileUri, 
        saved: false,
        message: 'Open the HTML file in a browser and use Print > Save as PDF'
      };
    }
  } catch (error) {
    throw error;
  }
};

const saveFileToDevice = async (fileUri, fileName, mimeType) => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: mimeType,
        dialogTitle: 'Save File to Device',
        UTI: mimeType === 'text/html' ? 'public.html' : 'public.json',
      });
      return { success: true, saved: true };
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    return { success: false, saved: false, error: error.message };
  }
};


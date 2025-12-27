import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { parseDate } from './dateUtils';
import { saveEntries, loadEntries } from './storage';

/**
 * Parse CSV content and convert to entries array
 */
export const parseCSV = (csvContent) => {
  try {
    console.log('=== CSV Import Debug ===');
    console.log('CSV Content length:', csvContent.length);
    console.log('First 500 chars:', csvContent.substring(0, 500));
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('Total lines:', lines.length);
    console.log('First few lines:', lines.slice(0, 5));
    
    const entries = [];
    let skippedCount = 0;
    let processedCount = 0;
    
    // Verify header row matches export format exactly
    if (lines.length > 0) {
      const header = lines[0].trim();
      const expectedHeader = 'Date,Type,Amount,Payment Method,Note';
      console.log('=== Header Validation ===');
      console.log('Expected:', expectedHeader);
      console.log('Actual:', header);
      console.log('Match:', header === expectedHeader ? '✅ YES' : '❌ NO');
      
      if (header !== expectedHeader) {
        console.warn(`⚠️ Header mismatch! Expected: "${expectedHeader}", Got: "${header}"`);
        // Still try to parse, but log warning
      } else {
        console.log('✅ Header matches export format exactly');
      }
    }
    
    // Skip header row and summary rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        console.log(`Skipping empty line ${i}`);
        continue;
      }
      
      // Stop at summary sections (these are not entries)
      if (line.startsWith('SUMMARY') || line.startsWith('PAYMENT METHOD BREAKDOWN')) {
        console.log(`Reached summary section at line ${i}, stopping`);
        break;
      }
      
      // Parse CSV line (handle commas in quoted fields)
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Add last value
      
      processedCount++;
      console.log(`\n--- Processing Line ${i} ---`);
      console.log(`Raw line: "${line}"`);
      console.log(`Parsed values (${values.length}):`, values);
      
      if (values.length >= 3) {
        const [dateStr, typeStr, amountStr, paymentMethodStr, noteStr] = values;
        
        console.log(`  Parsing: date="${dateStr}", type="${typeStr}", amount="${amountStr}"`);
        
        // Skip if invalid
        if (!dateStr || !typeStr || !amountStr) {
          console.log(`  Skipped: Missing required fields`);
          skippedCount++;
          continue;
        }
        
        // Parse date - Export uses formatDateDisplay which returns DD/MM/YYYY format
        // This is the PRIMARY format we expect from exports
        let date;
        try {
          // PRIMARY format: DD/MM/YYYY (from formatDateDisplay in export)
          // This matches exactly what exportToExcel produces
          if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = dateStr.split('/');
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log(`  ✅ Date parsed (DD/MM/YYYY - Export format): ${dateStr} -> ${date}`);
          } 
          // Secondary format: YYYY-MM-DD (internal format, for compatibility)
          else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            date = dateStr;
            console.log(`  ✅ Date parsed (YYYY-MM-DD - Internal format): ${date}`);
          } 
          // Fallback: Try parsing as Date object (for other formats)
          else {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              date = `${year}-${month}-${day}`;
              console.log(`  ⚠️ Date parsed (Fallback Date object): ${dateStr} -> ${date}`);
            } else {
              console.log(`  ❌ Skipped: Invalid date format: ${dateStr}`);
              skippedCount++;
              continue; // Skip invalid date
            }
          }
        } catch (e) {
          console.log(`  ❌ Skipped: Date parsing error: ${e.message}, dateStr: ${dateStr}`);
          skippedCount++;
          continue; // Skip invalid date
        }
        
        // Parse amount
        const amount = parseFloat(amountStr.replace(/[₹,\s]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          console.log(`  Skipped: Invalid amount: ${amountStr} -> ${amount}`);
          skippedCount++;
          continue;
        }
        
        console.log(`  Amount parsed: ${amountStr} -> ${amount}`);
        
        // Determine type and mode
        let type, mode, adjustmentType;
        const typeLower = typeStr.toLowerCase();
        
        if (typeLower.includes('expense')) {
          type = 'expense';
        } else if (typeLower.includes('income')) {
          type = 'income';
        } else if (typeLower.includes('balance adjustment')) {
          type = 'balance_adjustment';
          // Try to determine adjustment type from amount or note
          adjustmentType = 'add'; // Default
        } else if (typeLower.includes('cash withdrawal')) {
          type = 'cash_withdrawal';
        } else if (typeLower.includes('cash deposit')) {
          type = 'cash_deposit';
        } else {
          console.log(`  Skipped: Unknown type: ${typeStr}`);
          skippedCount++;
          continue; // Skip unknown types
        }
        
        console.log(`  Type determined: ${type}`);
        
        // Determine mode from payment method
        if (paymentMethodStr) {
          if (paymentMethodStr.includes('UPI → Cash') || paymentMethodStr.includes('Cash → UPI')) {
            // Mode is handled by type (cash_withdrawal/cash_deposit)
            mode = 'upi'; // Default, but won't be used for transfers
          } else if (paymentMethodStr.toLowerCase().includes('cash')) {
            mode = 'cash';
          } else {
            mode = 'upi';
          }
        } else {
          mode = 'upi'; // Default
        }
        
        // Parse note (restore semicolons to commas)
        const note = (noteStr || '').replace(/;/g, ',');
        
        // Create entry
        const entry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
          amount,
          note: note || undefined,
          type,
          mode: type === 'cash_withdrawal' || type === 'cash_deposit' ? undefined : mode,
          date,
        };
        
        if (type === 'balance_adjustment' && adjustmentType) {
          entry.adjustment_type = adjustmentType;
        }
        
        console.log(`  Entry created:`, entry);
        entries.push(entry);
      } else {
        console.log(`  Skipped: Not enough values (${values.length} < 3)`);
        skippedCount++;
      }
    }
    
        console.log(`\n=== CSV Import Summary ===`);
    console.log(`Total lines in file: ${lines.length}`);
    console.log(`Data lines processed: ${processedCount}`);
    console.log(`✅ Entries created: ${entries.length}`);
    console.log(`❌ Lines skipped: ${skippedCount}`);
    
    if (entries.length === 0) {
      console.error('❌ ERROR: No entries were created!');
      console.log('This could mean:');
      console.log('1. Date format mismatch (export uses DD/MM/YYYY)');
      console.log('2. Type names don\'t match (should be: Expense, Income, etc.)');
      console.log('3. Amount format issue');
      console.log('4. File structure doesn\'t match export format');
    } else {
      console.log('✅ Import successful!');
    }
    
    return entries;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV file. Please check the file format.');
  }
};

/**
 * Parse JSON content and convert to entries array
 */
export const parseJSON = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Handle both array and object with entries property
    let entries = Array.isArray(data) ? data : (data.entries || []);
    
    // Validate and normalize entries
    const normalizedEntries = entries.map((entry, index) => {
      // Ensure required fields
      if (!entry.amount || !entry.type || !entry.date) {
        throw new Error(`Entry at index ${index} is missing required fields`);
      }
      
      // Generate ID if missing
      if (!entry.id) {
        entry.id = Date.now().toString() + index + Math.random().toString(36).substr(2, 9);
      }
      
      // Ensure mode exists (default to 'upi')
      if (!entry.mode && entry.type !== 'cash_withdrawal' && entry.type !== 'cash_deposit') {
        entry.mode = 'upi';
      }
      
      // Validate date format
      if (!entry.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Try to parse and reformat
        const parsedDate = new Date(entry.date);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const day = String(parsedDate.getDate()).padStart(2, '0');
          entry.date = `${year}-${month}-${day}`;
        } else {
          throw new Error(`Entry at index ${index} has invalid date format`);
        }
      }
      
      return entry;
    });
    
    return normalizedEntries;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse JSON file. Please check the file format.');
  }
};

/**
 * Pick and read a file (CSV or JSON)
 */
export const pickAndReadFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'application/json', '*/*'],
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      return { canceled: true };
    }
    
    const file = result.assets[0];
    
    // Read file content
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return {
      canceled: false,
      content,
      fileName: file.name,
      mimeType: file.mimeType,
    };
  } catch (error) {
    console.error('Error picking file:', error);
    throw error;
  }
};

/**
 * Import entries from CSV or JSON file
 * @param {string} content - File content
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @param {boolean} merge - If true, merge with existing entries. If false, replace all entries.
 */
export const importEntries = async (content, fileName, mimeType, merge = false) => {
  try {
    let importedEntries = [];
    
    // Determine file type and parse
    if (fileName.endsWith('.json') || mimeType === 'application/json') {
      importedEntries = parseJSON(content);
    } else if (fileName.endsWith('.csv') || mimeType === 'text/csv') {
      importedEntries = parseCSV(content);
    } else {
      // Try to detect by content
      if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        importedEntries = parseJSON(content);
      } else {
        importedEntries = parseCSV(content);
      }
    }
    
    if (importedEntries.length === 0) {
      throw new Error('No valid entries found in the file');
    }
    
    // Handle merge or replace
    if (merge) {
      // Load existing entries and merge
      const existingEntries = await loadEntries();
      
      // Combine entries (avoid duplicates by ID if possible)
      const existingIds = new Set(existingEntries.map(e => e.id));
      const newEntries = importedEntries.filter(e => !existingIds.has(e.id));
      
      const allEntries = [...existingEntries, ...newEntries];
      await saveEntries(allEntries);
      
      return {
        success: true,
        imported: importedEntries.length,
        added: newEntries.length,
        skipped: importedEntries.length - newEntries.length,
        total: allEntries.length,
      };
    } else {
      // Replace all entries
      await saveEntries(importedEntries);
      
      return {
        success: true,
        imported: importedEntries.length,
        added: importedEntries.length,
        skipped: 0,
        total: importedEntries.length,
      };
    }
  } catch (error) {
    console.error('Error importing entries:', error);
    throw error;
  }
};


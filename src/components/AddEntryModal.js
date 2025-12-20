import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDateDisplay, parseDate } from '../utils/dateUtils';
import { addEntry } from '../utils/storage';

const AddEntryModal = ({ visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [mode, setMode] = useState('upi');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract' for balance adjustments

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const entryData = {
      amount: parsedAmount,
      note: note.trim(),
      type,
      mode,
      date: formatDate(date),
    };

    // Add adjustment_type for balance adjustments (required field)
    if (type === 'balance_adjustment') {
      if (!adjustmentType || (adjustmentType !== 'add' && adjustmentType !== 'subtract')) {
        console.error('Invalid adjustment_type:', adjustmentType);
        return;
      }
      entryData.adjustment_type = adjustmentType;
    }

    await addEntry(entryData);

    // Reset form
    setAmount('');
    setNote('');
    setType('expense');
    setMode('upi');
    setDate(new Date());
    setAdjustmentType('add');
    onSave();
  };

  const handleClose = () => {
    setAmount('');
    setNote('');
    setType('expense');
    setMode('upi');
    setDate(new Date());
    setAdjustmentType('add');
    setShowDatePicker(false);
    onClose();
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Entry</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Professional Type Toggle */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActiveExpense,
              ]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActiveIncome,
              ]}
              onPress={() => setType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'balance_adjustment' && styles.typeButtonActiveAdjustment,
              ]}
              onPress={() => setType('balance_adjustment')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'balance_adjustment' && styles.typeButtonTextActive,
                ]}
              >
                Adjust
              </Text>
            </TouchableOpacity>
          </View>

          {/* Adjustment Type Toggle - Only show for balance adjustments */}
          {type === 'balance_adjustment' && (
            <View style={styles.adjustmentContainer}>
              <TouchableOpacity
                style={[
                  styles.adjustmentButton,
                  adjustmentType === 'add' && styles.adjustmentButtonActive,
                ]}
                onPress={() => setAdjustmentType('add')}
              >
                <Text
                  style={[
                    styles.adjustmentButtonText,
                    adjustmentType === 'add' && styles.adjustmentButtonTextActive,
                  ]}
                >
                  Add to Balance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.adjustmentButton,
                  adjustmentType === 'subtract' && styles.adjustmentButtonActive,
                ]}
                onPress={() => setAdjustmentType('subtract')}
              >
                <Text
                  style={[
                    styles.adjustmentButtonText,
                    adjustmentType === 'subtract' && styles.adjustmentButtonTextActive,
                  ]}
                >
                  Subtract from Balance
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Amount *"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus={true}
            />
          </View>

          {/* Note Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Note (optional)"
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline={false}
            />
          </View>

          {/* Professional Mode Toggle */}
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'upi' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('upi')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'upi' && styles.modeButtonTextActive,
                ]}
              >
                UPI
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'cash' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('cash')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'cash' && styles.modeButtonTextActive,
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Input */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
            <Text style={styles.dateText}>{formatDateDisplay(formatDate(date))}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888888" />
          </TouchableOpacity>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              themeVariant="dark"
              textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!amount || parseFloat(amount) <= 0) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 0,
    backgroundColor: '#2C2C2E',
    padding: 2,
    gap: 2,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  typeButtonActiveExpense: {
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 2,
    borderBottomColor: '#388e3c',
  },
  typeButtonActiveAdjustment: {
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 2,
    borderBottomColor: '#FF9800',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 0,
    backgroundColor: '#2C2C2E',
    padding: 2,
    gap: 2,
  },
  adjustmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  adjustmentButtonActive: {
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 2,
    borderBottomColor: '#888888',
  },
  adjustmentButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
  },
  adjustmentButtonTextActive: {
    color: '#FFFFFF',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 0,
    backgroundColor: '#2C2C2E',
    padding: 2,
    gap: 2,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  modeButtonActive: {
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888888',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    padding: 0,
    fontWeight: '500',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2a2a2a',
    opacity: 0.5,
  },
  saveIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default AddEntryModal;

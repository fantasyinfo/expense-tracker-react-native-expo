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
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    await addEntry({
      amount: parseFloat(amount),
      note: note.trim(),
      type,
      date: formatDate(date),
    });

    // Reset form
    setAmount('');
    setNote('');
    setType('expense');
    setDate(new Date());
    onSave();
  };

  const handleClose = () => {
    setAmount('');
    setNote('');
    setType('expense');
    setDate(new Date());
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
              <Ionicons name="close" size={24} color="#b0b0b0" />
            </TouchableOpacity>
          </View>

          {/* Type Toggle */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActiveExpense,
              ]}
              onPress={() => setType('expense')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === 'expense' ? '#fff' : '#d32f2f'}
                style={styles.typeIcon}
              />
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
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === 'income' ? '#fff' : '#388e3c'}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  typeButtonActiveExpense: {
    backgroundColor: '#d32f2f',
    borderWidth: 1,
    borderColor: '#b71c1c',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#388e3c',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  typeIcon: {
    marginRight: 4,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    padding: 0,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#1565c0',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdbdbd',
    borderColor: '#9e9e9e',
  },
  saveIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AddEntryModal;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDateDisplay, parseDate } from '../utils/dateUtils';
import { addEntry } from '../utils/storage';
import { updateStreak, checkAchievements } from '../utils/engagementUtils';
import Colors from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddEntryModal = ({ visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [mode, setMode] = useState('upi');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add');

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

    if (type === 'balance_adjustment') {
      if (!adjustmentType || (adjustmentType !== 'add' && adjustmentType !== 'subtract')) {
        console.error('Invalid adjustment_type:', adjustmentType);
        return;
      }
      entryData.adjustment_type = adjustmentType;
    }

    await addEntry(entryData);

    // Update streak (only for non-balance-adjustment entries)
    // Note: Achievement checking will be handled in HomeScreen.handleEntryAdded
    // to properly show the notification modal
    if (type !== 'balance_adjustment') {
      await updateStreak();
    }

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
            <View>
              <Text style={styles.modalTitle}>Add Entry</Text>
              <Text style={styles.modalSubtitle}>Record a new transaction</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.scrollViewContainer}>
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled={true}
            >
            {/* Type Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Transaction Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'expense' && styles.typeButtonActiveExpense,
                  ]}
                  onPress={() => setType('expense')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={18} 
                    color={type === 'expense' ? '#FFFFFF' : Colors.status.expense} 
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
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={18} 
                    color={type === 'income' ? '#FFFFFF' : Colors.status.income} 
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
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'balance_adjustment' && styles.typeButtonActiveAdjustment,
                  ]}
                  onPress={() => setType('balance_adjustment')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="swap-vertical" 
                    size={18} 
                    color={type === 'balance_adjustment' ? '#FFFFFF' : Colors.status.adjustment} 
                  />
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
            </View>

            {/* Adjustment Type Toggle */}
            {type === 'balance_adjustment' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Adjustment Type</Text>
                <View style={styles.adjustmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentButton,
                      adjustmentType === 'add' && styles.adjustmentButtonActive,
                    ]}
                    onPress={() => setAdjustmentType('add')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="add-circle" 
                      size={18} 
                      color={adjustmentType === 'add' ? '#FFFFFF' : Colors.status.income} 
                    />
                    <Text
                      style={[
                        styles.adjustmentButtonText,
                        adjustmentType === 'add' && styles.adjustmentButtonTextActive,
                      ]}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentButton,
                      adjustmentType === 'subtract' && styles.adjustmentButtonActive,
                    ]}
                    onPress={() => setAdjustmentType('subtract')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="remove-circle" 
                      size={18} 
                      color={adjustmentType === 'subtract' ? '#FFFFFF' : Colors.status.expense} 
                    />
                    <Text
                      style={[
                        styles.adjustmentButtonText,
                        adjustmentType === 'subtract' && styles.adjustmentButtonTextActive,
                      ]}
                    >
                      Subtract
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Amount *</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={Colors.text.secondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Note Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Note (Optional)</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Add a note..."
                  placeholderTextColor={Colors.text.tertiary}
                  value={note}
                  onChangeText={setNote}
                  multiline={false}
                />
              </View>
            </View>

            {/* Payment Method Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === 'upi' && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode('upi')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={18} 
                    color={mode === 'upi' ? '#FFFFFF' : Colors.payment.upi} 
                  />
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
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="cash" 
                    size={18} 
                    color={mode === 'cash' ? '#FFFFFF' : Colors.payment.cash} 
                  />
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
            </View>

            {/* Date Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.text.secondary} />
                </View>
                <Text style={styles.dateText}>{formatDateDisplay(formatDate(date))}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

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
            </ScrollView>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButtonContainer}
            onPress={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.8}
          >
            {(!amount || parseFloat(amount) <= 0) ? (
              <View style={[styles.saveButton, styles.saveButtonDisabled]}>
                <Text style={styles.saveButtonTextDisabled}>Save Entry</Text>
              </View>
            ) : (
              <LinearGradient
                colors={Colors.accent.gradient.positive}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderBottomWidth: 0,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollViewContainer: {
    height: SCREEN_HEIGHT * 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActiveExpense: {
    backgroundColor: Colors.status.expense,
  },
  typeButtonActiveIncome: {
    backgroundColor: Colors.status.income,
  },
  typeButtonActiveAdjustment: {
    backgroundColor: Colors.status.adjustment,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  adjustmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  adjustmentButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  adjustmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  adjustmentButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButtonContainer: {
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: Colors.text.tertiary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddEntryModal;

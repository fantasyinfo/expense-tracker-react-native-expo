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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDateDisplay } from '../utils/dateUtils';
import { addEntry } from '../utils/storage';
import Colors from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CashDepositModal = ({ visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    // Create a cash deposit entry
    // This will credit to UPI and debit from cash
    const entryData = {
      amount: parsedAmount,
      note: note.trim() || 'Cash Deposit',
      type: 'cash_deposit',
      date: formatDate(date),
    };

    await addEntry(entryData);

    // Reset form
    setAmount('');
    setNote('');
    setDate(new Date());
    onSave();
  };

  const handleClose = () => {
    setAmount('');
    setNote('');
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
            <View>
              <Text style={styles.modalTitle}>Cash Deposit</Text>
              <Text style={styles.modalSubtitle}>Deposit cash from Cash to Digital</Text>
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
              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={20} color="#51CF66" />
                <Text style={styles.infoText}>
                  This will debit from your cash balance and credit to your Digital balance
                </Text>
              </View>

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
                <Text style={styles.saveButtonTextDisabled}>Deposit Cash</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#51CF66', '#40C057']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Deposit Cash</Text>
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
    height: SCREEN_HEIGHT * 0.45,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(81, 207, 102, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(81, 207, 102, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#51CF66',
    fontWeight: '500',
    lineHeight: 18,
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
    shadowColor: '#51CF66',
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

export default CashDepositModal;


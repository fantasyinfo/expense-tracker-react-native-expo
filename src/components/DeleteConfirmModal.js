import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';

const DeleteConfirmModal = ({ visible, entry, onConfirm, onCancel }) => {
  const { currency } = useCurrency();
  if (!entry) return null;

  const entryType = entry.type === 'expense' ? 'Expense' : entry.type === 'income' ? 'Income' : 'Balance Adjustment';
  const isBalanceAdjustment = entry.type === 'balance_adjustment';
  const adjustmentIsAdd = isBalanceAdjustment ? (entry.adjustment_type === 'add' || !entry.adjustment_type) : false;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="trash-outline" size={32} color={Colors.status.expense} />
            </View>
          </View>
          
          <Text style={styles.modalTitle}>Delete Entry</Text>
          
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this {entryType.toLowerCase()} entry? This action cannot be undone.
          </Text>
          
          <View style={styles.entryDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{entryType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[
                styles.detailValue,
                isBalanceAdjustment 
                  ? styles.adjustmentAmount
                  : (entry.type === 'expense' ? styles.expenseAmount : styles.incomeAmount)
              ]}>
                {isBalanceAdjustment 
                  ? (adjustmentIsAdd ? '+' : '-')
                  : (entry.type === 'expense' ? '-' : '+')
                }{currency.symbol}{formatCurrency(entry.amount)}
              </Text>
            </View>
            {entry.note && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{entry.note}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment</Text>
              <View style={styles.modeRow}>
                <Ionicons
                  name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                  size={16}
                  color={(entry.mode || 'upi') === 'upi' ? Colors.payment.upi : Colors.payment.cash}
                />
                <Text style={styles.detailValue}>
                  {(entry.mode || 'upi') === 'upi' ? 'UPI' : 'Cash'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.status.expense, '#e55555']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.deleteButtonGradient}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.iconBackground.expense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  entryDetails: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  expenseAmount: {
    color: Colors.status.expense,
  },
  incomeAmount: {
    color: Colors.status.income,
  },
  adjustmentAmount: {
    color: Colors.status.adjustment,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DeleteConfirmModal;

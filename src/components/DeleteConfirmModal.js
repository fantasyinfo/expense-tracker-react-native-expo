import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DeleteConfirmModal = ({ visible, entry, onConfirm, onCancel }) => {
  if (!entry) return null;

  const entryType = entry.type === 'expense' ? 'Expense' : 'Income';
  const entryAmount = `₹${parseFloat(entry.amount).toFixed(2)}`;
  const entryNote = entry.note ? ` (${entry.note})` : '';

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
            <Ionicons name="trash-outline" size={48} color="#FF3B30" />
          </View>
          
          <Text style={styles.modalTitle}>Delete Entry</Text>
          
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this {entryType.toLowerCase()} entry?
          </Text>
          
          <View style={styles.entryDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{entryType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={[styles.detailValue, entry.type === 'expense' ? styles.expenseAmount : styles.incomeAmount]}>
                {entry.type === 'expense' ? '-' : '+'}{entryAmount}
              </Text>
            </View>
            {entry.note && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note:</Text>
                <Text style={styles.detailValue}>{entry.note}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <View style={styles.modeRow}>
                <Ionicons
                  name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                  size={16}
                  color={(entry.mode || 'upi') === 'upi' ? '#007AFF' : '#888888'}
                />
                <Text style={styles.detailValue}>
                  {(entry.mode || 'upi') === 'upi' ? 'UPI' : 'Cash'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={18} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 0,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  modalMessage: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  entryDetails: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 0,
    padding: 16,
    marginBottom: 24,
    borderWidth: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  expenseAmount: {
    color: '#FF3B30',
  },
  incomeAmount: {
    color: '#34C759',
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
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  deleteButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d32f2f',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default DeleteConfirmModal;

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateWithMonthName, calculateTotals } from '../utils/dateUtils';

const EntriesReportModal = ({ visible, entries, onClose, title = 'Entries Report' }) => {
  // Group entries by date
  const groupedEntries = useMemo(() => {
    const grouped = {};
    entries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    // Sort entries within each date by id (newest first)
    sortedDates.forEach(date => {
      grouped[date].sort((a, b) => parseInt(b.id) - parseInt(a.id));
    });

    return sortedDates.map(date => ({
      date,
      entries: grouped[date],
      totals: calculateTotals(grouped[date]),
    }));
  }, [entries]);

  const renderEntry = (entry) => {
    const isBalanceAdjustment = entry.type === 'balance_adjustment';
    // Default to 'add' if adjustment_type is missing (for backward compatibility)
    const adjustmentIsAdd = isBalanceAdjustment ? (entry.adjustment_type === 'add' || !entry.adjustment_type) : false;
    
    return (
      <View style={styles.entryItem} key={entry.id}>
        <View style={[
          styles.entryIconContainer,
          isBalanceAdjustment 
            ? styles.adjustmentIconBg 
            : (entry.type === 'expense' ? styles.expenseIconBg : styles.incomeIconBg)
        ]}>
          <Ionicons
            name={
              isBalanceAdjustment 
                ? (adjustmentIsAdd ? 'add-circle' : 'remove-circle')
                : (entry.type === 'expense' ? 'arrow-down' : 'arrow-up')
            }
            size={18}
            color={
              isBalanceAdjustment 
                ? '#FF9800'
                : (entry.type === 'expense' ? '#d32f2f' : '#388e3c')
            }
          />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryAmountRow}>
            <Text style={[
              styles.entryAmount,
              isBalanceAdjustment 
                ? styles.adjustmentAmount
                : (entry.type === 'expense' ? styles.expenseAmount : styles.incomeAmount)
            ]}>
              {isBalanceAdjustment 
                ? (adjustmentIsAdd ? '+' : '-')
                : (entry.type === 'expense' ? '-' : '+')
              }₹{parseFloat(entry.amount).toFixed(2)}
            </Text>
            <View style={styles.modeIndicator}>
              <Ionicons
                name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                size={14}
                color={(entry.mode || 'upi') === 'upi' ? '#007AFF' : '#888888'}
              />
            </View>
          </View>
          {entry.note ? (
            <Text style={styles.entryNote}>
              {isBalanceAdjustment && <Text style={styles.adjustmentLabel}>[Balance Adjustment] </Text>}
              {entry.note}
            </Text>
          ) : (
            <Text style={styles.entryType}>
              {isBalanceAdjustment 
                ? 'Balance Adjustment' 
                : (entry.type === 'expense' ? 'Expense' : 'Income')
              }
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderDateGroup = ({ item }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <View style={styles.dateHeaderLeft}>
          <Ionicons name="calendar-outline" size={18} color="#1976d2" />
          <Text style={styles.dateText}>{formatDateWithMonthName(item.date)}</Text>
        </View>
        <View style={styles.dateTotals}>
          <View style={styles.dateTotalItem}>
            <Ionicons name="arrow-down-circle" size={14} color="#d32f2f" />
            <Text style={styles.dateTotalText}>₹{item.totals.expense.toFixed(2)}</Text>
          </View>
          <View style={styles.dateTotalItem}>
            <Ionicons name="arrow-up-circle" size={14} color="#388e3c" />
            <Text style={styles.dateTotalText}>₹{item.totals.income.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.entriesContainer}>
        {item.entries.map(renderEntry)}
      </View>
    </View>
  );

  const overallTotals = useMemo(() => calculateTotals(entries), [entries]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Professional Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Area */}
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Overall Summary */}
            {entries.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Overall Summary</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-down-circle" size={20} color="#d32f2f" />
                    <Text style={styles.summaryLabel}>Total Expense</Text>
                    <Text style={[styles.summaryValue, styles.expenseAmount]}>
                      ₹{overallTotals.expense.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-up-circle" size={20} color="#388e3c" />
                    <Text style={styles.summaryLabel}>Total Income</Text>
                    <Text style={[styles.summaryValue, styles.incomeAmount]}>
                      ₹{overallTotals.income.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons 
                      name={overallTotals.balance >= 0 ? 'trending-up' : 'trending-down'} 
                      size={20} 
                      color={overallTotals.balance >= 0 ? '#388e3c' : '#d32f2f'} 
                    />
                    <Text style={styles.summaryLabel}>Net Balance</Text>
                    <Text style={[
                      styles.summaryValue,
                      overallTotals.balance >= 0 ? styles.incomeAmount : styles.expenseAmount
                    ]}>
                      ₹{overallTotals.balance.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Payment Method Breakdown */}
              <View style={styles.paymentBreakdown}>
                <Text style={styles.breakdownTitle}>PAYMENT METHOD BREAKDOWN</Text>
                
                {/* Expense Breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownSectionTitle}>Expense</Text>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>UPI</Text>
                      <Text style={styles.breakdownValue}>₹{(overallTotals.expenseUpi || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Cash</Text>
                      <Text style={styles.breakdownValue}>₹{(overallTotals.expenseCash || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                {/* Income Breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownSectionTitle}>Income</Text>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>UPI</Text>
                      <Text style={styles.breakdownValue}>₹{(overallTotals.incomeUpi || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Cash</Text>
                      <Text style={styles.breakdownValue}>₹{(overallTotals.incomeCash || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              </View>
            )}

            {/* Entries List - Rendered manually in ScrollView */}
            {groupedEntries.length > 0 ? (
              <View style={styles.entriesListContainer}>
                {groupedEntries.map((item) => (
                  <View key={item.date} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                      <View style={styles.dateHeaderLeft}>
                        <Text style={styles.dateText}>{formatDateWithMonthName(item.date)}</Text>
                      </View>
                      <View style={styles.dateTotals}>
                        <View style={styles.dateTotalItem}>
                          <Text style={[styles.dateTotalText, { color: '#d32f2f' }]}>₹{item.totals.expense.toFixed(2)}</Text>
                        </View>
                        <View style={styles.dateTotalItem}>
                          <Text style={[styles.dateTotalText, { color: '#388e3c' }]}>₹{item.totals.income.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.entriesContainer}>
                      {item.entries.map(renderEntry)}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={64} color="#444444" />
                <Text style={styles.emptyText}>No entries found</Text>
              </View>
            )}
          </ScrollView>
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
    maxHeight: '90%',
    flex: 1,
    flexDirection: 'column',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 0,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    fontWeight: '400',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#2C2C2E',
    margin: 0,
    marginTop: 0,
    padding: 20,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 0,
    borderWidth: 0,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#888888',
    marginTop: 0,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  paymentBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownSection: {
    marginBottom: 12,
  },
  breakdownSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 0,
    marginHorizontal: 0,
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#888888',
    marginTop: 0,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  entriesListContainer: {
    padding: 16,
    paddingTop: 0,
  },
  dateGroup: {
    marginBottom: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  dateTotals: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTotalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTotalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    letterSpacing: -0.2,
  },
  entriesContainer: {
    padding: 0,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  entryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconBg: {
    backgroundColor: 'transparent',
  },
  incomeIconBg: {
    backgroundColor: 'transparent',
  },
  adjustmentIconBg: {
    backgroundColor: 'transparent',
  },
  adjustmentAmount: {
    color: '#FF9800',
  },
  adjustmentLabel: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  entryContent: {
    flex: 1,
  },
  entryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeIndicator: {
    padding: 2,
  },
  entryNote: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  entryType: {
    fontSize: 12,
    color: '#888888',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default EntriesReportModal;

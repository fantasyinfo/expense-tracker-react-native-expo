import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
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

  const renderEntry = (entry) => (
    <View style={styles.entryItem} key={entry.id}>
      <View style={[
        styles.entryIconContainer,
        entry.type === 'expense' ? styles.expenseIconBg : styles.incomeIconBg
      ]}>
        <Ionicons
          name={entry.type === 'expense' ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={entry.type === 'expense' ? '#d32f2f' : '#388e3c'}
        />
      </View>
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryAmount,
          entry.type === 'expense' ? styles.expenseAmount : styles.incomeAmount
        ]}>
          {entry.type === 'expense' ? '-' : '+'}₹{parseFloat(entry.amount).toFixed(2)}
        </Text>
        {entry.note ? (
          <Text style={styles.entryNote}>{entry.note}</Text>
        ) : (
          <Text style={styles.entryType}>
            {entry.type === 'expense' ? 'Expense' : 'Income'}
          </Text>
        )}
      </View>
    </View>
  );

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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="document-text" size={24} color="#1976d2" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#b0b0b0" />
            </TouchableOpacity>
          </View>

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
            </View>
          )}

          {/* Entries List */}
          <FlatList
            data={groupedEntries}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={64} color="#444444" />
                <Text style={styles.emptyText}>No entries found</Text>
              </View>
            }
          />
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#b0b0b0',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  dateGroup: {
    marginBottom: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateTotals: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTotalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  entriesContainer: {
    padding: 8,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  entryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconBg: {
    backgroundColor: '#3d1f1f',
  },
  incomeIconBg: {
    backgroundColor: '#1f3d1f',
  },
  entryContent: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
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

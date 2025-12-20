import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import { getCurrentBankBalance, getCurrentCashBalance } from '../utils/balanceUtils';
import AddEntryModal from '../components/AddEntryModal';
import AppFooter from '../components/AppFooter';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const HomeScreen = () => {
  const [entries, setEntries] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [bankBalance, setBankBalance] = useState(null);
  const [cashBalance, setCashBalance] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const today = formatDate(new Date());

  // Load entries and filter
  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    
    // Load current balances
    const bankBal = await getCurrentBankBalance();
    const cashBal = await getCurrentCashBalance();
    setBankBalance(bankBal);
    setCashBalance(cashBal);
    
    // Filter entries based on date range or today
    let filtered;
    if (isCustomDateRange) {
      filtered = filterEntriesByDateRange(allEntries, startDate, endDate);
    } else {
      filtered = filterEntriesByPeriod(allEntries, 'today');
    }
    const sorted = filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    setTodayEntries(sorted);
    
    // Calculate totals
    const periodTotals = calculateTotals(filtered);
    setTotals(periodTotals);
  }, [isCustomDateRange, startDate, endDate]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEntryAdded = () => {
    loadData();
    setModalVisible(false);
  };

  const handleDelete = async (id, entry) => {
    setEntryToDelete({ id, ...entry });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      loadData();
      setDeleteModalVisible(false);
      setEntryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEntryToDelete(null);
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > endDate) {
        Alert.alert('Invalid Date', 'Start date cannot be after end date');
        return;
      }
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate < startDate) {
        Alert.alert('Invalid Date', 'End date cannot be before start date');
        return;
      }
      setEndDate(selectedDate);
    }
  };

  const handleApplyFilter = () => {
    setIsCustomDateRange(true);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setIsCustomDateRange(false);
    setShowFilterModal(false);
  };

  const renderEntry = ({ item }) => {
    const isBalanceAdjustment = item.type === 'balance_adjustment';
    // Default to 'add' if adjustment_type is missing (for backward compatibility)
    const adjustmentIsAdd = isBalanceAdjustment ? (item.adjustment_type === 'add' || !item.adjustment_type) : false;
    
    return (
      <View style={[
        styles.entryItem,
        isBalanceAdjustment 
          ? styles.entryItemAdjustment
          : (item.type === 'expense' ? styles.entryItemExpense : styles.entryItemIncome)
      ]}>
        <View style={[
          styles.entryIconContainer,
          isBalanceAdjustment 
            ? styles.adjustmentIconBg 
            : (item.type === 'expense' ? styles.expenseIconBg : styles.incomeIconBg)
        ]}>
          <Ionicons
            name={
              isBalanceAdjustment 
                ? (adjustmentIsAdd ? 'add-circle' : 'remove-circle')
                : (item.type === 'expense' ? 'arrow-down' : 'arrow-up')
            }
            size={20}
            color={
              isBalanceAdjustment 
                ? '#FF9800'
                : (item.type === 'expense' ? '#d32f2f' : '#388e3c')
            }
          />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryAmountRow}>
            <Text style={[
              styles.entryAmount,
              isBalanceAdjustment 
                ? styles.adjustmentAmount
                : (item.type === 'expense' ? styles.expenseAmount : styles.incomeAmount)
            ]}>
              {isBalanceAdjustment 
                ? (adjustmentIsAdd ? '+' : '-')
                : (item.type === 'expense' ? '-' : '+')
              }₹{parseFloat(item.amount).toFixed(2)}
            </Text>
            <View style={styles.modeIndicator}>
              <Ionicons
                name={(item.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                size={14}
                color={(item.mode || 'upi') === 'upi' ? '#007AFF' : '#888888'}
              />
            </View>
          </View>
          {item.note ? (
            <Text style={styles.entryNote}>
              {isBalanceAdjustment && <Text style={styles.adjustmentLabel}>[Balance Adjustment] </Text>}
              {item.note}
            </Text>
          ) : (
            <Text style={styles.entryDate}>
              {isBalanceAdjustment && <Text style={styles.adjustmentLabel}>[Balance Adjustment] </Text>}
              {formatDateWithMonthName(item.date)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item)}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isCustomDateRange ? 'Filtered Summary' : "Today's Summary"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isCustomDateRange 
                ? `${formatDateWithMonthName(formatDate(startDate))} to ${formatDateWithMonthName(formatDate(endDate))}`
                : formatDateWithMonthName(today)
              }
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={18} color="#888888" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Professional Finance Summary - Fixed */}
      <View style={styles.fixedSummarySection}>
        <View style={styles.fixedSummaryCard}>
          <View style={styles.fixedSummaryRow}>
            <View style={styles.fixedSummaryItem}>
              <Text style={styles.fixedSummaryLabel}>Expense</Text>
              <Text style={[styles.fixedSummaryValue, styles.summaryValueExpense]}>
                ₹{totals.expense.toFixed(2)}
              </Text>
            </View>
            <View style={styles.fixedSummaryDivider} />
            <View style={styles.fixedSummaryItem}>
              <Text style={styles.fixedSummaryLabel}>Income</Text>
              <Text style={[styles.fixedSummaryValue, styles.summaryValueIncome]}>
                ₹{totals.income.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Cards - Scrollable */}
        {(bankBalance !== null || cashBalance !== null) && (
          <View style={styles.balanceCardsSection}>
            {bankBalance !== null && (
              <View style={[styles.balanceCard, bankBalance < 0 && styles.balanceCardNegative]}>
                <Text style={styles.balanceCardLabel}>Bank / UPI Balance</Text>
                <Text style={[
                  styles.balanceCardAmount,
                  bankBalance < 0 && styles.balanceCardAmountNegative
                ]}>
                  {bankBalance < 0 ? '-' : ''}₹{Math.abs(bankBalance).toFixed(2)}
                </Text>
              </View>
            )}
            {cashBalance !== null && (
              <View style={[styles.balanceCard, cashBalance < 0 && styles.balanceCardNegative]}>
                <Text style={styles.balanceCardLabel}>Cash Balance</Text>
                <Text style={[
                  styles.balanceCardAmount,
                  cashBalance < 0 && styles.balanceCardAmountNegative
                ]}>
                  {cashBalance < 0 ? '-' : ''}₹{Math.abs(cashBalance).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Entries List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {isCustomDateRange ? 'Filtered Entries' : "Today's Entries"}
          </Text>
          <Text style={styles.listCount}>{todayEntries.length}</Text>
        </View>

        {/* Entries List */}
        {todayEntries.length > 0 ? (
          <View style={styles.entriesContainer}>
            {todayEntries.map((item) => {
              const entryComponent = renderEntry({ item });
              return <View key={item.id}>{entryComponent}</View>;
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="wallet-outline" size={48} color="#3a3a3a" />
            </View>
            <Text style={styles.emptyText}>
              {isCustomDateRange ? 'No entries found' : 'No entries today'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isCustomDateRange ? 'Try a different date range' : 'Start tracking your expenses and income'}
            </Text>
          </View>
        )}

        {/* Footer */}
        <AppFooter />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#1C1C1E" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleEntryAdded}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Entries</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.filterCloseButton}
              >
                <Ionicons name="close" size={24} color="#b0b0b0" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !isCustomDateRange && styles.filterOptionActive
                ]}
                onPress={handleResetFilter}
              >
                <Ionicons 
                  name="today" 
                  size={20} 
                  color={!isCustomDateRange ? '#fff' : '#b0b0b0'} 
                />
                <Text style={[
                  styles.filterOptionText,
                  !isCustomDateRange && styles.filterOptionTextActive
                ]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Custom Date Range</Text>
            
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#1976d2" />
                <View style={styles.datePickerTextContainer}>
                  <Text style={styles.datePickerLabel}>Start Date</Text>
                  <Text style={styles.datePickerValue}>
                    {formatDateWithMonthName(formatDate(startDate))}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#1976d2" />
                <View style={styles.datePickerTextContainer}>
                  <Text style={styles.datePickerLabel}>End Date</Text>
                  <Text style={styles.datePickerValue}>
                    {formatDateWithMonthName(formatDate(endDate))}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartDateChange}
                maximumDate={endDate}
                themeVariant="dark"
                textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            )}
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={startDate}
                maximumDate={new Date()}
                themeVariant="dark"
                textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            )}

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetFilter}
              >
                <Text style={styles.filterResetText}>Reset to Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={handleApplyFilter}
              >
                <Text style={styles.filterApplyText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        entry={entryToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  filterCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptions: {
    marginBottom: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 0,
    gap: 10,
  },
  filterOptionActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 10,
    borderWidth: 0,
    gap: 10,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  filterApplyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  fixedSummarySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  fixedSummaryCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 0,
    padding: 18,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  fixedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fixedSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  fixedSummaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
  },
  fixedSummaryLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  fixedSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summaryValueExpense: {
    color: '#d32f2f',
  },
  summaryValueIncome: {
    color: '#388e3c',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    paddingBottom: 20,
  },
  balanceCardsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 0,
    padding: 16,
    borderWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    alignItems: 'center',
  },
  balanceCardNegative: {
    backgroundColor: '#2C2C2E',
  },
  balanceCardLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  balanceCardAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  balanceCardAmountNegative: {
    color: '#d32f2f',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listCount: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  entriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  entryItem: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    padding: 16,
    marginBottom: 1,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
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
  entryItemExpense: {
    borderLeftColor: '#d32f2f',
  },
  entryItemIncome: {
    borderLeftColor: '#388e3c',
  },
  entryItemAdjustment: {
    borderLeftColor: '#FF9800',
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
    marginBottom: 3,
    gap: 8,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modeIndicator: {
    padding: 2,
  },
  entryNote: {
    fontSize: 13,
    color: '#A0A0A0',
    fontWeight: '400',
  },
  entryDate: {
    fontSize: 12,
    color: '#808080',
    fontWeight: '400',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    marginTop: 0,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default HomeScreen;

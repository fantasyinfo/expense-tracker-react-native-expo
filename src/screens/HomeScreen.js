import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import AddEntryModal from '../components/AddEntryModal';
import AppFooter from '../components/AppFooter';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const [entries, setEntries] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
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

  const renderEntry = ({ item }) => (
    <View style={styles.entryItem}>
      <View style={[
        styles.entryIconContainer,
        item.type === 'expense' ? styles.expenseIconBg : styles.incomeIconBg
      ]}>
        <Ionicons
          name={item.type === 'expense' ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={item.type === 'expense' ? '#d32f2f' : '#388e3c'}
        />
      </View>
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryAmount,
          item.type === 'expense' ? styles.expenseAmount : styles.incomeAmount
        ]}>
          {item.type === 'expense' ? '-' : '+'}₹{parseFloat(item.amount).toFixed(2)}
        </Text>
        {item.note ? (
          <Text style={styles.entryNote}>{item.note}</Text>
        ) : (
          <Text style={styles.entryDate}>{formatDateWithMonthName(item.date)}</Text>
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

  const cards = [
    {
      type: 'expense',
      label: 'Today\'s Expense',
      amount: totals.expense,
      icon: 'arrow-down-circle',
      color: '#d32f2f',
      borderColor: '#d32f2f',
    },
    {
      type: 'income',
      label: 'Today\'s Income',
      amount: totals.income,
      icon: 'arrow-up-circle',
      color: '#388e3c',
      borderColor: '#388e3c',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Modern Header */}
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
            <Ionicons name="filter" size={20} color="#A0A0A0" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Scrollable Card Section */}
      <View style={styles.cardSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
            setCardIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {cards.map((card, index) => (
            <View key={index} style={styles.cardWrapper}>
              <View style={[
                styles.modernCard,
                { borderBottomColor: card.borderColor }
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={card.icon} size={32} color={card.color} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    <Text style={[styles.cardAmount, { color: card.color }]}>
                      ₹{card.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Ionicons name="trending-up" size={16} color={card.color} />
                  <Text style={[styles.cardFooterText, { color: card.color }]}>
                    {card.type === 'expense' ? 'Total expenses today' : 'Total income today'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Card Indicators */}
        <View style={styles.cardIndicators}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                cardIndex === index && styles.indicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Entries List */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Ionicons name="list" size={20} color="#1976d2" />
          <Text style={styles.listTitle}>
            {isCustomDateRange ? 'Filtered Entries' : "Today's Entries"}
          </Text>
        </View>
        <View style={styles.listCountBadge}>
          <Text style={styles.listCount}>{todayEntries.length}</Text>
        </View>
      </View>
      <FlatList
        data={todayEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#444444" />
            <Text style={styles.emptyText}>
              {isCustomDateRange ? 'No entries found for selected date range' : 'No entries for today'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isCustomDateRange ? 'Try selecting a different date range' : 'Tap + to add your first entry'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={<AppFooter />}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
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
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 0,
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  headerIconContainer: {
    display: 'none',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    fontWeight: '400',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
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
  cardSection: {
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
  },
  cardWrapper: {
    width: screenWidth - 32,
    paddingHorizontal: 16,
  },
  modernCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#2C2C2E',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardFooterText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '400',
    color: '#A0A0A0',
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444444',
  },
  indicatorActive: {
    backgroundColor: '#1976d2',
    width: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  listCountBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  listCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  entryItem: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0,
  },
  entryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconBg: {
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
  },
  incomeIconBg: {
    backgroundColor: 'rgba(56, 142, 60, 0.15)',
  },
  entryContent: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: '#FFFFFF',
    letterSpacing: -0.3,
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
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default HomeScreen;

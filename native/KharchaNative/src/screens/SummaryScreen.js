import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName, formatDate, formatCurrency, formatDateDisplay, formatDateShort } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import { useModal } from '../context/ModalContext';
import AddEntryModal from '../components/AddEntryModal';
import { prepareExpenseIncomeChart, prepareMonthlyChart, preparePaymentMethodChart } from '../utils/chartUtils';
import { prepareCategoryChart, getCategoryStats } from '../utils/categoryChartUtils';
import { loadCategories } from '../utils/categoryStorage';
import AppFooter from '../components/AppFooter';
import EntriesReportModal from '../components/EntriesReportModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Colors from '../constants/colors';

const PERIODS = ['today', 'weekly', 'monthly', 'quarterly', 'yearly'];
const screenWidth = Dimensions.get('window').width;

const SummaryScreen = () => {
  const { 
    addEntryModalVisible, 
    openAddEntryModal, 
    closeAddEntryModal,
  } = useModal();
  const [entries, setEntries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [categoryChartData, setCategoryChartData] = useState(null);
  const [showCategoryChart, setShowCategoryChart] = useState(false);
  const [totals, setTotals] = useState({ 
    expense: 0, 
    income: 0, 
    balance: 0,
    expenseUpi: 0,
    expenseCash: 0,
    incomeUpi: 0,
    incomeCash: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [longPressMenuVisible, setLongPressMenuVisible] = useState(false);
  const [selectedEntryForMenu, setSelectedEntryForMenu] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    
    // Load categories
    const loadedCategories = await loadCategories();
    setCategories(loadedCategories);
    
    updateFilteredData(allEntries);
  }, [selectedPeriod, isCustomDateRange, startDate, endDate]);

  const updateFilteredData = (allEntries) => {
    let filtered;
    if (isCustomDateRange) {
      filtered = filterEntriesByDateRange(allEntries, startDate, endDate);
    } else {
      filtered = filterEntriesByPeriod(allEntries, selectedPeriod);
    }
    
    // Apply category filter if selected
    if (selectedCategoryFilter) {
      filtered = filtered.filter(entry => entry.category_id === selectedCategoryFilter);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(entry => {
        const noteMatch = entry.note?.toLowerCase().includes(query);
        const amountMatch = entry.amount?.toString().includes(query);
        const dateMatch = formatDateWithMonthName(entry.date).toLowerCase().includes(query) ||
                         formatDateDisplay(entry.date).toLowerCase().includes(query);
        return noteMatch || amountMatch || dateMatch;
      });
    }
    
    // Sort by date (newest first) - same as HomeScreen
    filtered.sort((a, b) => {
      // First try to sort by date (newest first)
      const dateA = new Date(a.date + 'T00:00:00');
      const dateB = new Date(b.date + 'T00:00:00');
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      // If dates are same, sort by ID (newest first)
      return parseInt(b.id) - parseInt(a.id);
    });
    
    setFilteredEntries(filtered);
    const periodTotals = calculateTotals(filtered);
    setTotals(periodTotals);
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Close local modals when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: close local modals when screen loses focus
        setShowEntriesModal(false);
      };
    }, [])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    updateFilteredData(entries);
  }, [selectedPeriod, isCustomDateRange, startDate, endDate, entries, searchQuery, selectedCategoryFilter]);

  // Update category chart when filtered entries change
  useEffect(() => {
    const updateCategoryChart = async () => {
      if (filteredEntries.length > 0) {
        const chartData = await prepareCategoryChart(filteredEntries);
        setCategoryChartData(chartData);
      } else {
        setCategoryChartData(null);
      }
    };
    updateCategoryChart();
  }, [filteredEntries]);

  const handleEdit = (entry) => {
    // Prevent editing cash withdrawal, deposit, and balance adjustment entries
    if (entry.type === 'cash_withdrawal' || entry.type === 'cash_deposit' || entry.type === 'balance_adjustment') {
      return;
    }
    // Close entries modal first if it's open
    if (showEntriesModal) {
      setShowEntriesModal(false);
    }
    // Set entryToEdit FIRST, then open modal after a delay to ensure state is set
    setEntryToEdit(entry);
    // Use setTimeout to ensure state update is processed before opening modal
    // Use a longer delay to ensure React has processed the state update
    setTimeout(() => {
      openAddEntryModal();
    }, 150);
  };

  const handleDuplicate = (entry) => {
    // Prevent duplicating cash withdrawal, deposit, and balance adjustment entries
    if (entry.type === 'cash_withdrawal' || entry.type === 'cash_deposit' || entry.type === 'balance_adjustment') {
      return;
    }
    // Create a duplicate entry with today's date
    const duplicateEntry = {
      ...entry,
      id: undefined, // Remove id so it creates a new entry
      date: formatDate(new Date()), // Set date to today
    };
    setEntryToEdit(duplicateEntry);
    openAddEntryModal();
  };

  const handleEntryAdded = async () => {
    closeAddEntryModal();
    setEntryToEdit(null);
    await loadData();
  };

  const handleDelete = async (id, entry) => {
    setEntryToDelete({ id, ...entry });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      await loadData();
      setDeleteModalVisible(false);
      setEntryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEntryToDelete(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCustomDateRange = () => {
    setIsCustomDateRange(true);
    setSelectedPeriod(null);
  };

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setIsCustomDateRange(false);
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

  const getPeriodLabel = (period) => {
    const labels = {
      today: 'Today',
      weekly: 'Week',
      monthly: 'Month',
      quarterly: 'Quarter',
      yearly: 'Year',
    };
    return labels[period] || period;
  };

  const getPeriodIcon = (period) => {
    const icons = {
      today: 'today',
      weekly: 'calendar',
      monthly: 'calendar-outline',
      quarterly: 'calendar-number',
      yearly: 'calendar-sharp',
    };
    return icons[period] || 'calendar';
  };

  const expenseIncomeData = prepareExpenseIncomeChart(entries, selectedPeriod || 'monthly');
  const monthlyData = prepareMonthlyChart(entries);
  const paymentMethodData = preparePaymentMethodChart(filteredEntries);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScrollContent}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && !isCustomDateRange && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodSelect(period)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && !isCustomDateRange && styles.periodButtonTextActive,
                ]}
              >
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.periodButton,
              styles.customDateButton,
              isCustomDateRange && styles.periodButtonActive,
            ]}
            onPress={handleCustomDateRange}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodButtonText,
                isCustomDateRange && styles.periodButtonTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Custom Date Range Picker */}
      {isCustomDateRange && (
        <View style={styles.customDateContainer}>
          <View style={styles.datePickerRow}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#1976d2" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>Start Date</Text>
                <Text style={styles.datePickerValue}>{formatDateWithMonthName(formatDate(startDate))}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#1976d2" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>End Date</Text>
                <Text style={styles.datePickerValue}>{formatDateWithMonthName(formatDate(endDate))}</Text>
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
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by note, amount, or date..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Totals Display */}
      <View style={styles.totalsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <TouchableOpacity onPress={() => setShowEntriesModal(true)} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>View All Entries</Text>
          </TouchableOpacity>
        </View>

        {/* Colorful Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          {/* Expense Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryCardIconContainer, { backgroundColor: '#FF6B6B20' }]}>
              <Ionicons name="arrow-down" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.summaryCardInfo}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardName} numberOfLines={1}>
                  Total Expense
                </Text>
                <Text style={[styles.summaryCardAmount, { color: '#FF6B6B' }]}>
                  ₹{formatCurrency(totals.expense)}
                </Text>
              </View>
              <View style={styles.summaryCardFooter}>
                <View style={styles.summaryCardProgressBar}>
                  <View 
                    style={[
                      styles.summaryCardProgressFill, 
                      { 
                        width: totals.expense + totals.income > 0 
                          ? `${(totals.expense / (totals.expense + totals.income) * 100)}%`
                          : '0%',
                        backgroundColor: '#FF6B6B',
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.summaryCardMeta}>
                  {totals.expense + totals.income > 0 
                    ? `${((totals.expense / (totals.expense + totals.income)) * 100).toFixed(1)}% of total`
                    : '0% of total'}
                </Text>
              </View>
            </View>
          </View>

          {/* Income Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryCardIconContainer, { backgroundColor: '#51CF6620' }]}>
              <Ionicons name="arrow-up" size={24} color="#51CF66" />
            </View>
            <View style={styles.summaryCardInfo}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardName} numberOfLines={1}>
                  Total Income
                </Text>
                <Text style={[styles.summaryCardAmount, { color: '#51CF66' }]}>
                  ₹{formatCurrency(totals.income)}
                </Text>
              </View>
              <View style={styles.summaryCardFooter}>
                <View style={styles.summaryCardProgressBar}>
                  <View 
                    style={[
                      styles.summaryCardProgressFill, 
                      { 
                        width: totals.expense + totals.income > 0 
                          ? `${(totals.income / (totals.expense + totals.income) * 100)}%`
                          : '0%',
                        backgroundColor: '#51CF66',
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.summaryCardMeta}>
                  {totals.expense + totals.income > 0 
                    ? `${((totals.income / (totals.expense + totals.income)) * 100).toFixed(1)}% of total`
                    : '0% of total'}
                </Text>
              </View>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.summaryCard}>
            <View style={[
              styles.summaryCardIconContainer, 
              { backgroundColor: totals.balance >= 0 ? '#51CF6620' : '#FF6B6B20' }
            ]}>
              <Ionicons 
                name={totals.balance >= 0 ? "trending-up" : "trending-down"} 
                size={24} 
                color={totals.balance >= 0 ? '#51CF66' : '#FF6B6B'} 
              />
            </View>
            <View style={styles.summaryCardInfo}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardName} numberOfLines={1}>
                  Net Balance
                </Text>
                <Text style={[
                  styles.summaryCardAmount, 
                  { color: totals.balance >= 0 ? '#51CF66' : '#FF6B6B' }
                ]}>
                  ₹{formatCurrency(totals.balance)}
                </Text>
              </View>
              <View style={styles.summaryCardFooter}>
                <View style={styles.summaryCardProgressBar}>
                  <View 
                    style={[
                      styles.summaryCardProgressFill, 
                      { 
                        width: totals.balance !== 0 
                          ? `${Math.min(Math.abs(totals.balance) / Math.max(totals.expense, totals.income, 1) * 100, 100)}%`
                          : '0%',
                        backgroundColor: totals.balance >= 0 ? '#51CF66' : '#FF6B6B',
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.summaryCardMeta}>
                  {totals.balance >= 0 ? 'Positive' : 'Negative'} balance
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.paymentBreakdownSection}>
          <Text style={styles.breakdownTitle}>PAYMENT METHOD BREAKDOWN</Text>
          
          <View style={styles.paymentCardsContainer}>
            {/* Expense UPI Card */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentCardIconContainer, { backgroundColor: '#4DABF720' }]}>
                <Ionicons name="phone-portrait" size={24} color="#4DABF7" />
              </View>
              <View style={styles.paymentCardInfo}>
                <View style={styles.paymentCardHeader}>
                  <Text style={styles.paymentCardName} numberOfLines={1}>
                    Expense - UPI
                  </Text>
                  <Text style={[styles.paymentCardAmount, { color: '#FF6B6B' }]}>
                    ₹{formatCurrency(totals.expenseUpi || 0)}
                  </Text>
                </View>
                <View style={styles.paymentCardFooter}>
                  <View style={styles.paymentCardProgressBar}>
                    <View 
                      style={[
                        styles.paymentCardProgressFill, 
                        { 
                          width: totals.expense > 0 
                            ? `${((totals.expenseUpi || 0) / totals.expense) * 100}%`
                            : '0%',
                          backgroundColor: '#4DABF7',
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paymentCardMeta}>
                    {totals.expense > 0 
                      ? `${(((totals.expenseUpi || 0) / totals.expense) * 100).toFixed(1)}% of expenses`
                      : '0% of expenses'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Expense Cash Card */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentCardIconContainer, { backgroundColor: '#FFD43B20' }]}>
                <Ionicons name="cash" size={24} color="#FFD43B" />
              </View>
              <View style={styles.paymentCardInfo}>
                <View style={styles.paymentCardHeader}>
                  <Text style={styles.paymentCardName} numberOfLines={1}>
                    Expense - Cash
                  </Text>
                  <Text style={[styles.paymentCardAmount, { color: '#FF6B6B' }]}>
                    ₹{formatCurrency(totals.expenseCash || 0)}
                  </Text>
                </View>
                <View style={styles.paymentCardFooter}>
                  <View style={styles.paymentCardProgressBar}>
                    <View 
                      style={[
                        styles.paymentCardProgressFill, 
                        { 
                          width: totals.expense > 0 
                            ? `${((totals.expenseCash || 0) / totals.expense) * 100}%`
                            : '0%',
                          backgroundColor: '#FFD43B',
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paymentCardMeta}>
                    {totals.expense > 0 
                      ? `${(((totals.expenseCash || 0) / totals.expense) * 100).toFixed(1)}% of expenses`
                      : '0% of expenses'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Income UPI Card */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentCardIconContainer, { backgroundColor: '#4DABF720' }]}>
                <Ionicons name="phone-portrait" size={24} color="#4DABF7" />
              </View>
              <View style={styles.paymentCardInfo}>
                <View style={styles.paymentCardHeader}>
                  <Text style={styles.paymentCardName} numberOfLines={1}>
                    Income - UPI
                  </Text>
                  <Text style={[styles.paymentCardAmount, { color: '#51CF66' }]}>
                    ₹{formatCurrency(totals.incomeUpi || 0)}
                  </Text>
                </View>
                <View style={styles.paymentCardFooter}>
                  <View style={styles.paymentCardProgressBar}>
                    <View 
                      style={[
                        styles.paymentCardProgressFill, 
                        { 
                          width: totals.income > 0 
                            ? `${((totals.incomeUpi || 0) / totals.income) * 100}%`
                            : '0%',
                          backgroundColor: '#4DABF7',
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paymentCardMeta}>
                    {totals.income > 0 
                      ? `${(((totals.incomeUpi || 0) / totals.income) * 100).toFixed(1)}% of income`
                      : '0% of income'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Income Cash Card */}
            <View style={styles.paymentCard}>
              <View style={[styles.paymentCardIconContainer, { backgroundColor: '#FFD43B20' }]}>
                <Ionicons name="cash" size={24} color="#FFD43B" />
              </View>
              <View style={styles.paymentCardInfo}>
                <View style={styles.paymentCardHeader}>
                  <Text style={styles.paymentCardName} numberOfLines={1}>
                    Income - Cash
                  </Text>
                  <Text style={[styles.paymentCardAmount, { color: '#51CF66' }]}>
                    ₹{formatCurrency(totals.incomeCash || 0)}
                  </Text>
                </View>
                <View style={styles.paymentCardFooter}>
                  <View style={styles.paymentCardProgressBar}>
                    <View 
                      style={[
                        styles.paymentCardProgressFill, 
                        { 
                          width: totals.income > 0 
                            ? `${((totals.incomeCash || 0) / totals.income) * 100}%`
                            : '0%',
                          backgroundColor: '#FFD43B',
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paymentCardMeta}>
                    {totals.income > 0 
                      ? `${(((totals.incomeCash || 0) / totals.income) * 100).toFixed(1)}% of income`
                      : '0% of income'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Category Chart Section */}
      {categoryChartData && categoryChartData.labels.length > 0 && (
        <View style={styles.chartsSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryChart(!showCategoryChart)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showCategoryChart ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
          {showCategoryChart && (
            <View style={styles.categoryListContainer}>
              {(() => {
                // Calculate total for percentage
                const totalAmount = categoryChartData.categoryData.reduce((sum, item) => sum + item.amount, 0);
                return categoryChartData.categoryData.map((item) => {
                  const percentage = totalAmount > 0 ? (item.amount / totalAmount * 100).toFixed(1) : 0;
                  return (
                    <View key={item.id} style={styles.categoryListItem}>
                      <View style={[styles.categoryListIconContainer, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon} size={24} color={item.color} />
                      </View>
                      <View style={styles.categoryListInfo}>
                        <View style={styles.categoryListHeader}>
                          <Text style={styles.categoryListName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.categoryListAmount}>
                            ₹{formatCurrency(item.amount)}
                          </Text>
                        </View>
                        <View style={styles.categoryListFooter}>
                          <View style={styles.categoryListProgressBar}>
                            <View 
                              style={[
                                styles.categoryListProgressFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: item.color,
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.categoryListMeta}>
                            {percentage}% • {item.count} {item.count === 1 ? 'entry' : 'entries'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          )}
        </View>
      )}

      {/* Charts Section */}
      {entries.length > 0 && (
        <View style={styles.chartsSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Visualizations</Text>
          </View>

          {/* Expense vs Income Cards */}
          {expenseIncomeData && expenseIncomeData.datasets && expenseIncomeData.datasets[0] && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Expense vs Income</Text>
              <View style={styles.cardListContainer}>
                {(() => {
                  const expense = expenseIncomeData.datasets[0].data[0] || 0;
                  const income = expenseIncomeData.datasets[0].data[1] || 0;
                  const total = expense + income;
                  const expensePercentage = total > 0 ? ((expense / total) * 100).toFixed(1) : 0;
                  const incomePercentage = total > 0 ? ((income / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <>
                      <View style={styles.cardListItem}>
                        <View style={[styles.cardListIconContainer, { backgroundColor: Colors.status.expense + '20' }]}>
                          <Ionicons name="arrow-down-circle" size={24} color={Colors.status.expense} />
                        </View>
                        <View style={styles.cardListInfo}>
                          <View style={styles.cardListHeader}>
                            <Text style={styles.cardListName}>Expense</Text>
                            <Text style={[styles.cardListAmount, { color: Colors.status.expense }]}>
                              ₹{formatCurrency(expense)}
                            </Text>
                          </View>
                          <View style={styles.cardListFooter}>
                            <View style={styles.cardListProgressBar}>
                              <View 
                                style={[
                                  styles.cardListProgressFill, 
                                  { 
                                    width: `${expensePercentage}%`,
                                    backgroundColor: Colors.status.expense,
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.cardListMeta}>
                              {expensePercentage}% of total
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.cardListItem}>
                        <View style={[styles.cardListIconContainer, { backgroundColor: Colors.status.income + '20' }]}>
                          <Ionicons name="arrow-up-circle" size={24} color={Colors.status.income} />
                        </View>
                        <View style={styles.cardListInfo}>
                          <View style={styles.cardListHeader}>
                            <Text style={styles.cardListName}>Income</Text>
                            <Text style={[styles.cardListAmount, { color: Colors.status.income }]}>
                              ₹{formatCurrency(income)}
                            </Text>
                          </View>
                          <View style={styles.cardListFooter}>
                            <View style={styles.cardListProgressBar}>
                              <View 
                                style={[
                                  styles.cardListProgressFill, 
                                  { 
                                    width: `${incomePercentage}%`,
                                    backgroundColor: Colors.status.income,
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.cardListMeta}>
                              {incomePercentage}% of total
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          )}

          {/* Monthly Trend Cards */}
          {monthlyData.labels.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Trend (Last 6 Months)</Text>
              <View style={styles.cardListContainer}>
                {(() => {
                  const months = monthlyData.labels;
                  const expenses = monthlyData.datasets[0]?.data || [];
                  const incomes = monthlyData.datasets[1]?.data || [];
                  const totalMonthly = months.reduce((sum, _, idx) => 
                    sum + (expenses[idx] || 0) + (incomes[idx] || 0), 0
                  );
                  
                  return months.map((month, index) => {
                    const expense = expenses[index] || 0;
                    const income = incomes[index] || 0;
                    const total = expense + income;
                    const percentage = totalMonthly > 0 ? ((total / totalMonthly) * 100).toFixed(1) : 0;
                    
                    return (
                      <View key={index} style={styles.cardListItem}>
                        <View style={[styles.cardListIconContainer, { backgroundColor: '#4DABF7' + '20' }]}>
                          <Ionicons name="calendar-outline" size={24} color="#4DABF7" />
                        </View>
                        <View style={styles.cardListInfo}>
                          <View style={styles.cardListHeader}>
                            <Text style={styles.cardListName}>{month}</Text>
                            <Text style={[styles.cardListAmount, { color: Colors.text.primary }]}>
                              ₹{formatCurrency(total)}
                            </Text>
                          </View>
                          <View style={styles.cardListFooter}>
                            <View style={styles.cardListProgressBar}>
                              <View 
                                style={[
                                  styles.cardListProgressFill, 
                                  { 
                                    width: `${percentage}%`,
                                    backgroundColor: '#4DABF7',
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.cardListMeta}>
                              {percentage}% • Expense: ₹{formatCurrency(expense)} • Income: ₹{formatCurrency(income)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

          {/* Payment Method Cards */}
          {paymentMethodData && paymentMethodData.datasets && paymentMethodData.datasets[0] && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>UPI vs Cash</Text>
              <View style={styles.cardListContainer}>
                {(() => {
                  const upi = paymentMethodData.datasets[0].data[0] || 0;
                  const cash = paymentMethodData.datasets[0].data[1] || 0;
                  const total = upi + cash;
                  const upiPercentage = total > 0 ? ((upi / total) * 100).toFixed(1) : 0;
                  const cashPercentage = total > 0 ? ((cash / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <>
                      <View style={styles.cardListItem}>
                        <View style={[styles.cardListIconContainer, { backgroundColor: '#007AFF' + '20' }]}>
                          <Ionicons name="phone-portrait-outline" size={24} color="#007AFF" />
                        </View>
                        <View style={styles.cardListInfo}>
                          <View style={styles.cardListHeader}>
                            <Text style={styles.cardListName}>UPI</Text>
                            <Text style={[styles.cardListAmount, { color: '#007AFF' }]}>
                              ₹{formatCurrency(upi)}
                            </Text>
                          </View>
                          <View style={styles.cardListFooter}>
                            <View style={styles.cardListProgressBar}>
                              <View 
                                style={[
                                  styles.cardListProgressFill, 
                                  { 
                                    width: `${upiPercentage}%`,
                                    backgroundColor: '#007AFF',
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.cardListMeta}>
                              {upiPercentage}% of total transactions
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.cardListItem}>
                        <View style={[styles.cardListIconContainer, { backgroundColor: '#FF9500' + '20' }]}>
                          <Ionicons name="cash-outline" size={24} color="#FF9500" />
                        </View>
                        <View style={styles.cardListInfo}>
                          <View style={styles.cardListHeader}>
                            <Text style={styles.cardListName}>Cash</Text>
                            <Text style={[styles.cardListAmount, { color: '#FF9500' }]}>
                              ₹{formatCurrency(cash)}
                            </Text>
                          </View>
                          <View style={styles.cardListFooter}>
                            <View style={styles.cardListProgressBar}>
                              <View 
                                style={[
                                  styles.cardListProgressFill, 
                                  { 
                                    width: `${cashPercentage}%`,
                                    backgroundColor: '#FF9500',
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.cardListMeta}>
                              {cashPercentage}% of total transactions
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Entry Count Card */}
      {filteredEntries.length > 0 && (
        <TouchableOpacity 
          style={styles.countCard}
          onPress={() => setShowEntriesModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.countContent}>
            <Text style={styles.countNumber}>{filteredEntries.length}</Text>
            <Text style={styles.countLabel}>
              {filteredEntries.length === 1 ? 'Entry' : 'Entries'} Found
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Filtered Entries Section */}
      {filteredEntries.length > 0 && (
        <View style={styles.entriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
          </View>
          <View style={styles.entriesListContainer}>
            {filteredEntries.slice(0, 5).map((entry) => {
              const isBalanceAdjustment = entry.type === 'balance_adjustment';
              const isCashWithdrawal = entry.type === 'cash_withdrawal';
              const isCashDeposit = entry.type === 'cash_deposit';
              const adjustmentIsAdd = isBalanceAdjustment ? (entry.adjustment_type === 'add' || !entry.adjustment_type) : false;
              
              // Get category for this entry
              const category = entry.category_id ? categories.find(cat => cat.id === entry.category_id) : null;
              
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.transactionCard}
                  activeOpacity={0.7}
                  onLongPress={() => {
                    setSelectedEntryForMenu(entry);
                    setLongPressMenuVisible(true);
                  }}
                >
                  <View style={styles.transactionLeft}>
                    {category ? (
                      <View style={[styles.transactionIconContainer, { backgroundColor: `${category.color}30` }]}>
                        <Ionicons
                          name={category.icon}
                          size={22}
                          color={category.color}
                        />
                      </View>
                    ) : (
                      <View style={[
                        styles.transactionIconContainer,
                        isCashWithdrawal || isCashDeposit
                          ? (isCashWithdrawal ? styles.transactionIconWithdrawal : styles.transactionIconDeposit)
                          : (isBalanceAdjustment 
                              ? styles.transactionIconAdjustment
                              : (entry.type === 'expense' ? styles.transactionIconExpense : styles.transactionIconIncome))
                      ]}>
                        <Ionicons
                          name={
                            isCashWithdrawal || isCashDeposit
                              ? 'swap-horizontal'
                              : (isBalanceAdjustment 
                                  ? (adjustmentIsAdd ? 'add-circle' : 'remove-circle')
                                  : (entry.type === 'expense' ? 'arrow-down' : 'arrow-up'))
                          }
                          size={22}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionNote} numberOfLines={1}>
                        {entry.note || (isCashWithdrawal ? 'Cash Withdrawal' : (isCashDeposit ? 'Cash Deposit' : (isBalanceAdjustment ? 'Balance Adjustment' : (entry.type === 'expense' ? 'Expense' : 'Income'))))}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <View style={styles.transactionMetaLeft}>
                          <Text style={styles.transactionDate}>{formatDateShort(entry.date)}</Text>
                          {category && (
                            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}25` }]}>
                              <Ionicons name={category.icon} size={11} color={category.color} />
                              <Text style={[styles.categoryBadgeText, { color: category.color, fontWeight: '600' }]}>{category.name}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <View style={styles.transactionRightTop}>
                      {isCashWithdrawal ? (
                        <View style={styles.transactionModeContainer}>
                          <View style={styles.transactionMode}>
                            <Ionicons name="phone-portrait" size={14} color="#4DABF7" />
                          </View>
                          <Text style={styles.transactionModeText}>→</Text>
                          <View style={styles.transactionMode}>
                            <Ionicons name="cash" size={14} color="#FFD43B" />
                          </View>
                        </View>
                      ) : isCashDeposit ? (
                        <View style={styles.transactionModeContainer}>
                          <View style={styles.transactionMode}>
                            <Ionicons name="cash" size={14} color="#FFD43B" />
                          </View>
                          <Text style={styles.transactionModeText}>→</Text>
                          <View style={styles.transactionMode}>
                            <Ionicons name="phone-portrait" size={14} color="#4DABF7" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.transactionMode}>
                          <Ionicons
                            name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                            size={14}
                            color={(entry.mode || 'upi') === 'upi' ? '#4DABF7' : '#FFD43B'}
                          />
                        </View>
                      )}
                      <Text style={[
                        styles.transactionAmount,
                        isCashWithdrawal || isCashDeposit
                          ? (isCashWithdrawal ? styles.transactionAmountWithdrawal : styles.transactionAmountDeposit)
                          : (isBalanceAdjustment 
                              ? styles.transactionAmountAdjustment
                              : (entry.type === 'expense' ? styles.transactionAmountExpense : styles.transactionAmountIncome))
                      ]}>
                        {isCashWithdrawal || isCashDeposit || isBalanceAdjustment
                          ? (isCashWithdrawal || isCashDeposit ? '' : (adjustmentIsAdd ? '+' : '-'))
                          : (entry.type === 'expense' ? '-' : '+')
                        }₹{formatCurrency(entry.amount)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedEntryForMenu(entry);
                        setLongPressMenuVisible(true);
                      }}
                      style={styles.transactionMoreButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredEntries.length > 5 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowEntriesModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>
                  View all {filteredEntries.length} entries
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Entries Report Modal */}
      <AddEntryModal
        visible={addEntryModalVisible}
        onClose={() => {
          closeAddEntryModal();
          // Don't clear entryToEdit here - it might be needed for reopening
          // It will be cleared after save in handleEntryAdded
        }}
        onSave={handleEntryAdded}
        editEntry={entryToEdit}
      />

      <EntriesReportModal
        visible={showEntriesModal}
        entries={filteredEntries}
        onClose={() => {
          setShowEntriesModal(false);
          // Don't clear entryToEdit here - it might be needed for edit action
        }}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={(entry) => {
          // Handle delete in SummaryScreen if needed
          Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteEntry(entry.id);
                  loadData();
                },
              },
            ]
          );
        }}
        title={`Entries Report - ${isCustomDateRange 
          ? `${formatDateWithMonthName(formatDate(startDate))} to ${formatDateWithMonthName(formatDate(endDate))}`
          : getPeriodLabel(selectedPeriod || 'monthly')
        }`}
      />

      {/* Long Press Menu Modal */}
      <Modal
        visible={longPressMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLongPressMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.longPressMenuOverlay}
          activeOpacity={1}
          onPress={() => setLongPressMenuVisible(false)}
        >
          <View style={styles.longPressMenuContent}>
            {selectedEntryForMenu &&
             selectedEntryForMenu.type !== 'cash_withdrawal' &&
             selectedEntryForMenu.type !== 'cash_deposit' &&
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.longPressMenuItem}
                onPress={() => {
                  if (selectedEntryForMenu) {
                    handleEdit(selectedEntryForMenu);
                    setLongPressMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.longPressMenuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {selectedEntryForMenu &&
             selectedEntryForMenu.type !== 'cash_withdrawal' &&
             selectedEntryForMenu.type !== 'cash_deposit' &&
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.longPressMenuItem}
                onPress={() => {
                  if (selectedEntryForMenu) {
                    handleDuplicate(selectedEntryForMenu);
                    setLongPressMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.longPressMenuText}>Duplicate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.longPressMenuItem, styles.longPressMenuItemDanger]}
              onPress={() => {
                if (selectedEntryForMenu) {
                  handleDelete(selectedEntryForMenu.id, selectedEntryForMenu);
                  setLongPressMenuVisible(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.status.expense} />
              <Text style={[styles.longPressMenuText, styles.longPressMenuTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        entry={entryToDelete}
      />

      {/* Footer */}
      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  periodContainer: {
    backgroundColor: Colors.background.primary,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  periodScrollContent: {
    paddingHorizontal: 20,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  periodButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  customDateButton: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customDateContainer: {
    backgroundColor: Colors.background.primary,
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalsSection: {
    backgroundColor: Colors.background.primary,
    margin: 0,
    padding: 20,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: 0,
    letterSpacing: -0.3,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  summaryCardsContainer: {
    gap: 12,
    marginTop: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  summaryCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryCardInfo: {
    flex: 1,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  summaryCardAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCardFooter: {
    gap: 6,
  },
  summaryCardProgressBar: {
    height: 4,
    backgroundColor: Colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  summaryCardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  summaryCardMeta: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  chartsSection: {
    margin: 0,
    padding: 20,
    paddingTop: 16,
    marginTop: 0,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  countCard: {
    backgroundColor: '#2C2C2E',
    margin: 0,
    marginTop: 0,
    padding: 20,
    paddingTop: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  countContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  countNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  countLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  entriesSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  entriesListContainer: {
    marginTop: 12,
    gap: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 12,
  },
  transactionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionIconExpense: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
  },
  transactionIconIncome: {
    backgroundColor: 'rgba(81, 207, 102, 0.25)',
  },
  transactionIconAdjustment: {
    backgroundColor: 'rgba(255, 152, 0, 0.25)',
  },
  transactionIconWithdrawal: {
    backgroundColor: 'rgba(77, 171, 247, 0.25)',
  },
  transactionIconDeposit: {
    backgroundColor: 'rgba(81, 207, 102, 0.25)',
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  transactionNote: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  transactionMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  transactionRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionModeText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  transactionMode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionAmountExpense: {
    color: '#FF6B6B',
  },
  transactionAmountIncome: {
    color: '#51CF66',
  },
  transactionAmountAdjustment: {
    color: '#FF9800',
  },
  transactionAmountWithdrawal: {
    color: '#4DABF7',
  },
  transactionAmountDeposit: {
    color: '#51CF66',
  },
  transactionMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  longPressMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  longPressMenuContent: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  longPressMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  longPressMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    marginTop: 4,
    paddingTop: 12,
  },
  longPressMenuText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  longPressMenuTextDanger: {
    color: Colors.status.expense,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.primary,
    marginRight: 6,
  },
  paymentBreakdownSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentCardsContainer: {
    gap: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  paymentCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardInfo: {
    flex: 1,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  paymentCardAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentCardFooter: {
    gap: 6,
  },
  paymentCardProgressBar: {
    height: 4,
    backgroundColor: Colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  paymentCardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  paymentCardMeta: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryFilterScroll: {
    gap: 8,
    paddingRight: 20,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    marginRight: 8,
    gap: 6,
  },
  categoryFilterButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  categoryFilterTextActive: {
    fontWeight: '700',
  },
  categoryListContainer: {
    gap: 12,
    marginTop: 8,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  categoryListIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryListInfo: {
    flex: 1,
  },
  categoryListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryListName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  categoryListAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.status.expense,
  },
  categoryListFooter: {
    gap: 6,
  },
  categoryListProgressBar: {
    height: 4,
    backgroundColor: Colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryListProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryListMeta: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  cardListContainer: {
    gap: 12,
    marginTop: 8,
  },
  cardListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  cardListIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardListInfo: {
    flex: 1,
  },
  cardListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardListName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  cardListAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardListFooter: {
    gap: 6,
  },
  cardListProgressBar: {
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardListProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default SummaryScreen;

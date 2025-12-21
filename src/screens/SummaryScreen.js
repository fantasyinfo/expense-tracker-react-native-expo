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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName, formatDate, formatCurrency } from '../utils/dateUtils';
import { loadEntries } from '../utils/storage';
import { prepareExpenseIncomeChart, prepareMonthlyChart, preparePaymentMethodChart } from '../utils/chartUtils';
import AppFooter from '../components/AppFooter';
import EntriesReportModal from '../components/EntriesReportModal';
import Colors from '../constants/colors';

const PERIODS = ['today', 'weekly', 'monthly', 'quarterly', 'yearly'];
const screenWidth = Dimensions.get('window').width;

const SummaryScreen = () => {
  const [entries, setEntries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filteredEntries, setFilteredEntries] = useState([]);
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
  const [chartType, setChartType] = useState('bar');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showEntriesModal, setShowEntriesModal] = useState(false);

  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    updateFilteredData(allEntries);
  }, [selectedPeriod, isCustomDateRange, startDate, endDate]);

  const updateFilteredData = (allEntries) => {
    let filtered;
    if (isCustomDateRange) {
      filtered = filterEntriesByDateRange(allEntries, startDate, endDate);
    } else {
      filtered = filterEntriesByPeriod(allEntries, selectedPeriod);
    }
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    updateFilteredData(entries);
  }, [selectedPeriod, isCustomDateRange, startDate, endDate, entries]);

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

  const chartConfig = {
    backgroundColor: Colors.chart.background,
    backgroundGradientFrom: Colors.chart.background,
    backgroundGradientTo: Colors.chart.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.accent.primary,
    },
  };

  const expenseIncomeData = prepareExpenseIncomeChart(entries, selectedPeriod || 'monthly');
  const monthlyData = prepareMonthlyChart(entries);
  const paymentMethodData = preparePaymentMethodChart(filteredEntries);

  // Prepare line chart data
  const expenseIncomeLineData = expenseIncomeData && expenseIncomeData.datasets && expenseIncomeData.datasets[0] ? {
    labels: expenseIncomeData.labels || [],
    datasets: [
      {
        data: expenseIncomeData.datasets[0].data || [0, 0],
      },
    ],
  } : { labels: ['Expense', 'Income'], datasets: [{ data: [0, 0] }] };

  const monthlyLineData = monthlyData && monthlyData.labels && monthlyData.labels.length > 0 && monthlyData.datasets && monthlyData.datasets[0] ? {
    labels: monthlyData.labels,
    datasets: [
      {
        data: monthlyData.datasets[0].data.map((expense, idx) => 
          (expense || 0) + ((monthlyData.datasets[1]?.data[idx]) || 0)
        ),
      },
    ],
  } : { labels: [], datasets: [{ data: [] }] };

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

      {/* Totals Display */}
      <View style={styles.totalsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <TouchableOpacity onPress={() => setShowEntriesModal(true)} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>View All Entries</Text>
          </TouchableOpacity>
        </View>

        {/* Professional Finance Summary Cards */}
        <View style={styles.financeSummaryGrid}>
          {/* Expense */}
          <View style={styles.financeCard}>
            <Text style={styles.financeLabel}>Total Expense</Text>
            <Text 
              style={[styles.financeAmount, styles.financeAmountExpense]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.6}
            >
              ₹{formatCurrency(totals.expense)}
            </Text>
          </View>

          {/* Income */}
          <View style={styles.financeCard}>
            <Text style={styles.financeLabel}>Total Income</Text>
            <Text 
              style={[styles.financeAmount, styles.financeAmountIncome]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.6}
            >
              ₹{formatCurrency(totals.income)}
            </Text>
          </View>

          {/* Balance */}
          <View style={styles.financeCard}>
            <Text style={styles.financeLabel}>Net Balance</Text>
            <Text 
              style={[
                styles.financeAmount,
                totals.balance >= 0 ? styles.financeAmountIncome : styles.financeAmountExpense
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.6}
            >
              ₹{formatCurrency(totals.balance)}
            </Text>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.paymentBreakdownSection}>
          <Text style={styles.breakdownTitle}>PAYMENT METHOD BREAKDOWN</Text>
          
          {/* Expense Breakdown */}
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownSectionTitle}>Expense</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>UPI</Text>
                <Text 
                  style={styles.breakdownValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  ₹{formatCurrency(totals.expenseUpi || 0)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Cash</Text>
                <Text 
                  style={styles.breakdownValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  ₹{formatCurrency(totals.expenseCash || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Income Breakdown */}
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownSectionTitle}>Income</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>UPI</Text>
                <Text 
                  style={styles.breakdownValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  ₹{formatCurrency(totals.incomeUpi || 0)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Cash</Text>
                <Text 
                  style={styles.breakdownValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  ₹{formatCurrency(totals.incomeCash || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Charts Section */}
      {entries.length > 0 && (
        <View style={styles.chartsSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Visualizations</Text>
          </View>

          {/* Chart Type Toggle */}
          <View style={styles.chartTypeContainer}>
            <TouchableOpacity
              style={[
                styles.chartTypeButton,
                chartType === 'bar' && styles.chartTypeButtonActive,
              ]}
              onPress={() => setChartType('bar')}
            >
              <Ionicons
                name="bar-chart"
                size={18}
                color={chartType === 'bar' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.chartTypeText,
                  chartType === 'bar' && styles.chartTypeTextActive,
                ]}
              >
                Bar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chartTypeButton,
                chartType === 'line' && styles.chartTypeButtonActive,
              ]}
              onPress={() => setChartType('line')}
            >
              <Ionicons
                name="trending-up"
                size={18}
                color={chartType === 'line' ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.chartTypeText,
                  chartType === 'line' && styles.chartTypeTextActive,
                ]}
              >
                Line
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expense vs Income Chart */}
          {expenseIncomeData && expenseIncomeData.datasets && expenseIncomeData.datasets[0] && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Expense vs Income</Text>
              {chartType === 'bar' ? (
                <BarChart
                  data={expenseIncomeData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(211, 47, 47, ${opacity})`,
                  }}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  showValuesOnTopOfBars
                  style={styles.chart}
                />
              ) : (
                <LineChart
                  data={expenseIncomeLineData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              )}
            </View>
          )}

          {/* Monthly Trend Chart */}
          {monthlyData.labels.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Trend (Last 6 Months)</Text>
              {chartType === 'bar' ? (
                <BarChart
                  data={monthlyData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  showValuesOnTopOfBars
                  style={styles.chart}
                />
              ) : (
                <LineChart
                  data={monthlyLineData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              )}
            </View>
          )}

          {/* Payment Method Chart */}
          {paymentMethodData && paymentMethodData.datasets && paymentMethodData.datasets[0] && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>UPI vs Cash</Text>
              {chartType === 'bar' ? (
                <BarChart
                  data={paymentMethodData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  }}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  showValuesOnTopOfBars
                  style={styles.chart}
                />
              ) : (
                <BarChart
                  data={paymentMethodData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  }}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  showValuesOnTopOfBars
                  style={styles.chart}
                />
              )}
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
            {filteredEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={[
                styles.entryItem,
                entry.type === 'expense' ? styles.entryItemExpense : styles.entryItemIncome
              ]}>
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
                  <View style={styles.entryAmountRow}>
                    <Text style={[
                      styles.entryAmount,
                      entry.type === 'expense' ? styles.expenseAmount : styles.incomeAmount
                    ]}>
                      {entry.type === 'expense' ? '-' : '+'}₹{formatCurrency(entry.amount)}
                    </Text>
                    <View style={styles.modeIndicator}>
                      <Ionicons
                        name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                        size={14}
                        color={(entry.mode || 'upi') === 'upi' ? '#007AFF' : '#888888'}
                      />
                    </View>
                  </View>
                  <View style={styles.entryDetails}>
                    {entry.note ? (
                      <Text style={styles.entryNote}>{entry.note}</Text>
                    ) : (
                      <Text style={styles.entryType}>
                        {entry.type === 'expense' ? 'Expense' : 'Income'}
                      </Text>
                    )}
                    <Text style={styles.entryDate}>{formatDateWithMonthName(entry.date)}</Text>
                  </View>
                </View>
              </View>
            ))}
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
      <EntriesReportModal
        visible={showEntriesModal}
        entries={filteredEntries}
        onClose={() => setShowEntriesModal(false)}
        title={`Entries Report - ${isCustomDateRange 
          ? `${formatDateWithMonthName(formatDate(startDate))} to ${formatDateWithMonthName(formatDate(endDate))}`
          : getPeriodLabel(selectedPeriod || 'monthly')
        }`}
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
  financeSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  financeCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  financeLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  financeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  financeAmountExpense: {
    color: Colors.status.expense,
  },
  financeAmountIncome: {
    color: Colors.status.income,
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
  chartTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  chartTypeButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  chartTypeTextActive: {
    color: '#fff',
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
    backgroundColor: '#1C1C1E',
    margin: 0,
    marginTop: 0,
    padding: 20,
    paddingTop: 16,
    borderRadius: 0,
    borderWidth: 0,
  },
  entriesListContainer: {
    marginTop: 12,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  entryItemExpense: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.expense,
  },
  entryItemIncome: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.income,
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
    backgroundColor: Colors.iconBackground.expense,
  },
  incomeIconBg: {
    backgroundColor: Colors.iconBackground.income,
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
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  modeIndicator: {
    padding: 2,
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryNote: {
    fontSize: 12,
    color: '#A0A0A0',
    flex: 1,
    fontWeight: '400',
  },
  entryType: {
    fontSize: 11,
    color: '#808080',
    fontWeight: '400',
  },
  entryDate: {
    fontSize: 11,
    color: '#808080',
    fontWeight: '400',
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
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
});

export default SummaryScreen;

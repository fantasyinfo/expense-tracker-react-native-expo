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
import { filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName, formatDate } from '../utils/dateUtils';
import { loadEntries } from '../utils/storage';
import { prepareExpenseIncomeChart, prepareMonthlyChart } from '../utils/chartUtils';
import AppFooter from '../components/AppFooter';

const PERIODS = ['today', 'weekly', 'monthly', 'quarterly', 'yearly'];
const screenWidth = Dimensions.get('window').width;

const SummaryScreen = () => {
  const [entries, setEntries] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

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
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1976d2',
    },
  };

  const expenseIncomeData = prepareExpenseIncomeChart(entries, selectedPeriod || 'monthly');
  const monthlyData = prepareMonthlyChart(entries);

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
              <Ionicons
                name={getPeriodIcon(period)}
                size={16}
                color={selectedPeriod === period && !isCustomDateRange ? '#fff' : '#666'}
                style={styles.periodIcon}
              />
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
            <Ionicons
              name="calendar"
              size={16}
              color={isCustomDateRange ? '#fff' : '#666'}
              style={styles.periodIcon}
            />
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
            />
          )}
        </View>
      )}

      {/* Totals Display */}
      <View style={styles.totalsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={24} color="#1976d2" />
          <Text style={styles.sectionTitle}>Summary</Text>
        </View>

        {/* Expense Card */}
        <View style={[styles.totalCard, styles.expenseCard]}>
          <View style={styles.totalCardLeft}>
            <View style={[styles.iconCircle, styles.expenseIconBg]}>
              <Ionicons name="arrow-down-circle" size={28} color="#d32f2f" />
            </View>
            <View style={styles.totalCardContent}>
              <Text style={styles.totalCardLabel}>Total Expense</Text>
              <Text style={[styles.totalCardValue, styles.expenseAmount]}>
                ₹{totals.expense.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Income Card */}
        <View style={[styles.totalCard, styles.incomeCard]}>
          <View style={styles.totalCardLeft}>
            <View style={[styles.iconCircle, styles.incomeIconBg]}>
              <Ionicons name="arrow-up-circle" size={28} color="#388e3c" />
            </View>
            <View style={styles.totalCardContent}>
              <Text style={styles.totalCardLabel}>Total Income</Text>
              <Text style={[styles.totalCardValue, styles.incomeAmount]}>
                ₹{totals.income.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={[styles.totalCard, styles.balanceCard]}>
          <View style={styles.totalCardLeft}>
            <View style={[
              styles.iconCircle,
              totals.balance >= 0 ? styles.balancePositiveBg : styles.balanceNegativeBg
            ]}>
              <Ionicons
                name={totals.balance >= 0 ? 'trending-up' : 'trending-down'}
                size={28}
                color={totals.balance >= 0 ? '#388e3c' : '#d32f2f'}
              />
            </View>
            <View style={styles.totalCardContent}>
              <Text style={styles.totalCardLabel}>Net Balance</Text>
              <Text
                style={[
                  styles.totalCardValue,
                  styles.balanceValue,
                  totals.balance >= 0 ? styles.incomeAmount : styles.expenseAmount,
                ]}
              >
                ₹{totals.balance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Charts Section */}
      {entries.length > 0 && (
        <View style={styles.chartsSection}>
          <View style={styles.chartHeader}>
            <Ionicons name="bar-chart" size={24} color="#1976d2" />
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
        </View>
      )}

      {/* Entry Count Card */}
      <View style={styles.countCard}>
        <View style={styles.countContent}>
          <Ionicons name="document-text" size={24} color="#1976d2" />
          <View style={styles.countTextContainer}>
            <Text style={styles.countNumber}>{filteredEntries.length}</Text>
            <Text style={styles.countLabel}>
              {filteredEntries.length === 1 ? 'entry' : 'entries'} found
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  periodContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  periodScrollContent: {
    paddingHorizontal: 16,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  customDateButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  periodIcon: {
    marginRight: 6,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  customDateContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 10,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalsSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  totalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#388e3c',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    backgroundColor: '#f0f7ff',
  },
  totalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  expenseIconBg: {
    backgroundColor: '#ffebee',
  },
  incomeIconBg: {
    backgroundColor: '#e8f5e9',
  },
  balancePositiveBg: {
    backgroundColor: '#e8f5e9',
  },
  balanceNegativeBg: {
    backgroundColor: '#ffebee',
  },
  totalCardContent: {
    flex: 1,
  },
  totalCardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  totalCardValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 26,
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  chartsSection: {
    margin: 16,
    marginTop: 0,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chartTypeButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  countCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  countContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTextContainer: {
    marginLeft: 12,
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1976d2',
  },
  countLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default SummaryScreen;

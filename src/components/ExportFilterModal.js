import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, formatDateWithMonthName } from '../utils/dateUtils';
import Colors from '../constants/colors';

const ExportFilterModal = ({ visible, onClose, onExport, entries, format }) => {
  const [exportAction, setExportAction] = useState('share'); // 'share' or 'save'
  const [filterType, setFilterType] = useState('all'); // 'all', 'period', 'custom'
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // 'today', 'weekly', 'monthly', 'yearly'
  const [entryType, setEntryType] = useState('all'); // 'all', 'expense', 'income', 'withdrawal', 'deposit'
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleExport = () => {
    let filteredEntries = entries;
    let dateRange = null;

    // Apply date filters
    if (filterType === 'period') {
      const today = new Date();
      let start, end;

      switch (selectedPeriod) {
        case 'today':
          start = new Date(today);
          end = new Date(today);
          break;
        case 'weekly':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          end = new Date(today);
          break;
        case 'monthly':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today);
          break;
        case 'yearly':
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today);
          break;
        default:
          start = new Date(today);
          end = new Date(today);
      }

      dateRange = { start, end, period: selectedPeriod };
      filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    } else if (filterType === 'custom') {
      dateRange = { start: startDate, end: endDate, period: 'custom' };
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      filteredEntries = entries.filter(entry => {
        return entry.date >= start && entry.date <= end;
      });
    }

    // Apply entry type filter
    let typeFilteredEntries = filteredEntries;
    if (entryType !== 'all') {
      if (entryType === 'withdrawal') {
        typeFilteredEntries = filteredEntries.filter(e => e.type === 'cash_withdrawal');
      } else if (entryType === 'deposit') {
        typeFilteredEntries = filteredEntries.filter(e => e.type === 'cash_deposit');
      } else {
        typeFilteredEntries = filteredEntries.filter(e => e.type === entryType);
      }
    }

    if (typeFilteredEntries.length === 0) {
      Alert.alert('No Data', 'No entries found for the selected filters.');
      return;
    }

    onExport({
      entries: typeFilteredEntries,
      action: exportAction,
      dateRange,
      entryType,
      format,
    });

    onClose();
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

  const getFilteredCount = () => {
    let dateFiltered = entries;
    
    if (filterType === 'all') {
      dateFiltered = entries;
    } else if (filterType === 'period') {
      const today = new Date();
      let start, end;

      switch (selectedPeriod) {
        case 'today':
          start = new Date(today);
          end = new Date(today);
          break;
        case 'weekly':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          end = new Date(today);
          break;
        case 'monthly':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today);
          break;
        case 'yearly':
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today);
          break;
        default:
          return entries.length;
      }

      dateFiltered = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    } else if (filterType === 'custom') {
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      dateFiltered = entries.filter(entry => {
        return entry.date >= start && entry.date <= end;
      });
    }
    
    // Apply entry type filter
    if (entryType !== 'all') {
      if (entryType === 'withdrawal') {
        dateFiltered = dateFiltered.filter(e => e.type === 'cash_withdrawal');
      } else if (entryType === 'deposit') {
        dateFiltered = dateFiltered.filter(e => e.type === 'cash_deposit');
      } else {
        dateFiltered = dateFiltered.filter(e => e.type === entryType);
      }
    }
    
    return dateFiltered.length;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Export {format === 'csv' ? 'Excel' : format === 'json' ? 'JSON' : 'PDF'}
              </Text>
              <Text style={styles.modalSubtitle}>Configure export options</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Entry Type Filter */}
            <View style={styles.section}>
              <View style={styles.sectionLabelContainer}>
                <Ionicons name="filter" size={14} color={Colors.text.secondary} />
                <Text style={styles.sectionLabel}>Entry Type</Text>
              </View>
              <View style={styles.filterTypeContainer}>
                {[
                  { type: 'all', icon: 'apps', label: 'All' },
                  { type: 'expense', icon: 'arrow-down-circle', label: 'Expense' },
                  { type: 'income', icon: 'arrow-up-circle', label: 'Income' },
                  { type: 'withdrawal', icon: 'swap-horizontal', label: 'Withdraw' },
                  { type: 'deposit', icon: 'add-circle', label: 'Deposit' },
                ].map(({ type, icon, label }) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterTypeButton,
                      entryType === type && styles.filterTypeButtonActive,
                    ]}
                    onPress={() => setEntryType(type)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={icon} 
                      size={18} 
                      color={entryType === type ? '#FFFFFF' : Colors.text.secondary} 
                    />
                    <Text
                      style={[
                        styles.filterTypeButtonText,
                        entryType === type && styles.filterTypeButtonTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Export Action Selection */}
            <View style={styles.section}>
              <View style={styles.sectionLabelContainer}>
                <Ionicons name="cloud-upload" size={14} color={Colors.text.secondary} />
                <Text style={styles.sectionLabel}>Export Action</Text>
              </View>
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    exportAction === 'share' && styles.actionButtonActive,
                  ]}
                  onPress={() => setExportAction('share')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="share-social" 
                    size={22} 
                    color={exportAction === 'share' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      exportAction === 'share' && styles.actionButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Share
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    exportAction === 'save' && styles.actionButtonActive,
                  ]}
                  onPress={() => setExportAction('save')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="download" 
                    size={22} 
                    color={exportAction === 'save' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      exportAction === 'save' && styles.actionButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Filter Selection */}
            <View style={styles.section}>
              <View style={styles.sectionLabelContainer}>
                <Ionicons name="calendar" size={14} color={Colors.text.secondary} />
                <Text style={styles.sectionLabel}>Date Filter</Text>
              </View>
              <View style={styles.filterTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterTypeButton,
                    filterType === 'all' && styles.filterTypeButtonActive,
                  ]}
                  onPress={() => setFilterType('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTypeButtonText,
                      filterType === 'all' && styles.filterTypeButtonTextActive,
                    ]}
                  >
                    All Entries
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterTypeButton,
                    filterType === 'period' && styles.filterTypeButtonActive,
                  ]}
                  onPress={() => setFilterType('period')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTypeButtonText,
                      filterType === 'period' && styles.filterTypeButtonTextActive,
                    ]}
                  >
                    Period
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterTypeButton,
                    filterType === 'custom' && styles.filterTypeButtonActive,
                  ]}
                  onPress={() => setFilterType('custom')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTypeButtonText,
                      filterType === 'custom' && styles.filterTypeButtonTextActive,
                    ]}
                  >
                    Custom Range
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Period Selection */}
            {filterType === 'period' && (
              <View style={styles.section}>
                <View style={styles.sectionLabelContainer}>
                  <Ionicons name="time" size={14} color={Colors.text.secondary} />
                  <Text style={styles.sectionLabel}>Select Period</Text>
                </View>
                <View style={styles.periodContainer}>
                  {[
                    { period: 'today', icon: 'today', label: 'Today' },
                    { period: 'weekly', icon: 'calendar', label: 'Week' },
                    { period: 'monthly', icon: 'calendar-outline', label: 'Month' },
                    { period: 'yearly', icon: 'calendar-sharp', label: 'Year' },
                  ].map(({ period, icon, label }) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodButton,
                        selectedPeriod === period && styles.periodButtonActive,
                      ]}
                      onPress={() => setSelectedPeriod(period)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={icon} 
                        size={18} 
                        color={selectedPeriod === period ? '#FFFFFF' : Colors.text.secondary} 
                      />
                      <Text
                        style={[
                          styles.periodButtonText,
                          selectedPeriod === period && styles.periodButtonTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Date Range */}
            {filterType === 'custom' && (
              <View style={styles.section}>
                <View style={styles.sectionLabelContainer}>
                  <Ionicons name="calendar-number" size={14} color={Colors.text.secondary} />
                  <Text style={styles.sectionLabel}>Custom Date Range</Text>
                </View>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.accent.primary} />
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
                    <Ionicons name="calendar-outline" size={18} color={Colors.accent.primary} />
                    <View style={styles.datePickerTextContainer}>
                      <Text style={styles.datePickerLabel}>End Date</Text>
                      <Text style={styles.datePickerValue}>
                        {formatDateWithMonthName(formatDate(endDate))}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Entry Count */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color={Colors.status.info} />
                <Text style={styles.infoText}>
                  {getFilteredCount()} entries will be exported
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.accent.gradient.positive}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exportButtonGradient}
              >
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
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
    padding: 28,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 24,
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
  scrollView: {
    maxHeight: 450,
    paddingRight: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    minHeight: 52,
  },
  actionButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  filterTypeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 6,
    gap: 6,
    flexWrap: 'nowrap',
  },
  filterTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: 4,
  },
  filterTypeButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  filterTypeButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  filterTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
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
    padding: 18,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 60,
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  infoSection: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  exportButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exportButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ExportFilterModal;


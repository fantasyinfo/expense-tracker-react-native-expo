import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries } from '../utils/storage';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfUtils';
import { shareApp, shareViaWhatsApp, shareViaSMS, openDriveDownload, shareDriveDownload } from '../utils/shareUtils';
import { 
  getInitialBankBalance, 
  getInitialCashBalance, 
  setInitialBankBalance, 
  setInitialCashBalance,
  getCurrentBankBalance,
  getCurrentCashBalance,
  calculateInitialBalancesFromEntries
} from '../utils/balanceUtils';
import { getGoals, saveGoals, resetGoalCompletion } from '../utils/engagementUtils';
import AppFooter from '../components/AppFooter';
import EntriesReportModal from '../components/EntriesReportModal';
import CashWithdrawalModal from '../components/CashWithdrawalModal';
import CashDepositModal from '../components/CashDepositModal';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { useModal } from '../context/ModalContext';
import ImportModal from '../components/ImportModal';
import BackupSettingsModal from '../components/BackupSettingsModal';
import ExportFilterModal from '../components/ExportFilterModal';
import UserGuideScreen from './UserGuideScreen';
import { createManualBackup, getLastBackupTime, formatBackupDate } from '../utils/backupUtils';

const CollapsibleSection = ({ title, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.text.secondary}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
};

const SettingsScreen = () => {
  const {
    cashWithdrawalModalVisible,
    openCashWithdrawalModal,
    closeCashWithdrawalModal,
    cashDepositModalVisible,
    openCashDepositModal,
    closeCashDepositModal,
  } = useModal();
  const [entries, setEntries] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [bankBalance, setBankBalance] = useState(null);
  const [cashBalance, setCashBalance] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceType, setBalanceType] = useState('bank'); // 'bank' or 'cash'
  const [balanceInput, setBalanceInput] = useState('');
  const [goals, setGoals] = useState({ 
    dailySavingsGoal: 0,
    weeklySavingsGoal: 0,
    monthlySavingsGoal: 0,
    yearlySavingsGoal: 0,
    customSavingsGoal: 0,
    customSavingsGoalName: '',
    dailyExpenseGoal: 0,
    weeklyExpenseGoal: 0,
    monthlyExpenseGoal: 0,
    yearlyExpenseGoal: 0,
    customExpenseGoal: 0,
    customExpenseGoalName: '',
  });
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalType, setGoalType] = useState('monthly');
  const [goalCategory, setGoalCategory] = useState('savings'); // 'savings' or 'expense'
  const [goalInput, setGoalInput] = useState('');
  const [customGoalNameInput, setCustomGoalNameInput] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupSettingsModal, setShowBackupSettingsModal] = useState(false);
  const [showExportFilterModal, setShowExportFilterModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' or 'json'
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [backupCreating, setBackupCreating] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);

  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    setEntryCount(allEntries.length);
    
    // Load current balances
    const bankBal = await getCurrentBankBalance();
    const cashBal = await getCurrentCashBalance();
    setBankBalance(bankBal);
    setCashBalance(cashBal);
    
    // Load goals
    const goalsData = await getGoals();
    setGoals(goalsData);
    
    // Load last backup time
    const lastBackup = await getLastBackupTime();
    setLastBackupTime(lastBackup);
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportExcel = () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }
    setExportFormat('csv');
    setShowExportFilterModal(true);
  };

  const handleExportJSON = () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }
    setExportFormat('json');
    setShowExportFilterModal(true);
  };

  const handleExportPDF = () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }
    setExportFormat('pdf');
    setShowExportFilterModal(true);
  };

  const handleExport = async (exportOptions) => {
    setExporting(true);
    try {
      let result;
      if (exportOptions.format === 'csv') {
        result = await exportToExcel(exportOptions.entries, {
          action: exportOptions.action,
          dateRange: exportOptions.dateRange,
          entryType: exportOptions.entryType,
        });
      } else if (exportOptions.format === 'json') {
        result = await exportToJSON(exportOptions.entries, {
          action: exportOptions.action,
          dateRange: exportOptions.dateRange,
          entryType: exportOptions.entryType,
        });
      } else if (exportOptions.format === 'pdf') {
        result = await exportToPDF(exportOptions.entries, {
          action: exportOptions.action,
          dateRange: exportOptions.dateRange,
          entryType: exportOptions.entryType,
        });
      }

      if (result.saved) {
        Alert.alert('Success', result.message || 'Data exported and saved to device successfully!');
      } else {
        Alert.alert('Success', result.message || 'Data exported successfully!');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to export data. Please try again.');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleShareApp = () => {
    Alert.alert(
      'Share Kharcha',
      'Choose how you want to share the app',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'WhatsApp',
          onPress: shareViaWhatsApp,
        },
        {
          text: 'SMS',
          onPress: shareViaSMS,
        },
        {
          text: 'Other',
          onPress: shareApp,
        },
      ]
    );
  };

  const handleSetBalance = (type) => {
    setBalanceType(type);
    const currentBalance = type === 'bank' ? bankBalance : cashBalance;
    setBalanceInput(currentBalance !== null ? currentBalance.toString() : '');
    setShowBalanceModal(true);
  };

  const handleSaveBalance = async () => {
    const balance = parseFloat(balanceInput);
    if (isNaN(balance)) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    try {
      if (balanceType === 'bank') {
        await setInitialBankBalance(balance);
      } else {
        await setInitialCashBalance(balance);
      }
      Alert.alert('Success', `${balanceType === 'bank' ? 'Bank' : 'Cash'} balance set successfully!`);
      setShowBalanceModal(false);
      setBalanceInput('');
      loadData(); // Reload to update displayed balances
    } catch (error) {
      Alert.alert('Error', 'Failed to save balance. Please try again.');
      console.error(error);
    }
  };

  const handleCreateBackup = async () => {
    if (entryCount === 0) {
      Alert.alert('No Data', 'There are no entries to backup.');
      return;
    }

    setBackupCreating(true);
    try {
      const result = await createManualBackup();
      Alert.alert(
        'Backup Created',
        `Backup file created successfully!\n\nEntries: ${result.entryCount}\nFile: ${result.fileName}\n\nChoose where to save the backup file.`,
        [{ text: 'OK' }]
      );
      // Reload to update last backup time
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create backup. Please try again.');
      console.error(error);
    } finally {
      setBackupCreating(false);
    }
  };

  const handleImportComplete = async () => {
    await loadData();
  };

  const handleAutoCalculateBalances = async () => {
    Alert.alert(
      'Auto Calculate Initial Balances',
      'This will calculate initial balances from all your existing entries (assuming starting balance was 0). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Calculate',
          onPress: async () => {
            try {
              const { bankBalance: bankBal, cashBalance: cashBal } = await calculateInitialBalancesFromEntries();
              await setInitialBankBalance(bankBal);
              await setInitialCashBalance(cashBal);
              Alert.alert('Success', 'Initial balances calculated and set successfully!');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to calculate balances. Please try again.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const SettingCard = ({ icon, title, description, onPress, disabled = false }) => (
    <TouchableOpacity
      style={[styles.settingCard, disabled && styles.settingCardDisabled]}
      onPress={onPress}
      disabled={disabled || exporting}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Balance Management Section */}
      <CollapsibleSection title="Balance Management" defaultExpanded={true}>
        <View style={styles.sectionContent}>
          {/* Current Balances Display */}
          <View style={styles.balanceDisplayRow}>
            {bankBalance !== null && (
              <View style={styles.balanceDisplayCard}>
                <Text style={styles.balanceDisplayLabel}>Bank / UPI</Text>
                <Text style={[
                  styles.balanceDisplayAmount,
                  bankBalance < 0 && styles.balanceDisplayAmountNegative
                ]}>
                  ₹{formatCurrency(bankBalance)}
                </Text>
              </View>
            )}
            {cashBalance !== null && (
              <View style={styles.balanceDisplayCard}>
                <Text style={styles.balanceDisplayLabel}>Cash</Text>
                <Text style={[
                  styles.balanceDisplayAmount,
                  cashBalance < 0 && styles.balanceDisplayAmountNegative
                ]}>
                  ₹{formatCurrency(cashBalance)}
                </Text>
              </View>
            )}
          </View>

          <SettingCard
            title="Set Bank / UPI Balance"
            description="Set your initial bank or UPI balance"
            onPress={() => handleSetBalance('bank')}
          />
          <SettingCard
            title="Set Cash Balance"
            description="Set your initial cash balance"
            onPress={() => handleSetBalance('cash')}
          />
          <SettingCard
            title="Auto Calculate from Entries"
            description="Calculate initial balances from all existing entries"
            onPress={handleAutoCalculateBalances}
            disabled={entryCount === 0}
          />
          <SettingCard
            title="Cash Withdrawal"
            description="Withdraw cash from UPI to Cash"
            onPress={openCashWithdrawalModal}
          />
          <SettingCard
            title="Cash Deposit"
            description="Deposit cash from Cash to UPI"
            onPress={openCashDepositModal}
          />
        </View>
      </CollapsibleSection>

      {/* Savings Goals Section */}
      <CollapsibleSection title="Savings Goals">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Set Daily Savings Goal"
            description={goals.dailySavingsGoal > 0 ? `Current: ₹${formatCurrency(goals.dailySavingsGoal)}` : 'Set your daily savings target'}
            onPress={() => {
              setGoalCategory('savings');
              setGoalType('daily');
              setGoalInput(goals.dailySavingsGoal > 0 ? goals.dailySavingsGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Weekly Savings Goal"
            description={goals.weeklySavingsGoal > 0 ? `Current: ₹${formatCurrency(goals.weeklySavingsGoal)}` : 'Set your weekly savings target'}
            onPress={() => {
              setGoalCategory('savings');
              setGoalType('weekly');
              setGoalInput(goals.weeklySavingsGoal > 0 ? goals.weeklySavingsGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Monthly Savings Goal"
            description={goals.monthlySavingsGoal > 0 ? `Current: ₹${formatCurrency(goals.monthlySavingsGoal)}` : 'Set your monthly savings target'}
            onPress={() => {
              setGoalCategory('savings');
              setGoalType('monthly');
              setGoalInput(goals.monthlySavingsGoal > 0 ? goals.monthlySavingsGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Yearly Savings Goal"
            description={goals.yearlySavingsGoal > 0 ? `Current: ₹${formatCurrency(goals.yearlySavingsGoal)}` : 'Set your yearly savings target'}
            onPress={() => {
              setGoalCategory('savings');
              setGoalType('yearly');
              setGoalInput(goals.yearlySavingsGoal > 0 ? goals.yearlySavingsGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Custom Savings Goal"
            description={goals.customSavingsGoal > 0 ? `${goals.customSavingsGoalName || 'Custom'}: ₹${formatCurrency(goals.customSavingsGoal)}` : 'Set a custom savings goal'}
            onPress={() => {
              setGoalCategory('savings');
              setGoalType('custom');
              setGoalInput(goals.customSavingsGoal > 0 ? goals.customSavingsGoal.toString() : '');
              setCustomGoalNameInput(goals.customSavingsGoalName || '');
              setShowGoalsModal(true);
            }}
          />
        </View>
      </CollapsibleSection>

      {/* Expense Goals Section */}
      <CollapsibleSection title="Expense Limits">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Set Daily Expense Limit"
            description={goals.dailyExpenseGoal > 0 ? `Current: ₹${formatCurrency(goals.dailyExpenseGoal)}` : 'Set your daily expense limit'}
            onPress={() => {
              setGoalCategory('expense');
              setGoalType('daily');
              setGoalInput(goals.dailyExpenseGoal > 0 ? goals.dailyExpenseGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Weekly Expense Limit"
            description={goals.weeklyExpenseGoal > 0 ? `Current: ₹${formatCurrency(goals.weeklyExpenseGoal)}` : 'Set your weekly expense limit'}
            onPress={() => {
              setGoalCategory('expense');
              setGoalType('weekly');
              setGoalInput(goals.weeklyExpenseGoal > 0 ? goals.weeklyExpenseGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Monthly Expense Limit"
            description={goals.monthlyExpenseGoal > 0 ? `Current: ₹${formatCurrency(goals.monthlyExpenseGoal)}` : 'Set your monthly expense limit'}
            onPress={() => {
              setGoalCategory('expense');
              setGoalType('monthly');
              setGoalInput(goals.monthlyExpenseGoal > 0 ? goals.monthlyExpenseGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Yearly Expense Limit"
            description={goals.yearlyExpenseGoal > 0 ? `Current: ₹${formatCurrency(goals.yearlyExpenseGoal)}` : 'Set your yearly expense limit'}
            onPress={() => {
              setGoalCategory('expense');
              setGoalType('yearly');
              setGoalInput(goals.yearlyExpenseGoal > 0 ? goals.yearlyExpenseGoal.toString() : '');
              setShowGoalsModal(true);
            }}
          />
          <SettingCard
            title="Set Custom Expense Limit"
            description={goals.customExpenseGoal > 0 ? `${goals.customExpenseGoalName || 'Custom'}: ₹${formatCurrency(goals.customExpenseGoal)}` : 'Set a custom expense limit'}
            onPress={() => {
              setGoalCategory('expense');
              setGoalType('custom');
              setGoalInput(goals.customExpenseGoal > 0 ? goals.customExpenseGoal.toString() : '');
              setCustomGoalNameInput(goals.customExpenseGoalName || '');
              setShowGoalsModal(true);
            }}
          />
        </View>
      </CollapsibleSection>

      {/* Import Section */}
      <CollapsibleSection title="Data Import">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Import from CSV/JSON"
            description="Import entries from exported backup files"
            onPress={() => setShowImportModal(true)}
          />
        </View>
      </CollapsibleSection>

      {/* Export Section */}
      <CollapsibleSection title="Data Export">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Export to Excel"
            description="Download data as .csv file"
            onPress={handleExportExcel}
            disabled={entryCount === 0}
          />
          <SettingCard
            title="Export to JSON"
            description="Download data as .json file"
            onPress={handleExportJSON}
            disabled={entryCount === 0}
          />
          <SettingCard
            title="Export to PDF"
            description="Generate PDF report (HTML format)"
            onPress={handleExportPDF}
            disabled={entryCount === 0}
          />
        </View>
      </CollapsibleSection>

      {/* Backup & Restore Section */}
      <CollapsibleSection title="Backup & Restore">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Create Backup"
            description={
              lastBackupTime 
                ? `Last backup: ${formatBackupDate(lastBackupTime)}`
                : 'Create a backup file with all your data'
            }
            onPress={handleCreateBackup}
            disabled={entryCount === 0 || backupCreating}
          />
          <SettingCard
            title="Restore from Backup"
            description="Restore data from a backup file"
            onPress={() => setShowImportModal(true)}
          />
          <SettingCard
            title="Backup Settings"
            description="Configure backup method and preferences"
            onPress={() => setShowBackupSettingsModal(true)}
          />
        </View>
      </CollapsibleSection>

      {/* Share App Section */}
      <CollapsibleSection title="Share App">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Share via WhatsApp"
            description="Share Kharcha with friends and family"
            onPress={shareViaWhatsApp}
          />
          <SettingCard
            title="Share via SMS"
            description="Send app details via text message"
            onPress={shareViaSMS}
          />
          <SettingCard
            title="Share via Other"
            description="Share using any available app"
            onPress={shareApp}
          />
        </View>
      </CollapsibleSection>

      {/* Download APK Section */}
      <CollapsibleSection title="Download APK">
        <View style={styles.sectionContent}>
          <SettingCard
            title="Download APK"
            description="Open Google Drive to download the app"
            onPress={openDriveDownload}
          />
          <SettingCard
            title="Share Download Link"
            description="Share the download link with others"
            onPress={shareDriveDownload}
          />
        </View>
      </CollapsibleSection>

      {/* About App Section */}
      <CollapsibleSection title="About App">
        <View style={styles.sectionContent}>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>Kharcha</Text>
            <Text style={styles.appVersion}>Version 2.0.0</Text>
            <Text style={styles.infoDescription}>
              A comprehensive, professional expense and income tracker designed to help you take complete control of your finances. Track every transaction, set savings goals and expense limits, monitor your progress, and achieve financial freedom - all in one beautiful, intuitive app.
            </Text>
            <View style={styles.highlightBox}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.accent.primary} />
              <Text style={styles.highlightText}>
                100% offline - All your data stays on your device. No cloud, no login, completely private and secure.
              </Text>
            </View>
          </View>
        </View>
      </CollapsibleSection>

      {/* Features Section */}
      <CollapsibleSection title="Features">
        <View style={styles.sectionContent}>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Track expenses and income with detailed notes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Real-time UPI and Cash balance tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>View daily, weekly, monthly, quarterly, and yearly summaries</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Beautiful charts and visualizations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Comprehensive Goals & Progress tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Daily, Weekly, Monthly, Yearly, and Custom savings goals</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Daily, Weekly, Monthly, Yearly, and Custom expense limits</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Achievement system with 9+ unlockable achievements</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Daily streak tracking to build consistent habits</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Motivational messages and progress celebrations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Personalized profile with name, bio, and future goals</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Dedicated Goals screen with visual progress tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Export data to Excel (.csv) and JSON formats</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Date range filtering and custom period views</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Modern, professional UI with dark theme</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>100% offline - No internet required, no ads, no tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Fast and simple data entry with floating action button</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Payment method tracking (UPI/Bank and Cash)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.featureText}>Balance adjustments for transfers and corrections</Text>
            </View>
          </View>
        </View>
      </CollapsibleSection>

      {/* User Guide Section */}
      <CollapsibleSection title="User Guide" defaultExpanded={false}>
        <View style={styles.sectionContent}>
          <SettingCard
            title="📖 Complete User Guide"
            description="Step-by-step guide with all features explained in detail"
            onPress={() => setShowUserGuide(true)}
          />
        </View>
      </CollapsibleSection>

      {/* How to Use Section */}
      <CollapsibleSection title="How to Use" defaultExpanded={false}>
        <View style={styles.sectionContent}>
          <View style={styles.instructionItem}>
            <Ionicons name="add-circle" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Tap the pink + button (center of bottom bar) to add expense or income entries
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="settings" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Set your savings goals and expense limits in Settings → Savings Goals / Expense Limits
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="flag" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Visit the Goals tab to track your progress and see achievements
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="home" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              View daily summary, balances, and quick progress on the Home screen
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="stats-chart" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Check Summary tab for detailed reports, charts, and period analysis
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="person" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Personalize your experience in Profile tab with name, bio, and goals
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="download" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Export your data as Excel (.csv) or JSON file for backup
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="flame" size={20} color={Colors.accent.primary} />
            <Text style={styles.instructionText}>
              Maintain daily streaks by adding entries regularly to unlock achievements
            </Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* Developer Contact Section */}
      <CollapsibleSection title="Developer">
        <View style={styles.sectionContent}>
          <View style={styles.developerCard}>
            <Text style={styles.developerName}>Gaurav Sharma</Text>
            <Text style={styles.madeByText}>Made in India</Text>
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Need a similar app or custom solution?</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => {
                  Alert.alert(
                    'Contact Developer',
                    'WhatsApp/Call: +91 6397520221\n\nWant to create a similar app or have a custom idea? Feel free to reach out!',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
              <Text style={styles.contactNote}>
                Custom mobile apps, web applications, and digital solutions tailored to your business needs.
              </Text>
            </View>
          </View>
        </View>
      </CollapsibleSection>

      {/* Footer */}
      <AppFooter />

      {exporting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>Exporting data...</Text>
          </View>
        </View>
      )}

      {/* Entries Report Modal */}
      <EntriesReportModal
        visible={showEntriesModal}
        entries={entries}
        onClose={() => setShowEntriesModal(false)}
        title="All Entries Report"
      />

      {/* Goals Setting Modal */}
      <Modal
        visible={showGoalsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {goalType === 'daily' ? 'Daily' : goalType === 'weekly' ? 'Weekly' : goalType === 'monthly' ? 'Monthly' : goalType === 'yearly' ? 'Yearly' : 'Custom'} {goalCategory === 'savings' ? 'Savings Goal' : 'Expense Limit'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowGoalsModal(false);
                  setGoalInput('');
                  setCustomGoalNameInput('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {goalCategory === 'savings' 
                ? `Set your ${goalType === 'daily' ? 'daily' : goalType === 'weekly' ? 'weekly' : goalType === 'monthly' ? 'monthly' : goalType === 'yearly' ? 'yearly' : 'custom'} savings target. Track your progress and stay motivated!`
                : `Set your ${goalType === 'daily' ? 'daily' : goalType === 'weekly' ? 'weekly' : goalType === 'monthly' ? 'monthly' : goalType === 'yearly' ? 'yearly' : 'custom'} expense limit. Stay within budget and save more!`
              }
            </Text>

            {goalType === 'custom' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Goal name (e.g., Vacation Fund)"
                  placeholderTextColor={Colors.text.tertiary}
                  value={customGoalNameInput}
                  onChangeText={setCustomGoalNameInput}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter goal amount"
                placeholderTextColor={Colors.text.tertiary}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowGoalsModal(false);
                  setGoalInput('');
                  setCustomGoalNameInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={async () => {
                  const amount = parseFloat(goalInput);
                  if (isNaN(amount) || amount < 0) {
                    Alert.alert('Invalid Input', 'Please enter a valid amount');
                    return;
                  }

                  try {
                    const updatedGoals = { ...goals };
                    const goalKey = goalCategory === 'savings' 
                      ? (goalType === 'daily' ? 'dailySavingsGoal' : 
                         goalType === 'weekly' ? 'weeklySavingsGoal' :
                         goalType === 'monthly' ? 'monthlySavingsGoal' :
                         goalType === 'yearly' ? 'yearlySavingsGoal' :
                         'customSavingsGoal')
                      : (goalType === 'daily' ? 'dailyExpenseGoal' :
                         goalType === 'weekly' ? 'weeklyExpenseGoal' :
                         goalType === 'monthly' ? 'monthlyExpenseGoal' :
                         goalType === 'yearly' ? 'yearlyExpenseGoal' :
                         'customExpenseGoal');
                    
                    updatedGoals[goalKey] = amount;
                    
                    if (goalType === 'custom') {
                      if (goalCategory === 'savings') {
                        updatedGoals.customSavingsGoalName = customGoalNameInput.trim() || 'Custom Savings Goal';
                      } else {
                        updatedGoals.customExpenseGoalName = customGoalNameInput.trim() || 'Custom Expense Limit';
                      }
                    }
                    
                    // Reset completion status if goal is being changed (only for savings goals)
                    if (goalCategory === 'savings') {
                      if (goalType === 'monthly' && updatedGoals.monthlySavingsGoal !== goals.monthlySavingsGoal) {
                        await resetGoalCompletion('monthly');
                      } else if (goalType === 'yearly' && updatedGoals.yearlySavingsGoal !== goals.yearlySavingsGoal) {
                        await resetGoalCompletion('yearly');
                      } else if (goalType === 'custom' && updatedGoals.customSavingsGoal !== goals.customSavingsGoal) {
                        await resetGoalCompletion('custom');
                      }
                    }
                    
                    await saveGoals(updatedGoals);
                    setGoals(updatedGoals);
                    Alert.alert('Success', `${goalCategory === 'savings' ? 'Goal' : 'Limit'} saved successfully!`);
                    setShowGoalsModal(false);
                    setGoalInput('');
                    setCustomGoalNameInput('');
                  } catch (error) {
                    Alert.alert('Error', `Failed to save ${goalCategory === 'savings' ? 'goal' : 'limit'}. Please try again.`);
                    console.error(error);
                  }
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cash Withdrawal Modal */}
      <CashWithdrawalModal
        visible={cashWithdrawalModalVisible}
        onClose={closeCashWithdrawalModal}
        onSave={async () => {
          closeCashWithdrawalModal();
          await loadData();
        }}
      />

      {/* Cash Deposit Modal */}
      <CashDepositModal
        visible={cashDepositModalVisible}
        onClose={closeCashDepositModal}
        onSave={async () => {
          closeCashDepositModal();
          await loadData();
        }}
      />

      {/* Import Modal */}
      <ImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Backup Settings Modal */}
      <BackupSettingsModal
        visible={showBackupSettingsModal}
        onClose={() => setShowBackupSettingsModal(false)}
      />

      {/* Export Filter Modal */}
      <ExportFilterModal
        visible={showExportFilterModal}
        onClose={() => setShowExportFilterModal(false)}
        onExport={handleExport}
        entries={entries}
        format={exportFormat}
      />

      {/* User Guide Screen */}
      <UserGuideScreen
        visible={showUserGuide}
        onClose={() => setShowUserGuide(false)}
      />

      {/* Balance Setting Modal */}
      <Modal
        visible={showBalanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {balanceType === 'bank' ? 'Bank / UPI' : 'Cash'} Balance
              </Text>
              <TouchableOpacity 
                onPress={() => setShowBalanceModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter your current {balanceType === 'bank' ? 'bank/UPI' : 'cash'} balance. This will be used as the starting point for tracking.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter balance amount"
                placeholderTextColor={Colors.text.tertiary}
                value={balanceInput}
                onChangeText={setBalanceInput}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowBalanceModal(false);
                  setBalanceInput('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveBalance}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.background.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  collapsibleSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  collapsibleContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionContent: {
    paddingTop: 8,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  settingCardDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  infoCard: {
    backgroundColor: Colors.background.primary,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  balanceDisplayRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  balanceDisplayCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
  },
  balanceDisplayLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceDisplayAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  balanceDisplayAmountNegative: {
    color: '#d32f2f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
    fontWeight: '600',
  },
  developerCard: {
    marginTop: 0,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  madeByText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactNote: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: Colors.background.modal,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

export default SettingsScreen;

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
import AppFooter from '../components/AppFooter';
import EntriesReportModal from '../components/EntriesReportModal';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';

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
  const [entries, setEntries] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [bankBalance, setBankBalance] = useState(null);
  const [cashBalance, setCashBalance] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceType, setBalanceType] = useState('bank'); // 'bank' or 'cash'
  const [balanceInput, setBalanceInput] = useState('');

  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    setEntryCount(allEntries.length);
    
    // Load current balances
    const bankBal = await getCurrentBankBalance();
    const cashBal = await getCurrentCashBalance();
    setBankBalance(bankBal);
    setCashBalance(cashBal);
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

  const handleExportExcel = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }

    setExporting(true);
    try {
      await exportToExcel(entries);
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }

    setExporting(true);
    try {
      await exportToJSON(entries);
      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
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
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.infoDescription}>
              A professional expense and income tracker. Track your daily expenses and income with real-time balance updates. All data is stored locally on your device - completely offline and secure.
            </Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* Features Section */}
      <CollapsibleSection title="Features">
        <View style={styles.sectionContent}>
          <View style={styles.featureList}>
            <Text style={styles.featureText}>Track expenses and income</Text>
            <Text style={styles.featureText}>View daily, weekly, monthly summaries</Text>
            <Text style={styles.featureText}>Charts and visualizations</Text>
            <Text style={styles.featureText}>Export data to Excel/JSON</Text>
            <Text style={styles.featureText}>100% offline - no internet required</Text>
            <Text style={styles.featureText}>Real-time balance tracking</Text>
            <Text style={styles.featureText}>Simple and fast data entry</Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* How to Use Section */}
      <CollapsibleSection title="How to Use">
        <View style={styles.sectionContent}>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionText}>
              Tap the + button to add a new expense or income entry
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionText}>
              Select Expense or Income, enter amount and optional note
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionText}>
              View your Today summary on the home screen
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionText}>
              Check Summary tab for reports with charts
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionText}>
              Export your data as Excel or JSON file for backup
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
    marginBottom: 12,
    paddingLeft: 0,
  },
  instructionText: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 20,
    letterSpacing: 0.1,
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
    marginTop: 0,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
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

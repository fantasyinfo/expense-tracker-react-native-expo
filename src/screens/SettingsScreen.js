import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries } from '../utils/storage';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';

const SettingsScreen = () => {
  const [entries, setEntries] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    setEntryCount(allEntries.length);
  };

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

  const SettingCard = ({ icon, title, description, onPress, disabled = false }) => (
    <TouchableOpacity
      style={[styles.settingCard, disabled && styles.settingCardDisabled]}
      onPress={onPress}
      disabled={disabled || exporting}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={24} color="#1976d2" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings" size={28} color="#1976d2" />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={24} color="#1976d2" />
          <Text style={styles.statValue}>{entryCount}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
      </View>

      {/* Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Export</Text>
        <Text style={styles.sectionDescription}>
          Export your expense data as Excel or JSON file
        </Text>

        <SettingCard
          icon="document-outline"
          title="Export to Excel"
          description="Download data as .xlsx file"
          onPress={handleExportExcel}
          disabled={entryCount === 0}
        />

        <SettingCard
          icon="code-outline"
          title="Export to JSON"
          description="Download data as .json file"
          onPress={handleExportJSON}
          disabled={entryCount === 0}
        />
      </View>

      {/* App Info & About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About App</Text>
        
        {/* App Details */}
        <View style={styles.infoCard}>
          <View style={styles.appHeader}>
            <View style={styles.appLogoContainer}>
              <Ionicons name="wallet" size={32} color="#1976d2" />
            </View>
            <View style={styles.appHeaderText}>
              <Text style={styles.infoText}>Expense Tracker</Text>
              <Text style={styles.infoVersion}>Version 1.0.0</Text>
            </View>
          </View>
          <Text style={styles.infoDescription}>
            A simple, clean expense and income tracker app. Track your daily expenses and income effortlessly. All your data is stored locally on your device - completely offline and secure.
          </Text>
        </View>

        {/* How to Use */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="book-outline" size={20} color="#1976d2" />
            <Text style={styles.subsectionTitle}>How to Use</Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Tap the <Text style={styles.boldText}>+</Text> button to add a new expense or income entry
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Select <Text style={styles.boldText}>Expense</Text> or <Text style={styles.boldText}>Income</Text>, enter amount and optional note
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              View your <Text style={styles.boldText}>Today</Text> summary on the home screen
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              Check <Text style={styles.boldText}>Summary</Text> tab for weekly, monthly, quarterly, or yearly reports with charts
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>5</Text>
            </View>
            <Text style={styles.instructionText}>
              Export your data as <Text style={styles.boldText}>Excel</Text> or <Text style={styles.boldText}>JSON</Text> file for backup
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="star-outline" size={20} color="#1976d2" />
            <Text style={styles.subsectionTitle}>Features</Text>
          </View>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>Track expenses and income</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>View daily, weekly, monthly summaries</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>Beautiful charts and visualizations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>Export data to Excel/JSON</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>100% offline - no internet required</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#388e3c" />
              <Text style={styles.featureText}>Simple and fast data entry</Text>
            </View>
          </View>
        </View>

        {/* Developer Contact */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={20} color="#1976d2" />
            <Text style={styles.subsectionTitle}>Developer</Text>
          </View>
          <View style={styles.developerCard}>
            <View style={styles.developerHeader}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.developerName}>Gaurav Sharma</Text>
            </View>
            <Text style={styles.madeByText}>Made with ❤️ for India</Text>
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Need a similar app or custom solution?</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => {
                  Alert.alert(
                    'Contact Developer',
                    'WhatsApp/Call: +91 9876543210\n\nWant to create a similar app or have a custom idea? Feel free to reach out!',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.contactButtonText}>WhatsApp/Call</Text>
              </TouchableOpacity>
              <Text style={styles.contactNote}>
                I specialize in creating custom mobile apps, web applications, and digital solutions tailored to your business needs.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {exporting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Exporting data...</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1976d2',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  settingCardDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  appHeaderText: {
    flex: 1,
  },
  infoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  infoVersion: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  developerCard: {
    marginTop: 8,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
  },
  madeByText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  contactNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default SettingsScreen;


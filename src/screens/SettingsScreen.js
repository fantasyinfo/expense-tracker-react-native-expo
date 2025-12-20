import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries } from '../utils/storage';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import { shareApp, shareViaWhatsApp, shareViaSMS, openDriveDownload, shareDriveDownload } from '../utils/shareUtils';
import AppFooter from '../components/AppFooter';
import EntriesReportModal from '../components/EntriesReportModal';

const CollapsibleSection = ({ title, icon, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.collapsibleHeaderLeft}>
          <Ionicons name={icon} size={20} color="#1976d2" />
          <Text style={styles.collapsibleTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
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

  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    setEntryCount(allEntries.length);
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
      <Ionicons name="chevron-forward" size={20} color="#888888" />
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
      <TouchableOpacity 
        style={styles.statsCard}
        onPress={() => setShowEntriesModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={24} color="#1976d2" />
          <Text style={styles.statValue}>{entryCount}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statHint}>Tap to view all entries</Text>
        </View>
      </TouchableOpacity>

      {/* Share App Section */}
      <CollapsibleSection title="Share App" icon="share-social-outline" defaultExpanded={true}>
        <View style={styles.sectionContent}>
          <SettingCard
            icon="logo-whatsapp"
            title="Share via WhatsApp"
            description="Share Kharcha with friends and family"
            onPress={shareViaWhatsApp}
          />
          <SettingCard
            icon="chatbubble-outline"
            title="Share via SMS"
            description="Send app details via text message"
            onPress={shareViaSMS}
          />
          <SettingCard
            icon="share-outline"
            title="Share via Other"
            description="Share using any available app"
            onPress={shareApp}
          />
        </View>
      </CollapsibleSection>

      {/* Download APK Section */}
      <CollapsibleSection title="Download APK" icon="cloud-download-outline" defaultExpanded={true}>
        <View style={styles.sectionContent}>
          <Text style={styles.sectionDescription}>
            Download the latest version of Kharcha app from Google Drive
          </Text>
          <SettingCard
            icon="download-outline"
            title="Download APK"
            description="Open Google Drive to download the app"
            onPress={openDriveDownload}
          />
          <SettingCard
            icon="share-social-outline"
            title="Share Download Link"
            description="Share the download link with others"
            onPress={shareDriveDownload}
          />
        </View>
      </CollapsibleSection>

      {/* Export Section */}
      <CollapsibleSection title="Data Export" icon="download-outline">
        <View style={styles.sectionContent}>
          <Text style={styles.sectionDescription}>
            Export your expense data as Excel or JSON file
          </Text>
          <SettingCard
            icon="document-outline"
            title="Export to Excel"
            description="Download data as .csv file"
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
      </CollapsibleSection>

      {/* App Info Section */}
      <CollapsibleSection title="About App" icon="information-circle-outline">
        <View style={styles.sectionContent}>
          <View style={styles.infoCard}>
            <View style={styles.appHeader}>
              <View style={styles.appLogoContainer}>
                <Ionicons name="wallet" size={32} color="#1976d2" />
              </View>
              <View style={styles.appHeaderText}>
                <Text style={styles.infoText}>Kharcha</Text>
                <Text style={styles.infoVersion}>Version 1.0.0</Text>
              </View>
            </View>
            <Text style={styles.infoDescription}>
              A simple, clean expense and income tracker app. Track your daily expenses and income effortlessly. All your data is stored locally on your device - completely offline and secure.
            </Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* How to Use Section */}
      <CollapsibleSection title="How to Use" icon="book-outline">
        <View style={styles.sectionContent}>
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
              Check <Text style={styles.boldText}>Summary</Text> tab for reports with charts
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
      </CollapsibleSection>

      {/* Features Section */}
      <CollapsibleSection title="Features" icon="star-outline">
        <View style={styles.sectionContent}>
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
      </CollapsibleSection>

      {/* Developer Contact Section */}
      <CollapsibleSection title="Developer" icon="person-outline">
        <View style={styles.sectionContent}>
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
                    'WhatsApp/Call: +91 6397520221\n\nWant to create a similar app or have a custom idea? Feel free to reach out!',
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
      </CollapsibleSection>

      {/* Footer */}
      <AppFooter />

      {exporting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
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
    color: '#b0b0b0',
    marginTop: 4,
  },
  statHint: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  collapsibleSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionContent: {
    paddingTop: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingCardDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2332',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2a3441',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a2332',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#2a3441',
  },
  appHeaderText: {
    flex: 1,
  },
  infoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoVersion: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    lineHeight: 22,
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
    color: '#b0b0b0',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#ffffff',
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
    color: '#b0b0b0',
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
    color: '#b0b0b0',
    marginBottom: 16,
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
    color: '#b0b0b0',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#b0b0b0',
  },
});

export default SettingsScreen;

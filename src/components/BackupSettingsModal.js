import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBackupPreferences, saveBackupPreferences } from '../utils/backupUtils';
import Colors from '../constants/colors';

const BackupSettingsModal = ({ visible, onClose }) => {
  const [preferences, setPreferences] = useState({
    method: 'manual',
    autoBackup: false,
    backupFrequency: 'weekly',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await getBackupPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading backup preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveBackupPreferences(preferences);
      Alert.alert('Success', 'Backup settings saved successfully!', [{ text: 'OK', onPress: onClose }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save backup settings. Please try again.');
      console.error(error);
    }
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
              <Text style={styles.modalTitle}>Backup Settings</Text>
              <Text style={styles.modalSubtitle}>Configure your backup preferences</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Backup Method Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Backup Method</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    preferences.method === 'manual' && styles.methodButtonActive,
                  ]}
                  onPress={() => setPreferences({ ...preferences, method: 'manual' })}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="cloud-upload-outline" 
                    size={20} 
                    color={preferences.method === 'manual' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <View style={styles.methodContent}>
                    <Text
                      style={[
                        styles.methodButtonText,
                        preferences.method === 'manual' && styles.methodButtonTextActive,
                      ]}
                    >
                      Manual Backup
                    </Text>
                    <Text style={styles.methodDescription}>
                      Create backups manually and save to your device or cloud
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    preferences.method === 'google_drive' && styles.methodButtonActive,
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Google Drive Backup',
                      'Google Drive automatic backup will be available soon. For now, you can use manual backup and save to Google Drive manually.',
                      [{ text: 'OK' }]
                    );
                    // Uncomment when Google Drive is implemented
                    // setPreferences({ ...preferences, method: 'google_drive' });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="logo-google" 
                    size={20} 
                    color={preferences.method === 'google_drive' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <View style={styles.methodContent}>
                    <Text
                      style={[
                        styles.methodButtonText,
                        preferences.method === 'google_drive' && styles.methodButtonTextActive,
                      ]}
                    >
                      Google Drive (Coming Soon)
                    </Text>
                    <Text style={styles.methodDescription}>
                      Automatic backups to your Google Drive
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto Backup Toggle (only for Google Drive) */}
            {preferences.method === 'google_drive' && (
              <View style={styles.section}>
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleContent}>
                    <Text style={styles.toggleLabel}>Automatic Backup</Text>
                    <Text style={styles.toggleDescription}>
                      Automatically backup your data at scheduled intervals
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      preferences.autoBackup && styles.toggleActive,
                    ]}
                    onPress={() => setPreferences({ ...preferences, autoBackup: !preferences.autoBackup })}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.toggleThumb,
                      preferences.autoBackup && styles.toggleThumbActive,
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Backup Frequency (only if auto backup is enabled) */}
            {preferences.method === 'google_drive' && preferences.autoBackup && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Backup Frequency</Text>
                <View style={styles.frequencyContainer}>
                  {['daily', 'weekly', 'monthly'].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        preferences.backupFrequency === freq && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setPreferences({ ...preferences, backupFrequency: freq })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          preferences.backupFrequency === freq && styles.frequencyButtonTextActive,
                        ]}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color={Colors.status.info} />
                <Text style={styles.infoText}>
                  Manual backup: Create backups on demand and save to any location (Google Drive, Dropbox, etc.)
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.status.income} />
                <Text style={styles.infoText}>
                  All backups are encrypted and stored securely. Your data remains private.
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
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.accent.gradient.positive}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
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
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodContainer: {
    gap: 12,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    gap: 12,
  },
  methodButtonActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  methodContent: {
    flex: 1,
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  methodButtonTextActive: {
    color: Colors.accent.primary,
  },
  methodDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.text.secondary,
  },
  toggleThumbActive: {
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 20 }],
  },
  frequencyContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  infoSection: {
    gap: 12,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BackupSettingsModal;


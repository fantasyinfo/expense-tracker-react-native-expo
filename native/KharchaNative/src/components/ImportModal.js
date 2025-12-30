import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'react-native-linear-gradient';
import { pickAndReadFile, importEntries } from '../utils/importUtils';
import Colors from '../constants/colors';

const ImportModal = ({ visible, onClose, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState('replace'); // 'replace' or 'merge'

  const handleImport = async () => {
    try {
      setImporting(true);
      
      // Pick file
      const fileResult = await pickAndReadFile();
      
      if (fileResult.canceled) {
        setImporting(false);
        return;
      }
      
      // Import entries
      const result = await importEntries(
        fileResult.content,
        fileResult.fileName,
        fileResult.mimeType,
        importMode === 'merge'
      );
      
      setImporting(false);
      
      // Show success message
      Alert.alert(
        'Import Successful',
        `Imported ${result.imported} entries.\n` +
        (importMode === 'merge' 
          ? `Added ${result.added} new entries.\nSkipped ${result.skipped} duplicates.\nTotal entries: ${result.total}`
          : `Replaced all entries with ${result.total} entries.`),
        [
          {
            text: 'OK',
            onPress: () => {
              onImportComplete();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      setImporting(false);
      Alert.alert(
        'Import Failed',
        error.message || 'Failed to import entries. Please check the file format and try again.',
        [{ text: 'OK' }]
      );
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
              <Text style={styles.modalTitle}>Import Data</Text>
              <Text style={styles.modalSubtitle}>Import entries from CSV or JSON file</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={importing}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Import Mode Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Import Mode</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    importMode === 'replace' && styles.modeButtonActive,
                  ]}
                  onPress={() => setImportMode('replace')}
                  disabled={importing}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="refresh" 
                    size={18} 
                    color={importMode === 'replace' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      importMode === 'replace' && styles.modeButtonTextActive,
                    ]}
                  >
                    Replace All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    importMode === 'merge' && styles.modeButtonActive,
                  ]}
                  onPress={() => setImportMode('merge')}
                  disabled={importing}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="add-circle" 
                    size={18} 
                    color={importMode === 'merge' ? '#FFFFFF' : Colors.text.secondary} 
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      importMode === 'merge' && styles.modeButtonTextActive,
                    ]}
                  >
                    Merge
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modeDescription}>
                {importMode === 'replace' 
                  ? 'Replace all existing entries with imported data'
                  : 'Add imported entries to existing data (duplicates will be skipped)'}
              </Text>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color={Colors.status.info} />
                <Text style={styles.infoText}>
                  Supported formats: CSV and JSON files exported from this app
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="warning" size={20} color={Colors.status.warning} />
                <Text style={styles.warningText}>
                  {importMode === 'replace' 
                    ? 'Warning: This will replace all your current entries!'
                    : 'Duplicate entries (same ID) will be skipped during merge.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={importing}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importButton, importing && styles.importButtonDisabled]}
              onPress={handleImport}
              disabled={importing}
              activeOpacity={0.8}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <LinearGradient
                  colors={Colors.accent.gradient.positive}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.importButtonGradient}
                >
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                  <Text style={styles.importButtonText}>Import File</Text>
                </LinearGradient>
              )}
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
    maxHeight: 300,
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
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  modeDescription: {
    fontSize: 12,
    color: Colors.text.tertiary,
    lineHeight: 16,
    marginTop: 4,
  },
  infoSection: {
    gap: 12,
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
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.status.warning,
    lineHeight: 18,
    fontWeight: '500',
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
  importButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ImportModal;


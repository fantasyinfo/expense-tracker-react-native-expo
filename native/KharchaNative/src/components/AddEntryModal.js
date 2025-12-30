import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDate, formatDateDisplay, parseDate } from '../utils/dateUtils';
import { addEntry, updateEntry } from '../utils/storage';
import { updateStreak, checkAchievements } from '../utils/engagementUtils';
import { loadTemplates, addTemplate, deleteTemplate } from '../utils/templateStorage';
import { loadCategories, getCategoriesByType } from '../utils/categoryStorage';
import Colors from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddEntryModal = ({ visible, onClose, onSave, editEntry = null }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [mode, setMode] = useState('upi');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const prevEditEntryRef = useRef(null);

  // Load templates and categories when modal opens
  useEffect(() => {
    if (visible) {
      loadTemplatesData();
      loadCategoriesData();
    }
  }, [visible]);

  const loadTemplatesData = async () => {
    const loadedTemplates = await loadTemplates();
    setTemplates(loadedTemplates);
  };

  const loadCategoriesData = async () => {
    const loadedCategories = await getCategoriesByType(type);
    setCategories(loadedCategories);
  };

  // Reload categories when type changes
  useEffect(() => {
    if (visible) {
      loadCategoriesData();
      // Reset category when type changes
      setSelectedCategory(null);
    }
  }, [type, visible]);

  // Load edit entry data when editEntry changes
  useEffect(() => {
    if (editEntry) {
      // Pre-fill form with edit entry data whenever editEntry is available
      setAmount(editEntry.amount?.toString() || '');
      setNote(editEntry.note || '');
      setType(editEntry.type || 'expense');
      setMode(editEntry.mode || 'upi');
      setDate(parseDate(editEntry.date || formatDate(new Date())));
      setAdjustmentType(editEntry.adjustment_type || 'add');
      setSelectedCategory(editEntry.category_id || null);
      prevEditEntryRef.current = editEntry;
      // Load categories for the entry type
      getCategoriesByType(editEntry.type || 'expense').then(cats => {
        setCategories(cats);
      });
    }
  }, [editEntry]);

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      // Wait a bit to see if editEntry gets set (for cases where it's set after modal opens)
      const timeoutId = setTimeout(() => {
        // If editEntry is available, populate the form
        if (editEntry) {
          setAmount(editEntry.amount?.toString() || '');
          setNote(editEntry.note || '');
          setType(editEntry.type || 'expense');
          setMode(editEntry.mode || 'upi');
          setDate(parseDate(editEntry.date || formatDate(new Date())));
          setAdjustmentType(editEntry.adjustment_type || 'add');
          setSelectedCategory(editEntry.category_id || null);
          prevEditEntryRef.current = editEntry;
          // Load categories for the entry type
          getCategoriesByType(editEntry.type || 'expense').then(cats => {
            setCategories(cats);
          });
        } else if (prevEditEntryRef.current === null) {
          // If modal opens without editEntry and we weren't previously editing, reset form
          setAmount('');
          setNote('');
          setType('expense');
          setMode('upi');
          setDate(new Date());
          setAdjustmentType('add');
          setSelectedCategory(null);
        }
      }, 200); // Increased delay to allow editEntry to be set

      return () => clearTimeout(timeoutId);
    } else {
      // Don't reset ref when modal closes - keep it so we know if we were editing
      // Only reset if editEntry is explicitly cleared (becomes null)
      if (!editEntry) {
        prevEditEntryRef.current = null;
      }
    }
  }, [visible, editEntry]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const entryData = {
      amount: parsedAmount,
      note: note.trim(),
      type,
      mode,
      date: formatDate(date),
      category_id: selectedCategory || null,
    };

    if (type === 'balance_adjustment') {
      if (!adjustmentType || (adjustmentType !== 'add' && adjustmentType !== 'subtract')) {
        return;
      }
      entryData.adjustment_type = adjustmentType;
    }

    if (editEntry && editEntry.id) {
      // Update existing entry
      await updateEntry(editEntry.id, entryData);
    } else {
      // Add new entry
      await addEntry(entryData);

      // Update streak (only for non-balance-adjustment entries)
      // Note: Achievement checking will be handled in HomeScreen.handleEntryAdded
      // to properly show the notification modal
      if (type !== 'balance_adjustment') {
        await updateStreak();
      }
    }

    // Reset form
    setAmount('');
    setNote('');
    setType('expense');
    setMode('upi');
    setDate(new Date());
    setAdjustmentType('add');
    onSave();
  };

  const handleSaveAsTemplate = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0 || !note.trim()) {
      Alert.alert('Invalid Template', 'Please enter both amount and note to save as template');
      return;
    }

    const templateData = {
      amount: parsedAmount,
      note: note.trim(),
      type,
      mode,
    };

    if (type === 'balance_adjustment') {
      templateData.adjustment_type = adjustmentType;
    }

    await addTemplate(templateData);
    await loadTemplatesData();
    Alert.alert('Success', 'Template saved successfully!');
  };

  const handleUseTemplate = (template) => {
    setAmount(template.amount?.toString() || '');
    setNote(template.note || '');
    setType(template.type || 'expense');
    setMode(template.mode || 'upi');
    setDate(new Date()); // Always use today's date for templates
    if (template.type === 'balance_adjustment') {
      setAdjustmentType(template.adjustment_type || 'add');
    }
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    await deleteTemplate(templateId);
    await loadTemplatesData();
  };

  const handleClose = () => {
    // Reset form when closing
    setAmount('');
    setNote('');
    setType('expense');
    setMode('upi');
    setDate(new Date());
    setAdjustmentType('add');
    setSelectedCategory(null);
    setShowDatePicker(false);
    prevEditEntryRef.current = null;
    onClose();
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editEntry ? 'Edit Entry' : 'Add Entry'}</Text>
              <Text style={styles.modalSubtitle}>{editEntry ? 'Update transaction details' : 'Record a new transaction'}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.scrollViewContainer}>
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled={true}
            >
            {/* Quick Templates Section */}
            {!editEntry && templates.length > 0 && (
              <View style={styles.section}>
                <View style={styles.templateHeader}>
                  <Text style={styles.sectionLabel}>Quick Templates</Text>
                  <TouchableOpacity
                    onPress={() => setShowTemplates(!showTemplates)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showTemplates ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={Colors.text.secondary} 
                    />
                  </TouchableOpacity>
                </View>
                {showTemplates && (
                  <View style={styles.templatesContainer}>
                    {templates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        style={styles.templateButton}
                        onPress={() => handleUseTemplate(template)}
                        onLongPress={() => {
                          Alert.alert(
                            'Delete Template',
                            `Delete "${template.note}" template?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => handleDeleteTemplate(template.id),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.templateButtonContent}>
                          <View style={styles.templateButtonLeft}>
                            <Text style={styles.templateNote} numberOfLines={1}>
                              {template.note}
                            </Text>
                            <View style={styles.templateMeta}>
                              <Ionicons
                                name={template.type === 'expense' ? 'arrow-down' : 'arrow-up'}
                                size={12}
                                color={template.type === 'expense' ? Colors.status.expense : Colors.status.income}
                              />
                              <Text style={styles.templateAmount}>
                                ₹{template.amount}
                              </Text>
                              <Ionicons
                                name={template.mode === 'upi' ? 'phone-portrait' : 'cash'}
                                size={12}
                                color={template.mode === 'upi' ? Colors.payment.upi : Colors.payment.cash}
                              />
                            </View>
                          </View>
                          <Ionicons name="add-circle" size={20} color={Colors.accent.primary} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Type Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Transaction Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'expense' && styles.typeButtonActiveExpense,
                  ]}
                  onPress={() => setType('expense')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={18} 
                    color={type === 'expense' ? '#FFFFFF' : Colors.status.expense} 
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'expense' && styles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'income' && styles.typeButtonActiveIncome,
                  ]}
                  onPress={() => setType('income')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={18} 
                    color={type === 'income' ? '#FFFFFF' : Colors.status.income} 
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'income' && styles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'balance_adjustment' && styles.typeButtonActiveAdjustment,
                  ]}
                  onPress={() => setType('balance_adjustment')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="swap-vertical" 
                    size={18} 
                    color={type === 'balance_adjustment' ? '#FFFFFF' : Colors.status.adjustment} 
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'balance_adjustment' && styles.typeButtonTextActive,
                    ]}
                  >
                    Adjust
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Adjustment Type Toggle */}
            {type === 'balance_adjustment' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Adjustment Type</Text>
                <View style={styles.adjustmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentButton,
                      adjustmentType === 'add' && styles.adjustmentButtonActive,
                    ]}
                    onPress={() => setAdjustmentType('add')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="add-circle" 
                      size={18} 
                      color={adjustmentType === 'add' ? '#FFFFFF' : Colors.status.income} 
                    />
                    <Text
                      style={[
                        styles.adjustmentButtonText,
                        adjustmentType === 'add' && styles.adjustmentButtonTextActive,
                      ]}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentButton,
                      adjustmentType === 'subtract' && styles.adjustmentButtonActive,
                    ]}
                    onPress={() => setAdjustmentType('subtract')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="remove-circle" 
                      size={18} 
                      color={adjustmentType === 'subtract' ? '#FFFFFF' : Colors.status.expense} 
                    />
                    <Text
                      style={[
                        styles.adjustmentButtonText,
                        adjustmentType === 'subtract' && styles.adjustmentButtonTextActive,
                      ]}
                    >
                      Subtract
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Amount *</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="cash-outline" size={20} color={Colors.text.secondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  autoFocus={true}
                />
              </View>
            </View>

            {/* Note Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Note (Optional)</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Add a note..."
                  placeholderTextColor={Colors.text.tertiary}
                  value={note}
                  onChangeText={setNote}
                  multiline={false}
                />
              </View>
            </View>

            {/* Category Selection */}
            {type !== 'balance_adjustment' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Category (Optional)</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.categoryButtonActive,
                        { borderColor: category.color }
                      ]}
                      onPress={() => setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryIconContainer,
                        { backgroundColor: selectedCategory === category.id ? category.color : `${category.color}20` }
                      ]}>
                        <Ionicons 
                          name={category.icon} 
                          size={18} 
                          color={selectedCategory === category.id ? '#FFFFFF' : category.color} 
                        />
                      </View>
                      <Text style={[
                        styles.categoryButtonText,
                        selectedCategory === category.id && styles.categoryButtonTextActive,
                        { color: selectedCategory === category.id ? category.color : Colors.text.secondary }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Payment Method Toggle */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === 'upi' && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode('upi')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={18} 
                    color={mode === 'upi' ? '#FFFFFF' : Colors.payment.upi} 
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'upi' && styles.modeButtonTextActive,
                    ]}
                  >
                    UPI
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === 'cash' && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode('cash')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="cash" 
                    size={18} 
                    color={mode === 'cash' ? '#FFFFFF' : Colors.payment.cash} 
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === 'cash' && styles.modeButtonTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.inputIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.text.secondary} />
                </View>
                <Text style={styles.dateText}>{formatDateDisplay(formatDate(date))}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
                textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            )}
            </ScrollView>
          </View>

          {/* Save as Template Button (only when not editing) */}
          {!editEntry && amount && parseFloat(amount) > 0 && note.trim() && (
            <TouchableOpacity
              style={styles.saveTemplateButton}
              onPress={handleSaveAsTemplate}
              activeOpacity={0.8}
            >
              <Ionicons name="bookmark-outline" size={18} color={Colors.accent.primary} />
              <Text style={styles.saveTemplateButtonText}>Save as Template</Text>
            </TouchableOpacity>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButtonContainer}
            onPress={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
            activeOpacity={0.8}
          >
            {(!amount || parseFloat(amount) <= 0) ? (
              <View style={[styles.saveButton, styles.saveButtonDisabled]}>
                <Text style={styles.saveButtonTextDisabled}>{editEntry ? 'Update Entry' : 'Save Entry'}</Text>
              </View>
            ) : (
              <LinearGradient
                colors={Colors.accent.gradient.positive}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{editEntry ? 'Update Entry' : 'Save Entry'}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderBottomWidth: 0,
    flexDirection: 'column',
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
  scrollViewContainer: {
    height: SCREEN_HEIGHT * 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActiveExpense: {
    backgroundColor: Colors.status.expense,
  },
  typeButtonActiveIncome: {
    backgroundColor: Colors.status.income,
  },
  typeButtonActiveAdjustment: {
    backgroundColor: Colors.status.adjustment,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  adjustmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  adjustmentButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  adjustmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  adjustmentButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    gap: 4,
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
  saveButtonContainer: {
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: Colors.text.tertiary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginBottom: 8,
    gap: 8,
  },
  saveTemplateButtonText: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templatesContainer: {
    gap: 8,
  },
  templateButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  templateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateButtonLeft: {
    flex: 1,
  },
  templateNote: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  templateAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  categoryScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: Colors.background.secondary,
    marginRight: 8,
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    fontWeight: '700',
  },
});

export default AddEntryModal;

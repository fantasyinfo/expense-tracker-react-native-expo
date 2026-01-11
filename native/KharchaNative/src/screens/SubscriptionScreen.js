import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSubscriptions } from '../context/SubscriptionContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { usePreferences } from '../context/PreferencesContext';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';

const DRAWER_WIDTH = 300;

const SubscriptionScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { paymentLabels } = usePreferences();
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription,
    runRecurringProcessor 
  } = useSubscriptions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [mode, setMode] = useState('upi');
  const [startDate, setStartDate] = useState(new Date().toISOString());

  useEffect(() => {
    runRecurringProcessor();
  }, []);

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('monthly');
    setMode('upi');
    setStartDate(new Date().toISOString());
    setEditingSub(null);
  };

  const handleAddPress = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditPress = (sub) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setFrequency(sub.frequency);
    setMode(sub.mode || 'upi');
    setStartDate(sub.next_billing_date);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const subData = {
      name,
      amount: parseFloat(amount),
      frequency,
      mode,
      next_billing_date: startDate,
    };

    if (editingSub) {
      await updateSubscription(editingSub.id, subData);
    } else {
      await addSubscription(subData);
    }

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to delete this recurring expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteSubscription(id) 
        }
      ]
    );
  };

  const renderSubscriptionItem = ({ item }) => (
    <View style={styles.subCard}>
      <View style={styles.subInfo}>
        <View style={styles.subHeader}>
          <Text style={styles.subName}>{item.name}</Text>
          <Text style={styles.subAmount}>{currency.symbol}{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.subDetails}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.frequency.toUpperCase()}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Colors.background.tertiary }]}>
            <Text style={styles.tagText}>{item.mode === 'upi' ? paymentLabels.upi : 'Cash'}</Text>
          </View>
          <Text style={styles.nextDate}>
            Next: {new Date(item.next_billing_date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.subActions}>
        <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Ionicons name="trash" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
          <Ionicons name="add" size={28} color={Colors.accent.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscriptionItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No recurring expenses yet</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddPress}>
              <Text style={styles.emptyAddButtonText}>Add your first subscription</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingSub ? 'Edit' : 'Add'} Subscription</Text>
            
            <ScrollView>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Netflix, Rent, Gym, etc."
                placeholderTextColor={Colors.text.tertiary}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.pickerItem, frequency === f && styles.pickerItemActive]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={[styles.pickerText, frequency === f && styles.pickerTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.pickerItem, mode === 'upi' && styles.pickerItemActive]}
                  onPress={() => setMode('upi')}
                >
                  <Text style={[styles.pickerText, mode === 'upi' && styles.pickerTextActive]}>
                    {paymentLabels.upi}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerItem, mode === 'cash' && styles.pickerItemActive]}
                  onPress={() => setMode('cash')}
                >
                  <Text style={[styles.pickerText, mode === 'cash' && styles.pickerTextActive]}>
                    Cash
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  subCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  subInfo: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.status.expense,
  },
  subDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.accent.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent.primary,
  },
  nextDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 'auto',
  },
  subActions: {
    flexDirection: 'row',
    marginLeft: 15,
    gap: 10,
  },
  actionButton: {
    padding: 8,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 20,
    marginBottom: 30,
  },
  emptyAddButton: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
  },
  emptyAddButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 15,
    padding: 15,
    color: Colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  pickerItem: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  pickerItemActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  pickerText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  pickerTextActive: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  cancelButton: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    padding: 18,
    borderRadius: 15,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default SubscriptionScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, filterEntriesByPeriod, calculateTotals, formatDateDisplay } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import AddEntryModal from '../components/AddEntryModal';

const HomeScreen = () => {
  const [entries, setEntries] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = formatDate(new Date());

  // Load entries and filter for today
  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    
    // Filter entries for today
    const filtered = filterEntriesByPeriod(allEntries, 'today');
    setTodayEntries(filtered);
    
    // Calculate today's totals
    const todayTotals = calculateTotals(filtered);
    setTotals(todayTotals);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEntryAdded = () => {
    loadData();
    setModalVisible(false);
  };

  const handleDelete = async (id) => {
    await deleteEntry(id);
    loadData();
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryItem}>
      <View style={[
        styles.entryIconContainer,
        item.type === 'expense' ? styles.expenseIconBg : styles.incomeIconBg
      ]}>
        <Ionicons
          name={item.type === 'expense' ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={item.type === 'expense' ? '#d32f2f' : '#388e3c'}
        />
      </View>
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryAmount,
          item.type === 'expense' ? styles.expenseAmount : styles.incomeAmount
        ]}>
          {item.type === 'expense' ? '-' : '+'}₹{parseFloat(item.amount).toFixed(2)}
        </Text>
        {item.note ? (
          <Text style={styles.entryNote}>{item.note}</Text>
        ) : (
          <Text style={styles.entryDate}>{formatDateDisplay(item.date)}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today's Summary</Text>
          <Text style={styles.headerSubtitle}>{formatDateDisplay(today)}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>

      {/* Totals Section */}
      <View style={styles.totalsContainer}>
        <View style={[styles.totalCard, styles.expenseCard]}>
          <View style={styles.totalIconContainer}>
            <Ionicons name="arrow-down-circle" size={24} color="#d32f2f" />
          </View>
          <Text style={styles.totalLabel}>Expense</Text>
          <Text style={[styles.totalAmount, styles.expenseAmount]}>
            ₹{totals.expense.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.totalCard, styles.incomeCard]}>
          <View style={styles.totalIconContainer}>
            <Ionicons name="arrow-up-circle" size={24} color="#388e3c" />
          </View>
          <Text style={styles.totalLabel}>Income</Text>
          <Text style={[styles.totalAmount, styles.incomeAmount]}>
            ₹{totals.income.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.totalCard, styles.balanceCard]}>
          <View style={styles.totalIconContainer}>
            <Ionicons
              name={totals.balance >= 0 ? 'trending-up' : 'trending-down'}
              size={24}
              color={totals.balance >= 0 ? '#388e3c' : '#d32f2f'}
            />
          </View>
          <Text style={styles.totalLabel}>Balance</Text>
          <Text
            style={[
              styles.totalAmount,
              totals.balance >= 0 ? styles.incomeAmount : styles.expenseAmount,
            ]}
          >
            ₹{totals.balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Entries List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Today's Entries</Text>
        <Text style={styles.listCount}>{todayEntries.length}</Text>
      </View>
      <FlatList
        data={todayEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No entries for today</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first entry</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleEntryAdded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  totalCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#d32f2f',
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#388e3c',
  },
  balanceCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
  },
  totalIconContainer: {
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  expenseAmount: {
    color: '#d32f2f',
  },
  incomeAmount: {
    color: '#388e3c',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  listCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  entryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  entryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconBg: {
    backgroundColor: '#ffebee',
  },
  incomeIconBg: {
    backgroundColor: '#e8f5e9',
  },
  entryContent: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryNote: {
    fontSize: 14,
    color: '#666',
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1565c0',
  },
});

export default HomeScreen;

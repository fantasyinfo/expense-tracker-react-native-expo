import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, filterEntriesByPeriod, calculateTotals, formatDateWithMonthName } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import AddEntryModal from '../components/AddEntryModal';
import AppFooter from '../components/AppFooter';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const [entries, setEntries] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const today = formatDate(new Date());

  // Load entries and filter for today
  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    
    // Filter entries for today and sort by id descending (latest first)
    const filtered = filterEntriesByPeriod(allEntries, 'today');
    const sorted = filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    setTodayEntries(sorted);
    
    // Calculate today's totals
    const todayTotals = calculateTotals(filtered);
    setTotals(todayTotals);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEntryAdded = () => {
    loadData();
    setModalVisible(false);
  };

  const handleDelete = async (id, entry) => {
    const entryType = entry.type === 'expense' ? 'Expense' : 'Income';
    const entryAmount = `₹${parseFloat(entry.amount).toFixed(2)}`;
    const entryNote = entry.note ? ` (${entry.note})` : '';

    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete this ${entryType.toLowerCase()} entry?\n\n${entryType}: ${entryAmount}${entryNote}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(id);
            loadData();
          },
        },
      ],
      { cancelable: true }
    );
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
          <Text style={styles.entryDate}>{formatDateWithMonthName(item.date)}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id, item)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  const cards = [
    {
      type: 'expense',
      label: 'Today\'s Expense',
      amount: totals.expense,
      icon: 'arrow-down-circle',
      color: '#d32f2f',
      borderColor: '#d32f2f',
    },
    {
      type: 'income',
      label: 'Today\'s Income',
      amount: totals.income,
      icon: 'arrow-up-circle',
      color: '#388e3c',
      borderColor: '#388e3c',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="calendar" size={24} color="#1976d2" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Today's Summary</Text>
            <Text style={styles.headerSubtitle}>{formatDateWithMonthName(today)}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={22} color="#1976d2" />
        </TouchableOpacity>
      </View>

      {/* Modern Scrollable Card Section */}
      <View style={styles.cardSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 32));
            setCardIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {cards.map((card, index) => (
            <View key={index} style={styles.cardWrapper}>
              <View style={[
                styles.modernCard,
                { borderBottomColor: card.borderColor }
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name={card.icon} size={32} color={card.color} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                    <Text style={[styles.cardAmount, { color: card.color }]}>
                      ₹{card.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <Ionicons name="trending-up" size={16} color={card.color} />
                  <Text style={[styles.cardFooterText, { color: card.color }]}>
                    {card.type === 'expense' ? 'Total expenses today' : 'Total income today'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Card Indicators */}
        <View style={styles.cardIndicators}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                cardIndex === index && styles.indicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Entries List */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Ionicons name="list" size={20} color="#1976d2" />
          <Text style={styles.listTitle}>Today's Entries</Text>
        </View>
        <View style={styles.listCountBadge}>
          <Text style={styles.listCount}>{todayEntries.length}</Text>
        </View>
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
        ListFooterComponent={<AppFooter />}
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  cardSection: {
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  cardWrapper: {
    width: screenWidth - 32,
    paddingHorizontal: 16,
  },
  modernCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardFooterText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  cardIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  indicatorActive: {
    backgroundColor: '#1976d2',
    width: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  listCountBadge: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
  },
  listCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
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

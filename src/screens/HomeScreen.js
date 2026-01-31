import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
  Modal,
  Alert,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, filterEntriesByPeriod, filterEntriesByDateRange, calculateTotals, formatDateWithMonthName, formatDateShort, formatCurrency, formatDateDisplay } from '../utils/dateUtils';
import { loadEntries, deleteEntry } from '../utils/storage';
import { loadCategories, getCategoryById } from '../utils/categoryStorage';
import { getCurrentBankBalance, getCurrentCashBalance } from '../utils/balanceUtils';
import { loadProfile } from '../utils/profileStorage';
import { getStreak, checkAchievements, getMotivationalMessage, calculateGoalProgress } from '../utils/engagementUtils';
import { useModal } from '../context/ModalContext';
import Colors from '../constants/colors';
import AddEntryModal from '../components/AddEntryModal';
import AppFooter from '../components/AppFooter';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = () => {
  const { 
    addEntryModalVisible, 
    openAddEntryModal, 
    closeAddEntryModal,
  } = useModal();
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [totals, setTotals] = useState({ expense: 0, income: 0, balance: 0 });
  const [bankBalance, setBankBalance] = useState(null);
  const [cashBalance, setCashBalance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [longPressMenuVisible, setLongPressMenuVisible] = useState(false);
  const [selectedEntryForMenu, setSelectedEntryForMenu] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [userName, setUserName] = useState('User');
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [dailyProgress, setDailyProgress] = useState({ progress: 0, isCompleted: false, isOverLimit: false });
  const [weeklyProgress, setWeeklyProgress] = useState({ progress: 0, isCompleted: false, isOverLimit: false });
  const [monthlyProgress, setMonthlyProgress] = useState({ progress: 0, isCompleted: false, isOverLimit: false });
  const [dailyExpenseProgress, setDailyExpenseProgress] = useState({ progress: 0, isOverLimit: false });
  const [achievements, setAchievements] = useState([]);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;

  const today = formatDate(new Date());

  // Load entries and filter
  const loadData = useCallback(async () => {
    const allEntries = await loadEntries();
    setEntries(allEntries);
    
    // Load user profile
    const profile = await loadProfile();
    setUserName(profile.name || '');
    
    // Load categories
    const loadedCategories = await loadCategories();
    setCategories(loadedCategories);
    
    // Load current balances
    const bankBal = await getCurrentBankBalance();
    const cashBal = await getCurrentCashBalance();
    setBankBalance(bankBal);
    setCashBalance(cashBal);
    
    // Filter entries based on date range or today
    let filtered;
    if (isCustomDateRange) {
      filtered = filterEntriesByDateRange(allEntries, startDate, endDate);
    } else {
      filtered = filterEntriesByPeriod(allEntries, 'today');
    }
    
    // Apply category filter if selected
    if (selectedCategoryFilter) {
      filtered = filtered.filter(entry => entry.category_id === selectedCategoryFilter);
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(entry => {
        const noteMatch = entry.note?.toLowerCase().includes(query);
        const amountMatch = entry.amount?.toString().includes(query);
        const dateMatch = formatDateWithMonthName(entry.date).toLowerCase().includes(query) ||
                         formatDateDisplay(entry.date).toLowerCase().includes(query);
        return noteMatch || amountMatch || dateMatch;
      });
    }
    
    const sorted = filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    setTodayEntries(sorted);
    
    // Calculate totals
    const periodTotals = calculateTotals(filtered);
    setTotals(periodTotals);
    
    // Load engagement data
    const streakData = await getStreak();
    setStreak(streakData);
    
    const message = await getMotivationalMessage();
    setMotivationalMessage(message);
    
    // Load goal progress
    const dailySavings = await calculateGoalProgress('daily', 'savings');
    setDailyProgress(dailySavings);
    
    const weeklySavings = await calculateGoalProgress('weekly', 'savings');
    setWeeklyProgress(weeklySavings);
    
    const monthlySavings = await calculateGoalProgress('monthly', 'savings');
    setMonthlyProgress(monthlySavings);
    
    const dailyExpense = await calculateGoalProgress('daily', 'expense');
    setDailyExpenseProgress(dailyExpense);
    
    // Load all achievements (but don't show notification on load - only on new entry)
    const achievementData = await checkAchievements();
    setAchievements(achievementData.allAchievements);
  }, [isCustomDateRange, startDate, endDate, searchQuery, selectedCategoryFilter]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      // Also reload profile to update greeting
      loadProfile().then(profile => setUserName(profile.name || ''));
    }, [loadData])
  );

  // Close local modals when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: close all local modals when screen loses focus
        setShowFilterModal(false);
        setDeleteModalVisible(false);
        setLongPressMenuVisible(false);
        setSelectedEntryForMenu(null);
      };
    }, [])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEntryAdded = async () => {
    // Close modal first
    closeAddEntryModal();
    setEntryToEdit(null); // Clear edit entry
    
    // Reload data to get updated entries
    await loadData();
    
    // Small delay to ensure data is fully updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for new achievements AFTER data is reloaded
    const achievementData = await checkAchievements();
    
    if (achievementData.newAchievements.length > 0) {
      setNewAchievements(achievementData.newAchievements);
      setShowAchievementNotification(true);
      // Auto-hide after 8 seconds (longer for better visibility)
      setTimeout(() => {
        setShowAchievementNotification(false);
      }, 8000);
    }
  };


  const handleEdit = (entry) => {
    // Prevent editing cash withdrawal, deposit, and balance adjustment entries
    if (entry.type === 'cash_withdrawal' || entry.type === 'cash_deposit' || entry.type === 'balance_adjustment') {
      return;
    }
    // Set entryToEdit FIRST, then open modal after a delay to ensure state is set
    setEntryToEdit(entry);
    // Use setTimeout to ensure state update is processed before opening modal
    // Use a longer delay to ensure React has processed the state update
    setTimeout(() => {
      openAddEntryModal();
    }, 150);
  };

  const handleDuplicate = (entry) => {
    // Prevent duplicating cash withdrawal, deposit, and balance adjustment entries
    if (entry.type === 'cash_withdrawal' || entry.type === 'cash_deposit' || entry.type === 'balance_adjustment') {
      return;
    }
    // Create a duplicate entry with today's date
    const duplicateEntry = {
      ...entry,
      id: undefined, // Remove id so it creates a new entry
      date: formatDate(new Date()), // Set date to today
    };
    setEntryToEdit(duplicateEntry);
    openAddEntryModal();
  };

  const handleDelete = async (id, entry) => {
    setEntryToDelete({ id, ...entry });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry(entryToDelete.id);
      loadData();
      setDeleteModalVisible(false);
      setEntryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEntryToDelete(null);
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > endDate) {
        Alert.alert('Invalid Date', 'Start date cannot be after end date');
        return;
      }
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate < startDate) {
        Alert.alert('Invalid Date', 'End date cannot be before start date');
        return;
      }
      setEndDate(selectedDate);
    }
  };

  const handleApplyFilter = () => {
    setIsCustomDateRange(true);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setIsCustomDateRange(false);
    setShowFilterModal(false);
  };

  const renderEntry = ({ item }) => {
    const isBalanceAdjustment = item.type === 'balance_adjustment';
    const isCashWithdrawal = item.type === 'cash_withdrawal';
    const isCashDeposit = item.type === 'cash_deposit';
    const adjustmentIsAdd = isBalanceAdjustment ? (item.adjustment_type === 'add' || !item.adjustment_type) : false;
    
    // Get category for this entry
    const category = item.category_id ? categories.find(cat => cat.id === item.category_id) : null;
    
    return (
      <TouchableOpacity
        style={styles.transactionCard}
        activeOpacity={0.7}
        onLongPress={() => {
          setSelectedEntryForMenu(item);
          setLongPressMenuVisible(true);
        }}
      >
        <View style={styles.transactionLeft}>
          {category ? (
            <View style={[styles.transactionIconContainer, { backgroundColor: `${category.color}20` }]}>
              <Ionicons
                name={category.icon}
                size={20}
                color={category.color}
              />
            </View>
          ) : (
            <View style={[
              styles.transactionIconContainer,
              isCashWithdrawal || isCashDeposit
                ? (isCashWithdrawal ? styles.transactionIconWithdrawal : styles.transactionIconDeposit)
                : (isBalanceAdjustment 
                    ? styles.transactionIconAdjustment
                    : (item.type === 'expense' ? styles.transactionIconExpense : styles.transactionIconIncome))
            ]}>
              <Ionicons
                name={
                  isCashWithdrawal || isCashDeposit
                    ? 'swap-horizontal'
                    : (isBalanceAdjustment 
                        ? (adjustmentIsAdd ? 'add-circle' : 'remove-circle')
                        : (item.type === 'expense' ? 'arrow-down' : 'arrow-up'))
                }
                size={20}
                color="#FFFFFF"
              />
            </View>
          )}
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionNote} numberOfLines={1}>
              {item.note || (isCashWithdrawal ? 'Cash Withdrawal' : (isCashDeposit ? 'Cash Deposit' : (isBalanceAdjustment ? 'Balance Adjustment' : (item.type === 'expense' ? 'Expense' : 'Income'))))}
            </Text>
            <View style={styles.transactionMeta}>
              <View style={styles.transactionMetaLeft}>
                <Text style={styles.transactionDate}>{formatDateShort(item.date)}</Text>
                {category && (
                  <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon} size={10} color={category.color} />
                    <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <View style={styles.transactionRightTop}>
            {isCashWithdrawal ? (
              <View style={styles.balanceRowItem}>
              <View style={styles.balanceRowIconContainer}>
                <Ionicons name="phone-portrait" size={18} color="#4DABF7" />
              </View>
              <View>
                <Text style={styles.balanceRowLabel}>Digital Balance</Text>
                <Text style={styles.balanceRowValue}>
                  ₹{formatCurrency(bankBalance || 0)}
                </Text>
              </View>
            </View>
            ) : isCashDeposit ? (
              <View style={styles.transactionModeContainer}>
                <View style={styles.transactionMode}>
                  <Ionicons name="cash" size={14} color="#FFD43B" />
                </View>
                <Text style={styles.transactionModeText}>→</Text>
                <View style={styles.transactionMode}>
                  <Ionicons name="phone-portrait" size={14} color="#4DABF7" />
                </View>
              </View>
            ) : (
              <View style={styles.transactionMode}>
                <Ionicons
                  name={(item.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                  size={14}
                  color={(item.mode || 'upi') === 'upi' ? '#4DABF7' : '#FFD43B'}
                />
              </View>
            )}
            <Text style={[
              styles.transactionAmount,
              isCashWithdrawal || isCashDeposit
                ? (isCashWithdrawal ? styles.transactionAmountWithdrawal : styles.transactionAmountDeposit)
                : (isBalanceAdjustment 
                    ? styles.transactionAmountAdjustment
                    : (item.type === 'expense' ? styles.transactionAmountExpense : styles.transactionAmountIncome))
            ]}>
              {isCashWithdrawal || isCashDeposit || isBalanceAdjustment
                ? (isCashWithdrawal || isCashDeposit ? '' : (adjustmentIsAdd ? '+' : '-'))
                : (item.type === 'expense' ? '-' : '+')
              }₹{formatCurrency(item.amount)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedEntryForMenu(item);
              setLongPressMenuVisible(true);
            }}
            style={styles.transactionMoreButton}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 150 && !showStickyHeader) {
          setShowStickyHeader(true);
          Animated.timing(stickyHeaderOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (offsetY <= 150 && showStickyHeader) {
          Animated.timing(stickyHeaderOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowStickyHeader(false);
          });
        }
      },
    }
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -150],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Achievement Notification Modal */}
      {showAchievementNotification && newAchievements.length > 0 && (
        <Modal
          visible={showAchievementNotification}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAchievementNotification(false)}
        >
          <View style={styles.achievementModalOverlay}>
            <View style={styles.achievementModalContent}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.achievementModalGradient}
              >
                <View style={styles.achievementModalHeader}>
                  <View style={styles.achievementModalIconContainer}>
                    <Ionicons name="trophy" size={48} color="#FFFFFF" />
                  </View>
                  <Text style={styles.achievementModalTitle}>Achievement Unlocked! 🎉</Text>
                </View>
                
                <View style={styles.achievementModalBody}>
                  {newAchievements.map((achievement, index) => (
                    <View key={index} style={styles.achievementModalItem}>
                      <Text style={styles.achievementModalName}>{achievement.name}</Text>
                      <Text style={styles.achievementModalDescription}>{achievement.description}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.achievementModalButton}
                  onPress={() => setShowAchievementNotification(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.achievementModalButtonText}>Awesome! 🎊</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* Sticky Compact Header */}
      {showStickyHeader && (
        <Animated.View style={[styles.stickyHeader, { opacity: stickyHeaderOpacity }]}>
          <View style={styles.stickyHeaderContent}>
            <View style={styles.stickyHeaderItem}>
              <View style={styles.stickyHeaderIconExpense}>
                <Ionicons name="arrow-down" size={14} color="#FF6B6B" />
              </View>
              <View style={styles.stickyHeaderTextContainer}>
                <Text style={styles.stickyHeaderLabel}>Expense</Text>
                <Text 
                  style={styles.stickyHeaderValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  ₹{formatCurrency(totals.expense)}
                </Text>
              </View>
            </View>
            <View style={styles.stickyHeaderDivider} />
            <View style={styles.stickyHeaderItem}>
              <View style={styles.stickyHeaderIconIncome}>
                <Ionicons name="arrow-up" size={14} color="#51CF66" />
              </View>
              <View style={styles.stickyHeaderTextContainer}>
                <Text style={styles.stickyHeaderLabel}>Income</Text>
                <Text 
                  style={[styles.stickyHeaderValue, styles.stickyHeaderValueIncome]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  ₹{formatCurrency(totals.income)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Modern Header */}
        <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>
                Hello 👋
              </Text>
              <Text style={styles.headerTitle}>
                {isCustomDateRange ? 'Filtered Summary' : "Today's Summary"}
              </Text>
            </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.headerActionButton} 
                  onPress={() => navigation.navigate('Goals')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerActionButton} 
                  onPress={() => setShowFilterModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="filter" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerActionButton} 
                  onPress={onRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.headerDate}>
              {isCustomDateRange 
                ? `${formatDateWithMonthName(formatDate(startDate))} - ${formatDateWithMonthName(formatDate(endDate))}`
                : formatDateWithMonthName(today)
              }
            </Text>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by note, amount, or date..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                !selectedCategoryFilter && styles.categoryFilterButtonActive
              ]}
              onPress={() => setSelectedCategoryFilter(null)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryFilterText,
                !selectedCategoryFilter && styles.categoryFilterTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {categories
              .filter(cat => cat.type === 'expense' || cat.type === 'income')
              .map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilterButton,
                    selectedCategoryFilter === category.id && styles.categoryFilterButtonActive,
                    selectedCategoryFilter === category.id && { borderColor: category.color }
                  ]}
                  onPress={() => setSelectedCategoryFilter(
                    selectedCategoryFilter === category.id ? null : category.id
                  )}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={category.icon} 
                    size={14} 
                    color={selectedCategoryFilter === category.id ? category.color : Colors.text.secondary} 
                  />
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategoryFilter === category.id && styles.categoryFilterTextActive,
                    selectedCategoryFilter === category.id && { color: category.color }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Horizontal Scrollable Achievement Section */}
        {(streak.currentStreak > 0 || dailyProgress.targetGoal > 0 || weeklyProgress.targetGoal > 0 || monthlyProgress.targetGoal > 0 || dailyExpenseProgress.targetGoal > 0 || achievements.filter(a => a.unlocked).length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementScrollContent}
            style={styles.achievementScrollContainer}
          >
            {streak.currentStreak > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.engagementItemText}>{streak.currentStreak}d</Text>
              </View>
            )}
            {dailyProgress.targetGoal > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="calendar" size={16} color={dailyProgress.isCompleted ? "#FFD700" : Colors.text.secondary} />
                <Text style={[
                  styles.engagementItemText,
                  dailyProgress.isCompleted && styles.engagementItemTextCompleted
                ]}>
                  D:{Math.round(dailyProgress.progress)}%
                </Text>
              </View>
            )}
            {weeklyProgress.targetGoal > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="calendar-outline" size={16} color={weeklyProgress.isCompleted ? "#FFD700" : Colors.text.secondary} />
                <Text style={[
                  styles.engagementItemText,
                  weeklyProgress.isCompleted && styles.engagementItemTextCompleted
                ]}>
                  W:{Math.round(weeklyProgress.progress)}%
                </Text>
              </View>
            )}
            {monthlyProgress.targetGoal > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="flag" size={16} color={monthlyProgress.isCompleted ? "#FFD700" : Colors.text.secondary} />
                <Text style={[
                  styles.engagementItemText,
                  monthlyProgress.isCompleted && styles.engagementItemTextCompleted
                ]}>
                  M:{Math.round(monthlyProgress.progress)}%
                </Text>
              </View>
            )}
            {dailyExpenseProgress.targetGoal > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="warning" size={16} color={dailyExpenseProgress.isOverLimit ? "#FF6B6B" : "#4CAF50"} />
                <Text style={[
                  styles.engagementItemText,
                  dailyExpenseProgress.isOverLimit && styles.engagementItemTextOverLimit
                ]}>
                  E:{Math.round(dailyExpenseProgress.progress)}%
                </Text>
              </View>
            )}
            {achievements.filter(a => a.unlocked).length > 0 && (
              <View style={styles.engagementItem}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.engagementItemText}>
                  {achievements.filter(a => a.unlocked).length}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Main Balance Card with Gradient */}
        <View style={styles.balanceCardContainer}>
          <LinearGradient
            colors={totals.balance >= 0 
              ? ['#667eea', '#764ba2'] 
              : ['#f093fb', '#f5576c']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceCardTitle}>Net Balance</Text>
              <View style={styles.balanceCardChip}>
                <View style={styles.chipPattern} />
              </View>
            </View>
            <Text 
              style={styles.balanceCardAmount}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.6}
            >
              ₹{formatCurrency(totals.balance)}
            </Text>
            <View style={styles.balanceCardFooter}>
              <View style={styles.balanceCardStat}>
                <Ionicons name="arrow-down" size={16} color="rgba(255,255,255,0.8)" />
                <View style={styles.balanceCardStatContent}>
                  <Text style={styles.balanceCardStatLabel}>Expense</Text>
                  <Text 
                    style={styles.balanceCardStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    ₹{formatCurrency(totals.expense)}
                  </Text>
                </View>
              </View>
              <View style={styles.balanceCardDivider} />
              <View style={styles.balanceCardStat}>
                <Ionicons name="arrow-up" size={16} color="rgba(255,255,255,0.8)" />
                <View style={styles.balanceCardStatContent}>
                  <Text style={styles.balanceCardStatLabel}>Income</Text>
                  <Text 
                    style={styles.balanceCardStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    ₹{formatCurrency(totals.income)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>


        {/* Balance Cards Row */}
        <View style={styles.balanceCardsRow}>
          <View style={styles.balanceCardSmall}>
            <View style={styles.balanceCardSmallHeader}>
              <View style={[styles.balanceCardSmallIcon, { backgroundColor: 'rgba(77, 171, 247, 0.15)' }]}>
                <Ionicons name="phone-portrait" size={20} color="#4DABF7" />
              </View>
              <Text style={styles.balanceCardSmallLabel}>Digital Balance</Text>
            </View>
            <Text 
              style={[
                styles.balanceCardSmallAmount,
                bankBalance !== null && bankBalance < 0 && styles.balanceCardSmallAmountNegative
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {bankBalance !== null 
                ? `₹${formatCurrency(Math.abs(bankBalance))}`
                : '₹0.00'
              }
            </Text>
          </View>

          <View style={styles.balanceCardSmall}>
            <View style={styles.balanceCardSmallHeader}>
              <View style={[styles.balanceCardSmallIcon, { backgroundColor: 'rgba(255, 212, 59, 0.15)' }]}>
                <Ionicons name="cash" size={20} color="#FFD43B" />
              </View>
              <Text style={styles.balanceCardSmallLabel}>Cash Balance</Text>
            </View>
            <Text 
              style={[
                styles.balanceCardSmallAmount,
                cashBalance !== null && cashBalance < 0 && styles.balanceCardSmallAmountNegative
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              {cashBalance !== null 
                ? `₹${formatCurrency(Math.abs(cashBalance))}`
                : '₹0.00'
              }
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isCustomDateRange ? 'Filtered Entries' : "Today's Transactions"}
            </Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{todayEntries.length}</Text>
            </View>
          </View>

          {todayEntries.length > 0 ? (
            <View style={styles.transactionsList}>
              {todayEntries.map((item) => (
                <View key={item.id}>
                  {renderEntry({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={56} color="#3a3a3a" />
              </View>
              <Text style={styles.emptyTitle}>
                {isCustomDateRange ? 'No entries found' : 'No transactions today'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isCustomDateRange ? 'Try a different date range' : 'Start tracking your expenses and income'}
              </Text>
            </View>
          )}
        </View>

        <AppFooter />
      </ScrollView>

      {/* Add Entry Modal */}
      <AddEntryModal
        visible={addEntryModalVisible}
        onClose={() => {
          closeAddEntryModal();
          // Don't clear entryToEdit here - it might be needed for reopening
          // It will be cleared after save in handleEntryAdded
        }}
        onSave={handleEntryAdded}
        editEntry={entryToEdit}
      />


      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Entries</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.filterCloseButton}
              >
                <Ionicons name="close" size={24} color="#b0b0b0" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !isCustomDateRange && styles.filterOptionActive
                ]}
                onPress={handleResetFilter}
              >
                <Ionicons 
                  name="today" 
                  size={20} 
                  color={!isCustomDateRange ? '#fff' : '#b0b0b0'} 
                />
                <Text style={[
                  styles.filterOptionText,
                  !isCustomDateRange && styles.filterOptionTextActive
                ]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Custom Date Range</Text>
            
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#1976d2" />
                <View style={styles.datePickerTextContainer}>
                  <Text style={styles.datePickerLabel}>Start Date</Text>
                  <Text style={styles.datePickerValue}>
                    {formatDateWithMonthName(formatDate(startDate))}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#1976d2" />
                <View style={styles.datePickerTextContainer}>
                  <Text style={styles.datePickerLabel}>End Date</Text>
                  <Text style={styles.datePickerValue}>
                    {formatDateWithMonthName(formatDate(endDate))}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartDateChange}
                maximumDate={endDate}
                themeVariant="dark"
                textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            )}
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={startDate}
                maximumDate={new Date()}
                themeVariant="dark"
                textColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            )}

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetFilter}
              >
                <Text style={styles.filterResetText}>Reset to Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={handleApplyFilter}
              >
                <Text style={styles.filterApplyText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        entry={entryToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Long Press Menu Modal */}
      <Modal
        visible={longPressMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLongPressMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.longPressMenuOverlay}
          activeOpacity={1}
          onPress={() => setLongPressMenuVisible(false)}
        >
          <View style={styles.longPressMenuContent}>
            {selectedEntryForMenu && 
             selectedEntryForMenu.type !== 'cash_withdrawal' && 
             selectedEntryForMenu.type !== 'cash_deposit' && 
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.longPressMenuItem}
                onPress={() => {
                  if (selectedEntryForMenu) {
                    handleEdit(selectedEntryForMenu);
                    setLongPressMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.longPressMenuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {selectedEntryForMenu && 
             selectedEntryForMenu.type !== 'cash_withdrawal' && 
             selectedEntryForMenu.type !== 'cash_deposit' && 
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.longPressMenuItem}
                onPress={() => {
                  if (selectedEntryForMenu) {
                    handleDuplicate(selectedEntryForMenu);
                    setLongPressMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.longPressMenuText}>Duplicate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.longPressMenuItem, styles.longPressMenuItemDanger]}
              onPress={() => {
                if (selectedEntryForMenu) {
                  handleDelete(selectedEntryForMenu.id, selectedEntryForMenu);
                  setLongPressMenuVisible(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.status.expense} />
              <Text style={[styles.longPressMenuText, styles.longPressMenuTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyHeaderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyHeaderIconExpense: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderIconIncome: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderTextContainer: {
    flex: 1,
  },
  stickyHeaderLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stickyHeaderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  stickyHeaderValueIncome: {
    color: '#51CF66',
  },
  stickyHeaderDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A',
  },
  header: {
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerGreeting: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceCardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceCardChip: {
    width: 48,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipPattern: {
    width: 36,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  balanceCardAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 24,
  },
  balanceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  balanceCardStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceCardStatContent: {
    flex: 1,
  },
  balanceCardStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceCardStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  balanceCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
  },
  balanceCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  balanceCardSmall: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  balanceCardSmallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  balanceCardSmallIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardSmallLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceCardSmallAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  balanceCardSmallAmountNegative: {
    color: '#FF6B6B',
  },
  transactionsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    minHeight: 80,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionIconExpense: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  transactionIconIncome: {
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
  },
  transactionIconAdjustment: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  transactionIconWithdrawal: {
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
  },
  transactionIconDeposit: {
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
  },
  transactionModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionModeText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  transactionNote: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  transactionMode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  transactionRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  transactionAmountExpense: {
    color: '#FF6B6B',
  },
  transactionAmountIncome: {
    color: '#51CF66',
  },
  transactionAmountAdjustment: {
    color: '#FF9800',
  },
  transactionAmountWithdrawal: {
    color: '#4DABF7',
  },
  transactionAmountDeposit: {
    color: '#51CF66',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 4,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryFilterScroll: {
    gap: 8,
    paddingRight: 20,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    marginRight: 8,
    gap: 6,
  },
  categoryFilterButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  categoryFilterTextActive: {
    fontWeight: '700',
  },
  transactionMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  filterCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptions: {
    marginBottom: 24,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#222',
    gap: 12,
  },
  filterOptionActive: {
    backgroundColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePickerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
  },
  filterApplyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  achievementModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  achievementModalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  achievementModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  achievementModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  achievementModalBody: {
    width: '100%',
    marginBottom: 24,
  },
  achievementModalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementModalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  achievementModalDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  achievementModalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  achievementScrollContainer: {
    marginBottom: 12,
  },
  achievementScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    alignItems: 'center',
  },
  engagementCardCompact: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginRight: 8,
    minWidth: 60,
  },
  engagementItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  engagementItemTextCompleted: {
    color: '#FFD700',
  },
  engagementItemTextOverLimit: {
    color: '#FF6B6B',
  },
  longPressMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  longPressMenuContent: {
    backgroundColor: Colors.background.modal,
    borderRadius: 20,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  longPressMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 12,
  },
  longPressMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    marginTop: 4,
  },
  longPressMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  longPressMenuTextDanger: {
    color: Colors.status.expense,
  },
});

export default HomeScreen;

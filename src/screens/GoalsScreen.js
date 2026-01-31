import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  KeyboardAvoidingView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { 
  getGoals,
  calculateGoalProgress,
  getMotivationalMessage,
  getStreak,
  saveGoals,
  resetGoalCompletion,
} from '../utils/engagementUtils';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';
import AppFooter from '../components/AppFooter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GoalsScreen = () => {
  const { currency } = useCurrency();
  const [goals, setGoals] = useState({});
  const [savingsProgress, setSavingsProgress] = useState({});
  const [expenseProgress, setExpenseProgress] = useState({});
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [activeTab, setActiveTab] = useState('savings'); // 'savings' or 'expense'
  
  // Modal State
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalType, setGoalType] = useState('monthly');
  const [goalInput, setGoalInput] = useState('');
  const [customGoalNameInput, setCustomGoalNameInput] = useState('');

  const loadData = useCallback(async () => {
    const goalsData = await getGoals();
    setGoals(goalsData);
    
    // Load savings progress
    const savings = {
      daily: await calculateGoalProgress('daily', 'savings'),
      weekly: await calculateGoalProgress('weekly', 'savings'),
      monthly: await calculateGoalProgress('monthly', 'savings'),
      yearly: await calculateGoalProgress('yearly', 'savings'),
      custom: await calculateGoalProgress('custom', 'savings'),
    };
    setSavingsProgress(savings);
    
    // Load expense progress
    const expenses = {
      daily: await calculateGoalProgress('daily', 'expense'),
      weekly: await calculateGoalProgress('weekly', 'expense'),
      monthly: await calculateGoalProgress('monthly', 'expense'),
      yearly: await calculateGoalProgress('yearly', 'expense'),
      custom: await calculateGoalProgress('custom', 'expense'),
    };
    setExpenseProgress(expenses);
    
    const message = await getMotivationalMessage();
    setMotivationalMessage(message);
    
    const streakData = await getStreak();
    setStreak(streakData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const GoalCard = ({ 
    title, 
    icon, 
    progress, 
    goalCategory,
    goalType,
    customName 
  }) => {
    if (!progress || progress.targetGoal === 0) return null;

    const isExpense = goalCategory === 'expense';
    const isCompleted = isExpense ? !progress.isOverLimit : progress.isCompleted;
    const isOverLimit = progress.isOverLimit;
    const progressPercent = Math.min(progress.progress, 100);
    
    // For expense goals, we show how much spent vs limit
    const currentDisplay = isExpense 
      ? progress.currentValue 
      : progress.currentValue;
    const targetDisplay = progress.targetGoal;
    const remaining = isExpense 
      ? Math.max(targetDisplay - currentDisplay, 0)
      : Math.max(targetDisplay - currentDisplay, 0);

    return (
      <View style={styles.goalCard}>
        <LinearGradient
          colors={
            isCompleted && !isOverLimit
              ? ['#4CAF50', '#45a049']
              : isOverLimit
              ? ['#f5576c', '#f093fb']
              : ['#667eea', '#764ba2']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goalCardGradient}
        >
          <View style={styles.goalCardHeader}>
            <View style={styles.goalCardIconContainer}>
              <Ionicons name={icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.goalCardTitleContainer}>
              <Text style={styles.goalCardTitle}>
                {customName || title}
              </Text>
              <Text style={styles.goalCardSubtitle}>
                {isExpense ? 'Expense Limit' : 'Savings Goal'}
              </Text>
            </View>
            {isCompleted && !isOverLimit && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
              </View>
            )}
            {isOverLimit && (
              <View style={styles.overLimitBadge}>
                <Ionicons name="warning" size={20} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.goalCardBody}>
            <View style={styles.goalCardAmountRow}>
              <View style={styles.goalCardAmountItem}>
                <Text style={styles.goalCardAmountLabel}>
                  {isExpense ? 'Spent' : 'Saved'}
                </Text>
                <Text style={styles.goalCardAmountValue}>
                  {currency.symbol}{formatCurrency(currentDisplay)}
                </Text>
              </View>
              <View style={styles.goalCardDivider} />
              <View style={styles.goalCardAmountItem}>
                <Text style={styles.goalCardAmountLabel}>
                  {isExpense ? 'Limit' : 'Target'}
                </Text>
                <Text style={styles.goalCardAmountValue}>
                  {currency.symbol}{formatCurrency(targetDisplay)}
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                    isCompleted && !isOverLimit && styles.progressBarComplete,
                    isOverLimit && styles.progressBarOverLimit
                  ]} 
                />
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(progressPercent)}%
              </Text>
            </View>

            <View style={styles.goalCardFooter}>
              {isCompleted && !isOverLimit ? (
                <View style={styles.successMessage}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.successText}>
                    {isExpense ? 'Within Limit! 🎉' : 'Goal Achieved! 🎉'}
                  </Text>
                </View>
              ) : isOverLimit ? (
                <View style={styles.warningMessage}>
                  <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                  <Text style={styles.warningText}>
                    Over by {currency.symbol}{formatCurrency(currentDisplay - targetDisplay)}
                  </Text>
                </View>
              ) : (
                <View style={styles.remainingMessage}>
                  <Ionicons 
                    name={isExpense ? "arrow-down" : "arrow-up"} 
                    size={16} 
                    color={Colors.text.secondary} 
                  />
                  <Text style={styles.remainingText}>
                    {isExpense 
                      ? `${currency.symbol}${formatCurrency(remaining)} left to spend`
                      : `${currency.symbol}${formatCurrency(remaining)} more to reach goal`
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const goalTypes = [
    { key: 'daily', title: 'Daily', icon: 'calendar' },
    { key: 'weekly', title: 'Weekly', icon: 'calendar-outline' },
    { key: 'monthly', title: 'Monthly', icon: 'flag' },
    { key: 'yearly', title: 'Yearly', icon: 'trophy' },
    { key: 'custom', title: 'Custom', icon: 'star' },
  ];

  const getGoalKey = (type) => {
    return activeTab === 'savings'
      ? `${type}SavingsGoal`
      : `${type}ExpenseGoal`;
  };

  const getCustomName = (type) => {
    return activeTab === 'savings'
      ? goals.customSavingsGoalName
      : goals.customExpenseGoalName;
  };

  const activeProgress = activeTab === 'savings' ? savingsProgress : expenseProgress;
  const hasAnyGoals = goalTypes.some(type => {
    const goalKey = getGoalKey(type.key);
    return goals[goalKey] > 0;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Goals & Progress</Text>
          <Text style={styles.headerSubtitle}>Track your financial journey</Text>
        </View>
        {streak.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={styles.streakText}>{streak.currentStreak}d</Text>
          </View>
        )}
        
      </View>

      {/* Set Goal Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.setGoalButton}
          onPress={() => {
             // Default to monthly if not set
             setGoalType('monthly');
             // Pre-fill if exists
             const defaultKey = activeTab === 'savings' ? 'monthlySavingsGoal' : 'monthlyExpenseGoal';
             setGoalInput(goals[defaultKey] > 0 ? goals[defaultKey].toString() : '');
             setShowGoalsModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Colors.accent.gradient.positive}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.setGoalButtonGradient}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.setGoalButtonText}>
              Set {activeTab === 'savings' ? 'Savings Goal' : 'Expense Limit'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Motivational Message */}
      {motivationalMessage && (
        <View style={styles.motivationCard}>
          <LinearGradient
            colors={Colors.accent.gradient.positive}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.motivationCardGradient}
          >
            <Ionicons name="bulb" size={24} color="#FFFFFF" />
            <Text style={styles.motivationText}>{motivationalMessage}</Text>
          </LinearGradient>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'savings' && styles.tabActive]}
          onPress={() => setActiveTab('savings')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeTab === 'savings' ? 'wallet' : 'wallet-outline'} 
            size={20} 
            color={activeTab === 'savings' ? '#FFFFFF' : Colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'savings' && styles.tabTextActive]}>
            Savings Goals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
          onPress={() => setActiveTab('expense')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeTab === 'expense' ? 'card' : 'card-outline'} 
            size={20} 
            color={activeTab === 'expense' ? '#FFFFFF' : Colors.text.secondary} 
          />
          <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
            Expense Limits
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasAnyGoals ? (
          <>
            {goalTypes.map((type) => {
              const goalKey = getGoalKey(type.key);
              const progress = activeProgress[type.key];
              
              if (!goals[goalKey] || goals[goalKey] === 0) return null;
              
              return (
                <GoalCard
                  key={`${activeTab}-${type.key}`}
                  title={type.title}
                  icon={type.icon}
                  progress={progress}
                  goalCategory={activeTab}
                  goalType={type.key}
                  customName={type.key === 'custom' ? getCustomName(type.key) : null}
                />
              );
            })}
          </>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateCard}
            >
              <Ionicons name="flag-outline" size={64} color="#FFFFFF" style={{ opacity: 0.8 }} />
              <Text style={styles.emptyStateTitle}>No Goals Set Yet</Text>
              <Text style={styles.emptyStateText}>
                Set your {activeTab === 'savings' ? 'savings goals' : 'expense limits'} in Settings to start tracking your progress!
              </Text>
            </LinearGradient>
          </View>
        )}

        <AppFooter />
      </ScrollView>

      {/* Goal Setting Modal */}
      <Modal
        visible={showGoalsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {activeTab === 'savings' ? 'Savings Goal' : 'Expense Limit'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowGoalsModal(false);
                  setGoalInput('');
                  setCustomGoalNameInput('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Period Selector in Modal */}
            <View style={styles.periodSelector}>
              {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodOption,
                    goalType === period && styles.periodOptionActive
                  ]}
                  onPress={() => {
                    setGoalType(period);
                    // Update input with existing value for this period
                    const key = activeTab === 'savings' 
                      ? `${period}SavingsGoal` 
                      : `${period}ExpenseGoal`;
                    setGoalInput(goals[key] > 0 ? goals[key].toString() : '');
                    if (period === 'custom') {
                       const nameKey = activeTab === 'savings' 
                        ? 'customSavingsGoalName' 
                        : 'customExpenseGoalName';
                       setCustomGoalNameInput(goals[nameKey] || '');
                    }
                  }}
                >
                  <Text style={[
                      styles.periodOptionText,
                      goalType === period && styles.periodOptionTextActive
                    ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {goalType === 'custom' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Goal name (e.g., Vacation Fund)"
                  placeholderTextColor={Colors.text.tertiary}
                  value={customGoalNameInput}
                  onChangeText={setCustomGoalNameInput}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>{currency.symbol}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor={Colors.text.tertiary}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                autoFocus={false}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={async () => {
                const amount = parseFloat(goalInput);
                if (isNaN(amount) || amount < 0) {
                  Alert.alert('Invalid Input', 'Please enter a valid amount');
                  return;
                }

                try {
                  const updatedGoals = { ...goals };
                  // Determine key based on activeTab and goalType
                  let goalKey = '';
                  if (activeTab === 'savings') {
                    goalKey = goalType === 'custom' ? 'customSavingsGoal' : `${goalType}SavingsGoal`;
                  } else {
                    goalKey = goalType === 'custom' ? 'customExpenseGoal' : `${goalType}ExpenseGoal`;
                  }
                  
                  updatedGoals[goalKey] = amount;
                  
                  if (goalType === 'custom') {
                    if (activeTab === 'savings') {
                      updatedGoals.customSavingsGoalName = customGoalNameInput.trim() || 'Custom Savings Goal';
                    } else {
                      updatedGoals.customExpenseGoalName = customGoalNameInput.trim() || 'Custom Expense Limit';
                    }
                  }
                  
                  // Reset completion status if goal is changing
                  if (activeTab === 'savings') {
                     if (goalType === 'monthly' && updatedGoals.monthlySavingsGoal !== goals.monthlySavingsGoal) {
                       await resetGoalCompletion('monthly');
                     } else if (goalType === 'yearly' && updatedGoals.yearlySavingsGoal !== goals.yearlySavingsGoal) {
                       await resetGoalCompletion('yearly');
                     } else if (goalType === 'custom' && updatedGoals.customSavingsGoal !== goals.customSavingsGoal) {
                       await resetGoalCompletion('custom');
                     }
                  }
                  
                  await saveGoals(updatedGoals);
                  setGoals(updatedGoals);
                  Alert.alert('Success', 'Goal updated successfully!');
                  setShowGoalsModal(false);
                  setGoalInput('');
                  setCustomGoalNameInput('');
                  loadData(); // Refresh progress
                } catch (error) {
                  Alert.alert('Error', 'Failed to save goal. Please try again.');
                }
              }}
            >
              <Text style={styles.modalSaveText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  motivationCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  motivationCardGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.accent.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  goalCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  goalCardGradient: {
    padding: 24,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalCardTitleContainer: {
    flex: 1,
  },
  goalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  goalCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overLimitBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCardBody: {
    gap: 16,
  },
  goalCardAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCardAmountItem: {
    flex: 1,
  },
  goalCardAmountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalCardAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  goalCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  progressBarComplete: {
    backgroundColor: '#FFD700',
  },
  progressBarOverLimit: {
    backgroundColor: '#FF6B6B',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 45,
    textAlign: 'right',
  },
  goalCardFooter: {
    marginTop: 4,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  warningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  remainingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 40,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  setGoalButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  setGoalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  setGoalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  periodOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  periodOptionActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  periodOptionText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  periodOptionTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    padding: 0,
  },
  modalSaveButton: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default GoalsScreen;

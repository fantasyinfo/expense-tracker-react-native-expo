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
import { LinearGradient } from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  getGoals,
  calculateGoalProgress,
  getMotivationalMessage,
  getStreak,
} from '../utils/engagementUtils';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import AppFooter from '../components/AppFooter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GoalsScreen = () => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [goals, setGoals] = useState({});
  const [savingsProgress, setSavingsProgress] = useState({});
  const [expenseProgress, setExpenseProgress] = useState({});
  const [motivationalMessage, setMotivationalMessage] = useState(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [activeTab, setActiveTab] = useState('savings'); // 'savings' or 'expense'

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
                {isExpense ? t('goals.expenseLimit') : t('goals.savingsGoal')}
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
                  {isExpense ? t('goals.spent') : t('goals.saved')}
                </Text>
                <Text style={styles.goalCardAmountValue}>
                  {currency.symbol}{formatCurrency(currentDisplay)}
                </Text>
              </View>
              <View style={styles.goalCardDivider} />
              <View style={styles.goalCardAmountItem}>
                <Text style={styles.goalCardAmountLabel}>
                  {isExpense ? t('goals.limit') : t('goals.target')}
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
                    {isExpense ? t('goals.withinLimit') : t('goals.goalAchieved')}
                  </Text>
                </View>
              ) : isOverLimit ? (
                <View style={styles.warningMessage}>
                  <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                  <Text style={styles.warningText}>
                    {t('goals.overBy')} {currency.symbol}{formatCurrency(currentDisplay - targetDisplay)}
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
                      ? `${currency.symbol}${formatCurrency(remaining)} ${t('goals.leftToSpend')}`
                      : `${currency.symbol}${formatCurrency(remaining)} ${t('goals.moreToReach')}`
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
    { key: 'daily', title: t('common.daily'), icon: 'calendar' },
    { key: 'weekly', title: t('common.weekly'), icon: 'calendar-outline' },
    { key: 'monthly', title: t('common.monthly'), icon: 'flag' },
    { key: 'yearly', title: t('common.yearly'), icon: 'trophy' },
    { key: 'custom', title: t('common.custom'), icon: 'star' },
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
          <Text style={styles.headerTitle}>{t('goals.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('goals.subtitle')}</Text>
        </View>
        {streak.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={styles.streakText}>{streak.currentStreak}d</Text>
          </View>
        )}
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
            <Text style={styles.motivationText}>
              {motivationalMessage ? t(motivationalMessage.key, motivationalMessage.params) : ''}
            </Text>
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
            {t('goals.savingsTab')}
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
            {t('goals.expenseTab')}
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
              <Text style={styles.emptyStateTitle}>{t('goals.noGoalsTitle')}</Text>
              <Text style={styles.emptyStateText}>
                {t('goals.noGoalsMessage', { type: activeTab === 'savings' ? t('goals.savingsGoalsLower') : t('goals.expenseLimitsLower') })}
              </Text>
            </LinearGradient>
          </View>
        )}

        <AppFooter />
      </ScrollView>
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
});

export default GoalsScreen;

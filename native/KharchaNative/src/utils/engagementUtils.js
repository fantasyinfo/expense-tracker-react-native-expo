import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadEntries } from './storage';
import { calculateTotals } from './dateUtils';
import { filterEntriesByPeriod } from './dateUtils';

const STREAK_KEY = '@expense_tracker_streak';
const ACHIEVEMENTS_KEY = '@expense_tracker_achievements';
const GOALS_KEY = '@expense_tracker_goals';
const GOALS_COMPLETED_KEY = '@expense_tracker_goals_completed';
const LAST_ENTRY_DATE_KEY = '@expense_tracker_last_entry_date';

/**
 * Get or initialize streak data
 */
export const getStreak = async () => {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
      };
    }
    return JSON.parse(data);
  } catch (error) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
    };
  }
};

/**
 * Update streak when entry is added
 */
export const updateStreak = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const streakData = await getStreak();
    const lastEntryDate = streakData.lastEntryDate;

    if (!lastEntryDate) {
      // First entry
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
        currentStreak: 1,
        longestStreak: 1,
        lastEntryDate: today,
      }));
      return { currentStreak: 1, longestStreak: 1, isNewStreak: true };
    }

    const lastDate = new Date(lastEntryDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day entry - no streak change
      return streakData;
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      const newStreak = streakData.currentStreak + 1;
      const newLongestStreak = Math.max(newStreak, streakData.longestStreak);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastEntryDate: today,
      }));
      return { currentStreak: newStreak, longestStreak: newLongestStreak, isNewStreak: true };
    } else {
      // Streak broken - reset to 1
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
        currentStreak: 1,
        longestStreak: streakData.longestStreak,
        lastEntryDate: today,
      }));
      return { currentStreak: 1, longestStreak: streakData.longestStreak, isNewStreak: false };
    }
  } catch (error) {
    return { currentStreak: 0, longestStreak: 0, isNewStreak: false };
  }
};

/**
 * Get all achievements
 */
export const getAchievements = async () => {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

/**
 * Get completed goals (to track which goals have been celebrated)
 */
export const getCompletedGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(GOALS_COMPLETED_KEY);
    if (!data) {
      return {
        monthlyGoalCompleted: false,
        yearlyGoalCompleted: false,
        customGoalCompleted: false,
      };
    }
    return JSON.parse(data);
  } catch (error) {
    return {
      monthlyGoalCompleted: false,
      yearlyGoalCompleted: false,
      customGoalCompleted: false,
    };
  }
};

/**
 * Mark goal as completed
 */
export const markGoalAsCompleted = async (goalType) => {
  try {
    const completed = await getCompletedGoals();
    if (goalType === 'monthly') {
      completed.monthlyGoalCompleted = true;
    } else if (goalType === 'yearly') {
      completed.yearlyGoalCompleted = true;
    } else if (goalType === 'custom') {
      completed.customGoalCompleted = true;
    }
    await AsyncStorage.setItem(GOALS_COMPLETED_KEY, JSON.stringify(completed));
  } catch (error) {
    // Error marking goal as completed
  }
};

/**
 * Reset goal completion status (when goal is changed)
 */
export const resetGoalCompletion = async (goalType) => {
  try {
    const completed = await getCompletedGoals();
    if (goalType === 'monthly') {
      completed.monthlyGoalCompleted = false;
    } else if (goalType === 'yearly') {
      completed.yearlyGoalCompleted = false;
    } else if (goalType === 'custom') {
      completed.customGoalCompleted = false;
    }
    await AsyncStorage.setItem(GOALS_COMPLETED_KEY, JSON.stringify(completed));
  } catch (error) {
    // Error resetting goal completion
  }
};

/**
 * Check and unlock achievements
 */
export const checkAchievements = async () => {
  try {
    const entries = await loadEntries();
    const totals = calculateTotals(entries);
    const streakData = await getStreak();
    const unlockedAchievements = await getAchievements();
    const completedGoals = await getCompletedGoals();
    const newAchievements = [];

    // Check goal progress (for achievements, we check savings goals)
    const monthlyProgress = await calculateGoalProgress('monthly', 'savings');
    const yearlyProgress = await calculateGoalProgress('yearly', 'savings');
    const customProgress = await calculateGoalProgress('custom', 'savings');

    const achievementChecks = [
      {
        id: 'first_entry',
        nameKey: 'achievements.firstStep.name',
        descriptionKey: 'achievements.firstStep.description',
        icon: 'star',
        unlocked: entries.length >= 1 && !unlockedAchievements.includes('first_entry'),
      },
      {
        id: 'ten_entries',
        nameKey: 'achievements.tenEntries.name',
        descriptionKey: 'achievements.tenEntries.description',
        icon: 'trophy',
        unlocked: entries.length >= 10 && !unlockedAchievements.includes('ten_entries'),
      },
      {
        id: 'fifty_entries',
        nameKey: 'achievements.fiftyEntries.name',
        descriptionKey: 'achievements.fiftyEntries.description',
        icon: 'medal',
        unlocked: entries.length >= 50 && !unlockedAchievements.includes('fifty_entries'),
      },
      {
        id: 'hundred_entries',
        nameKey: 'achievements.hundredEntries.name',
        descriptionKey: 'achievements.hundredEntries.description',
        icon: 'ribbon',
        unlocked: entries.length >= 100 && !unlockedAchievements.includes('hundred_entries'),
      },
      {
        id: 'streak_7',
        nameKey: 'achievements.streak7.name',
        descriptionKey: 'achievements.streak7.description',
        icon: 'flame',
        unlocked: streakData.currentStreak >= 7 && !unlockedAchievements.includes('streak_7'),
      },
      {
        id: 'streak_30',
        nameKey: 'achievements.streak30.name',
        descriptionKey: 'achievements.streak30.description',
        icon: 'flame',
        unlocked: streakData.currentStreak >= 30 && !unlockedAchievements.includes('streak_30'),
      },
      {
        id: 'savings_10k',
        nameKey: 'achievements.savings10k.name',
        descriptionKey: 'achievements.savings10k.description',
        descriptionParams: { amount: '10,000' },
        icon: 'wallet',
        unlocked: totals.balance >= 10000 && !unlockedAchievements.includes('savings_10k'),
      },
      {
        id: 'savings_1lakh',
        nameKey: 'achievements.savings1lakh.name',
        descriptionKey: 'achievements.savings1lakh.description',
        descriptionParams: { amount: '1,00,000' },
        icon: 'cash',
        unlocked: totals.balance >= 100000 && !unlockedAchievements.includes('savings_1lakh'),
      },
      {
        id: 'positive_balance',
        nameKey: 'achievements.positiveBalance.name',
        descriptionKey: 'achievements.positiveBalance.description',
        icon: 'trending-up',
        unlocked: totals.balance > 0 && !unlockedAchievements.includes('positive_balance'),
      },
      {
        id: 'monthly_goal_completed',
        nameKey: 'achievements.monthlyGoalCompleted.name',
        descriptionKey: 'achievements.monthlyGoalCompleted.description',
        descriptionParams: { amount: monthlyProgress.targetGoal > 0 ? monthlyProgress.targetGoal.toLocaleString('en-IN') : '0' },
        icon: 'trophy',
        unlocked: monthlyProgress.isCompleted && !unlockedAchievements.includes('monthly_goal_completed') && monthlyProgress.targetGoal > 0,
      },
      {
        id: 'yearly_goal_completed',
        nameKey: 'achievements.yearlyGoalCompleted.name',
        descriptionKey: 'achievements.yearlyGoalCompleted.description',
        descriptionParams: { amount: yearlyProgress.targetGoal.toLocaleString('en-IN') },
        icon: 'medal',
        unlocked: yearlyProgress.isCompleted && !unlockedAchievements.includes('yearly_goal_completed') && yearlyProgress.targetGoal > 0,
      },
      {
        id: 'custom_goal_completed',
        nameKey: 'achievements.customGoalCompleted.name',
        descriptionKey: 'achievements.customGoalCompleted.description',
        descriptionParams: { amount: customProgress.targetGoal.toLocaleString('en-IN') },
        icon: 'ribbon',
        unlocked: customProgress.isCompleted && !unlockedAchievements.includes('custom_goal_completed') && customProgress.targetGoal > 0,
      },
    ];

    // Process achievements sequentially to handle async goal completion
    for (const achievement of achievementChecks) {
      if (achievement.unlocked) {
        newAchievements.push(achievement.id);
        unlockedAchievements.push(achievement.id);
        
        // Mark goal as completed if it's a goal achievement
        if (achievement.id === 'monthly_goal_completed') {
          await markGoalAsCompleted('monthly');
        } else if (achievement.id === 'yearly_goal_completed') {
          await markGoalAsCompleted('yearly');
        } else if (achievement.id === 'custom_goal_completed') {
          await markGoalAsCompleted('custom');
        }
      }
    }

    if (newAchievements.length > 0) {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
    }

    return {
      newAchievements: achievementChecks.filter(a => newAchievements.includes(a.id)),
      allAchievements: achievementChecks.map(a => ({
        ...a,
        unlocked: unlockedAchievements.includes(a.id),
      })),
    };
  } catch (error) {
    return { newAchievements: [], allAchievements: [] };
  }
};

/**
 * Get savings goals
 */
export const getGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(GOALS_KEY);
    if (!data) {
      return {
        // Savings goals
        dailySavingsGoal: 0,
        weeklySavingsGoal: 0,
        monthlySavingsGoal: 0,
        yearlySavingsGoal: 0,
        customSavingsGoal: 0,
        customSavingsGoalName: '',
        // Expense goals (limits)
        dailyExpenseGoal: 0,
        weeklyExpenseGoal: 0,
        monthlyExpenseGoal: 0,
        yearlyExpenseGoal: 0,
        customExpenseGoal: 0,
        customExpenseGoalName: '',
      };
    }
    const goals = JSON.parse(data);
    // Migrate old format to new format
    if (goals.monthlyGoal !== undefined && goals.monthlySavingsGoal === undefined) {
      return {
        dailySavingsGoal: goals.dailySavingsGoal || 0,
        weeklySavingsGoal: goals.weeklySavingsGoal || 0,
        monthlySavingsGoal: goals.monthlyGoal || 0,
        yearlySavingsGoal: goals.yearlyGoal || 0,
        customSavingsGoal: goals.customGoal || 0,
        customSavingsGoalName: goals.customGoalName || '',
        dailyExpenseGoal: goals.dailyExpenseGoal || 0,
        weeklyExpenseGoal: goals.weeklyExpenseGoal || 0,
        monthlyExpenseGoal: goals.monthlyExpenseGoal || 0,
        yearlyExpenseGoal: goals.yearlyExpenseGoal || 0,
        customExpenseGoal: goals.customExpenseGoal || 0,
        customExpenseGoalName: goals.customExpenseGoalName || '',
      };
    }
    return goals;
  } catch (error) {
    return {
      dailySavingsGoal: 0,
      weeklySavingsGoal: 0,
      monthlySavingsGoal: 0,
      yearlySavingsGoal: 0,
      customSavingsGoal: 0,
      customSavingsGoalName: '',
      dailyExpenseGoal: 0,
      weeklyExpenseGoal: 0,
      monthlyExpenseGoal: 0,
      yearlyExpenseGoal: 0,
      customExpenseGoal: 0,
      customExpenseGoalName: '',
    };
  }
};

/**
 * Save savings goals
 */
export const saveGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate goal progress
 * @param {string} goalType - 'daily', 'weekly', 'monthly', 'yearly', 'custom'
 * @param {string} goalCategory - 'savings' or 'expense'
 */
export const calculateGoalProgress = async (goalType = 'monthly', goalCategory = 'savings') => {
  try {
    const goals = await getGoals();
    const entries = await loadEntries();
    const dailyEntries = filterEntriesByPeriod(entries, 'daily');
    const weeklyEntries = filterEntriesByPeriod(entries, 'weekly');
    const monthlyEntries = filterEntriesByPeriod(entries, 'monthly');
    const yearlyEntries = filterEntriesByPeriod(entries, 'yearly');
    
    let currentValue = 0;
    let targetGoal = 0;
    let goalKey = '';

    if (goalCategory === 'savings') {
      // For savings goals, we track balance (income - expense)
      if (goalType === 'daily') {
        const dailyTotals = calculateTotals(dailyEntries);
        currentValue = dailyTotals.balance;
        targetGoal = goals.dailySavingsGoal || 0;
        goalKey = 'dailySavingsGoal';
      } else if (goalType === 'weekly') {
        const weeklyTotals = calculateTotals(weeklyEntries);
        currentValue = weeklyTotals.balance;
        targetGoal = goals.weeklySavingsGoal || 0;
        goalKey = 'weeklySavingsGoal';
      } else if (goalType === 'monthly') {
        const monthlyTotals = calculateTotals(monthlyEntries);
        currentValue = monthlyTotals.balance;
        targetGoal = goals.monthlySavingsGoal || 0;
        goalKey = 'monthlySavingsGoal';
      } else if (goalType === 'yearly') {
        const yearlyTotals = calculateTotals(yearlyEntries);
        currentValue = yearlyTotals.balance;
        targetGoal = goals.yearlySavingsGoal || 0;
        goalKey = 'yearlySavingsGoal';
      } else if (goalType === 'custom') {
        const allTotals = calculateTotals(entries);
        currentValue = allTotals.balance;
        targetGoal = goals.customSavingsGoal || 0;
        goalKey = 'customSavingsGoal';
      }
    } else {
      // For expense goals, we track total expenses (limit)
      if (goalType === 'daily') {
        const dailyTotals = calculateTotals(dailyEntries);
        currentValue = dailyTotals.expense;
        targetGoal = goals.dailyExpenseGoal || 0;
        goalKey = 'dailyExpenseGoal';
      } else if (goalType === 'weekly') {
        const weeklyTotals = calculateTotals(weeklyEntries);
        currentValue = weeklyTotals.expense;
        targetGoal = goals.weeklyExpenseGoal || 0;
        goalKey = 'weeklyExpenseGoal';
      } else if (goalType === 'monthly') {
        const monthlyTotals = calculateTotals(monthlyEntries);
        currentValue = monthlyTotals.expense;
        targetGoal = goals.monthlyExpenseGoal || 0;
        goalKey = 'monthlyExpenseGoal';
      } else if (goalType === 'yearly') {
        const yearlyTotals = calculateTotals(yearlyEntries);
        currentValue = yearlyTotals.expense;
        targetGoal = goals.yearlyExpenseGoal || 0;
        goalKey = 'yearlyExpenseGoal';
      } else if (goalType === 'custom') {
        const allTotals = calculateTotals(entries);
        currentValue = allTotals.expense;
        targetGoal = goals.customExpenseGoal || 0;
        goalKey = 'customExpenseGoal';
      }
    }

    // For expense goals, progress is inverted (we want to stay UNDER the limit)
    // For savings goals, progress is normal (we want to reach or exceed)
    let progress = 0;
    let remaining = 0;
    let isCompleted = false;
    let isOverLimit = false;

    if (goalCategory === 'expense') {
      // Expense goal: staying under limit is success
      progress = targetGoal > 0 ? Math.min((currentValue / targetGoal) * 100, 100) : 0;
      remaining = Math.max(targetGoal - currentValue, 0);
      isCompleted = currentValue <= targetGoal && targetGoal > 0;
      isOverLimit = currentValue > targetGoal && targetGoal > 0;
    } else {
      // Savings goal: reaching or exceeding is success
      progress = targetGoal > 0 ? Math.min((currentValue / targetGoal) * 100, 100) : 0;
      remaining = Math.max(targetGoal - currentValue, 0);
      isCompleted = currentValue >= targetGoal && targetGoal > 0;
    }

    return {
      currentValue,
      targetGoal,
      progress,
      remaining,
      isCompleted,
      isOverLimit,
      goalCategory,
      goalType,
      goalKey,
    };
  } catch (error) {
    return {
      currentValue: 0,
      targetGoal: 0,
      progress: 0,
      remaining: 0,
      isCompleted: false,
      isOverLimit: false,
      goalCategory,
      goalType,
      goalKey: '',
    };
  }
};

/**
 * Get motivational message based on progress
 */
export const getMotivationalMessage = async () => {
  try {
    const entries = await loadEntries();
    const totals = calculateTotals(entries);
    const streakData = await getStreak();
    const monthlyProgress = await calculateGoalProgress('monthly');
    
    const messages = [];

    if (streakData.currentStreak > 0) {
      if (streakData.currentStreak >= 30) {
        messages.push({ key: 'motivation.streakAmazing', params: { streak: streakData.currentStreak } });
      } else if (streakData.currentStreak >= 7) {
        messages.push({ key: 'motivation.streakGreat', params: { streak: streakData.currentStreak } });
      } else {
        messages.push({ key: 'motivation.streakGood', params: { streak: streakData.currentStreak } });
      }
    }

    if (monthlyProgress.isCompleted) {
      messages.push({ key: 'motivation.monthlyGoalAchieved', params: {} });
    } else if (monthlyProgress.progress >= 75) {
      messages.push({ key: 'motivation.monthlyGoalAlmost', params: { percent: Math.round(monthlyProgress.progress) } });
    } else if (monthlyProgress.progress >= 50) {
      messages.push({ key: 'motivation.monthlyGoalHalfway', params: {} });
    }

    if (totals.balance > 0) {
      messages.push({ key: 'motivation.positiveBalance', params: {} });
    }

    if (entries.length >= 100) {
      messages.push({ key: 'motivation.entries100', params: { count: entries.length } });
    } else if (entries.length >= 50) {
      messages.push({ key: 'motivation.entries50', params: { count: entries.length } });
    }

    return messages.length > 0 ? messages[Math.floor(Math.random() * messages.length)] : { key: 'motivation.default', params: {} };
  } catch (error) {
    return { key: 'motivation.defaultShort', params: {} };
  }
};

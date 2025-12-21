import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  getStreak, 
  getAchievements, 
  checkAchievements,
  getGoals,
  saveGoals,
  calculateGoalProgress,
  getMotivationalMessage,
} from '../utils/engagementUtils';
import Colors from '../constants/colors';
import { formatCurrency } from '../utils/dateUtils';
import AppFooter from '../components/AppFooter';

const EngagementScreen = () => {
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [achievements, setAchievements] = useState([]);
  const [goals, setGoals] = useState({ monthlyGoal: 0, yearlyGoal: 0, customGoal: 0, customGoalName: '' });
  const [monthlyProgress, setMonthlyProgress] = useState({ progress: 0, currentBalance: 0, targetGoal: 0 });
  const [yearlyProgress, setYearlyProgress] = useState({ progress: 0, currentBalance: 0, targetGoal: 0 });
  const [customProgress, setCustomProgress] = useState({ progress: 0, currentBalance: 0, targetGoal: 0 });
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showNewAchievements, setShowNewAchievements] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    const streakData = await getStreak();
    setStreak(streakData);
    
    const achievementData = await checkAchievements();
    setAchievements(achievementData.allAchievements);
    
    if (achievementData.newAchievements.length > 0) {
      setNewAchievements(achievementData.newAchievements);
      setShowNewAchievements(true);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowNewAchievements(false);
      });
    }
    
    const goalsData = await getGoals();
    setGoals(goalsData);
    
    const monthly = await calculateGoalProgress('monthly');
    setMonthlyProgress(monthly);
    
    const yearly = await calculateGoalProgress('yearly');
    setYearlyProgress(yearly);
    
    const custom = await calculateGoalProgress('custom');
    setCustomProgress(custom);
    
    const message = await getMotivationalMessage();
    setMotivationalMessage(message);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const achievementIcons = {
    star: 'star',
    trophy: 'trophy',
    medal: 'medal',
    ribbon: 'ribbon',
    flame: 'flame',
    wallet: 'wallet',
    cash: 'cash',
    'trending-up': 'trending-up',
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* New Achievement Notification */}
      {showNewAchievements && newAchievements.length > 0 && (
        <Animated.View style={[styles.achievementNotification, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementNotificationGradient}
          >
            <Ionicons name="trophy" size={32} color="#FFFFFF" />
            <View style={styles.achievementNotificationContent}>
              <Text style={styles.achievementNotificationTitle}>Achievement Unlocked! 🎉</Text>
              {newAchievements.map(achievement => {
                const ach = achievements.find(a => a.id === achievement);
                return ach ? (
                  <Text key={ach.id} style={styles.achievementNotificationText}>
                    {ach.name}: {ach.description}
                  </Text>
                ) : null;
              })}
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your journey to financial success</Text>
        </View>
      </View>

      {/* Motivational Message Card */}
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

      {/* Streak Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Streak</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame" size={32} color="#FF6B35" />
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{streak.currentStreak} days</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="trophy" size={32} color="#FFD700" />
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakLabel}>Longest Streak</Text>
              <Text style={styles.streakValue}>{streak.longestStreak} days</Text>
            </View>
          </View>
        </View>
        <Text style={styles.streakHint}>
          {streak.currentStreak > 0 
            ? `Keep it up! Add an entry today to maintain your streak! 🔥`
            : `Start your streak today by adding an entry! 💪`
          }
        </Text>
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Savings Goals</Text>
        
        {/* Monthly Goal */}
        {goals.monthlyGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>Monthly Goal</Text>
              <Text style={styles.goalAmount}>
                ₹{formatCurrency(monthlyProgress.currentBalance)} / ₹{formatCurrency(monthlyProgress.targetGoal)}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(monthlyProgress.progress, 100)}%` },
                    monthlyProgress.isCompleted && styles.progressBarComplete
                  ]} 
                />
              </View>
            </View>
            <View style={styles.goalFooter}>
              <Text style={styles.progressText}>
                {monthlyProgress.isCompleted 
                  ? '🎉 Goal Achieved!' 
                  : `${Math.round(monthlyProgress.progress)}% Complete`
                }
              </Text>
              {!monthlyProgress.isCompleted && (
                <Text style={styles.remainingText}>
                  ₹{formatCurrency(monthlyProgress.remaining)} remaining
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Yearly Goal */}
        {goals.yearlyGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>Yearly Goal</Text>
              <Text style={styles.goalAmount}>
                ₹{formatCurrency(yearlyProgress.currentBalance)} / ₹{formatCurrency(yearlyProgress.targetGoal)}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(yearlyProgress.progress, 100)}%` },
                    yearlyProgress.isCompleted && styles.progressBarComplete
                  ]} 
                />
              </View>
            </View>
            <View style={styles.goalFooter}>
              <Text style={styles.progressText}>
                {yearlyProgress.isCompleted 
                  ? '🎉 Goal Achieved!' 
                  : `${Math.round(yearlyProgress.progress)}% Complete`
                }
              </Text>
              {!yearlyProgress.isCompleted && (
                <Text style={styles.remainingText}>
                  ₹{formatCurrency(yearlyProgress.remaining)} remaining
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Custom Goal */}
        {goals.customGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>
                {goals.customGoalName || 'Custom Goal'}
              </Text>
              <Text style={styles.goalAmount}>
                ₹{formatCurrency(customProgress.currentBalance)} / ₹{formatCurrency(customProgress.targetGoal)}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(customProgress.progress, 100)}%` },
                    customProgress.isCompleted && styles.progressBarComplete
                  ]} 
                />
              </View>
            </View>
            <View style={styles.goalFooter}>
              <Text style={styles.progressText}>
                {customProgress.isCompleted 
                  ? '🎉 Goal Achieved!' 
                  : `${Math.round(customProgress.progress)}% Complete`
                }
              </Text>
              {!customProgress.isCompleted && (
                <Text style={styles.remainingText}>
                  ₹{formatCurrency(customProgress.remaining)} remaining
                </Text>
              )}
            </View>
          </View>
        )}

        {goals.monthlyGoal === 0 && goals.yearlyGoal === 0 && goals.customGoal === 0 && (
          <View style={styles.emptyGoalsCard}>
            <Ionicons name="flag-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyGoalsText}>No goals set yet</Text>
            <Text style={styles.emptyGoalsSubtext}>
              Set savings goals in Settings to track your progress!
            </Text>
          </View>
        )}
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked
              ]}
            >
              <View style={[
                styles.achievementIconContainer,
                !achievement.unlocked && styles.achievementIconLocked
              ]}>
                <Ionicons 
                  name={achievementIcons[achievement.icon] || 'star'} 
                  size={32} 
                  color={achievement.unlocked ? '#FFD700' : Colors.text.tertiary} 
                />
              </View>
              <Text style={[
                styles.achievementName,
                !achievement.unlocked && styles.achievementNameLocked
              ]}>
                {achievement.name}
              </Text>
              <Text style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.achievementDescriptionLocked
              ]}>
                {achievement.unlocked ? achievement.description : 'Locked'}
              </Text>
              {!achievement.unlocked && (
                <Ionicons name="lock-closed" size={16} color={Colors.text.tertiary} style={styles.lockIcon} />
              )}
            </View>
          ))}
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  achievementNotification: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  achievementNotificationGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  achievementNotificationContent: {
    flex: 1,
  },
  achievementNotificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementNotificationText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  motivationCard: {
    marginHorizontal: 20,
    marginBottom: 24,
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
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  streakCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginBottom: 12,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border.primary,
    marginHorizontal: 16,
  },
  streakHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  goalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: Colors.background.primary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.status.income,
    borderRadius: 6,
  },
  progressBarComplete: {
    backgroundColor: '#FFD700',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  remainingText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  emptyGoalsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  emptyGoalsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyGoalsSubtext: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    position: 'relative',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementIconLocked: {
    backgroundColor: Colors.background.primary,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: Colors.text.tertiary,
  },
  achievementDescription: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  achievementDescriptionLocked: {
    color: Colors.text.tertiary,
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default EngagementScreen;

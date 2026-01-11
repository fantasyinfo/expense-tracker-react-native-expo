import AsyncStorage from '@react-native-async-storage/async-storage';
import { addEntry } from './storage';

const SUBSCRIPTIONS_KEY = '@expense_tracker_subscriptions';

/**
 * Load all subscriptions from AsyncStorage
 */
export const loadSubscriptions = async () => {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    return [];
  }
};

/**
 * Save all subscriptions to AsyncStorage
 */
export const saveSubscriptions = async (subscriptions) => {
  try {
    await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Error saving subscriptions:', error);
  }
};

/**
 * Add a new subscription
 */
export const addSubscription = async (subscription) => {
  const subscriptions = await loadSubscriptions();
  const newSubscription = {
    ...subscription,
    id: Date.now().toString(),
    is_active: true,
  };
  subscriptions.push(newSubscription);
  await saveSubscriptions(subscriptions);
  return newSubscription;
};

/**
 * Update an existing subscription
 */
export const updateSubscription = async (id, updatedData) => {
  const subscriptions = await loadSubscriptions();
  const index = subscriptions.findIndex(s => s.id === id);
  if (index !== -1) {
    subscriptions[index] = {
      ...subscriptions[index],
      ...updatedData,
      id,
    };
    await saveSubscriptions(subscriptions);
    return subscriptions[index];
  }
  return null;
};

/**
 * Delete a subscription
 */
export const deleteSubscription = async (id) => {
  const subscriptions = await loadSubscriptions();
  const filtered = subscriptions.filter(s => s.id !== id);
  await saveSubscriptions(filtered);
};

/**
 * Check and process due recurring expenses
 * This should be called on app launch or periodic intervals
 */
export const processRecurringExpenses = async () => {
  const subscriptions = await loadSubscriptions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let updated = false;
  const processedSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
    if (!sub.is_active) return sub;

    let nextBillingDate = new Date(sub.next_billing_date);
    nextBillingDate.setHours(0, 0, 0, 0);

    let currentSub = { ...sub };

    while (nextBillingDate <= today) {
      // Create a transaction entry for this occurrence
      const newEntry = {
        type: 'expense',
        amount: sub.amount,
        category_id: sub.category_id,
        mode: sub.mode || 'upi',
        note: `Subscription: ${sub.name}`,
        date: nextBillingDate.toISOString(),
      };
      
      await addEntry(newEntry);
      
      // Calculate next billing date
      const newNextDate = new Date(nextBillingDate);
      if (sub.frequency === 'daily') {
        newNextDate.setDate(newNextDate.getDate() + 1);
      } else if (sub.frequency === 'weekly') {
        newNextDate.setDate(newNextDate.getDate() + 7);
      } else if (sub.frequency === 'monthly') {
        newNextDate.setMonth(newNextDate.getMonth() + 1);
      } else if (sub.frequency === 'yearly') {
        newNextDate.setFullYear(newNextDate.getFullYear() + 1);
      }
      
      nextBillingDate = newNextDate;
      currentSub.next_billing_date = nextBillingDate.toISOString();
      updated = true;
    }

    return currentSub;
  }));

  if (updated) {
    await saveSubscriptions(processedSubscriptions);
  }
  
  return updated;
};

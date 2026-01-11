import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  loadSubscriptions, 
  addSubscription as addSub, 
  updateSubscription as updateSub, 
  deleteSubscription as deleteSub, 
  processRecurringExpenses 
} from '../utils/subscriptionUtils';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const data = await loadSubscriptions();
    setSubscriptions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = async (subscription) => {
    const newSub = await addSub(subscription);
    setSubscriptions(prev => [...prev, newSub]);
    return newSub;
  };

  const updateSubscription = async (id, updatedData) => {
    const updatedSub = await updateSub(id, updatedData);
    if (updatedSub) {
      setSubscriptions(prev => prev.map(s => s.id === id ? updatedSub : s));
    }
    return updatedSub;
  };

  const deleteSubscription = async (id) => {
    await deleteSub(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const runRecurringProcessor = async () => {
    const updated = await processRecurringExpenses();
    if (updated) {
      await fetchSubscriptions();
    }
    return updated;
  };

  return (
    <SubscriptionContext.Provider value={{
      subscriptions,
      loading,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      refreshSubscriptions: fetchSubscriptions,
      runRecurringProcessor
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
};

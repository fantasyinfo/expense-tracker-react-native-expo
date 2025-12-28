import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_STORAGE_KEY = '@expense_tracker_categories';

// Default categories with icons and colors - Broad categories only
export const DEFAULT_CATEGORIES = [
  // Food & Dining (Broad)
  { id: 'food_dining', name: 'Food & Dining', icon: 'restaurant-outline', color: '#FF9800', type: 'expense' },
  
  // Groceries
  { id: 'groceries', name: 'Groceries', icon: 'basket-outline', color: '#4CAF50', type: 'expense' },
  
  // Transportation (Broad)
  { id: 'transportation', name: 'Transportation', icon: 'car-outline', color: '#2196F3', type: 'expense' },
  
  // Shopping (Broad)
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline', color: '#E91E63', type: 'expense' },
  
  // Bills & Utilities (Broad)
  { id: 'bills_utilities', name: 'Bills & Utilities', icon: 'flash-outline', color: '#FFC107', type: 'expense' },
  
  // Entertainment (Broad)
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline', color: '#9C27B0', type: 'expense' },
  
  // Health & Fitness (Broad)
  { id: 'health_fitness', name: 'Health & Fitness', icon: 'medical-outline', color: '#F44336', type: 'expense' },
  
  // Education (Broad)
  { id: 'education', name: 'Education', icon: 'school-outline', color: '#2196F3', type: 'expense' },
  
  // Personal Care (Broad)
  { id: 'personal_care', name: 'Personal Care', icon: 'sparkles-outline', color: '#E91E63', type: 'expense' },
  
  // Travel (Broad)
  { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#00BCD4', type: 'expense' },
  
  // Transfer to Person
  { id: 'transfer_person', name: 'Transfer to Person', icon: 'person-outline', color: '#FF5722', type: 'expense' },
  
  // Income Categories (Broad)
  { id: 'income_salary', name: 'Salary', icon: 'cash-outline', color: '#4CAF50', type: 'income' },
  { id: 'income_business', name: 'Business', icon: 'briefcase-outline', color: '#2196F3', type: 'income' },
  { id: 'income_other', name: 'Other Income', icon: 'wallet-outline', color: '#607D8B', type: 'income' },
  
  // Other
  { id: 'other_general', name: 'General', icon: 'ellipse-outline', color: '#9E9E9E', type: 'expense' },
];

/**
 * Load all categories from AsyncStorage
 * Returns default categories if none exist
 */
export const loadCategories = async () => {
  try {
    const data = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!data) {
      // First time - save default categories
      await saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const categories = JSON.parse(data);
    // Merge with default categories to ensure all defaults exist
    const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
    const customCategories = categories.filter(c => !defaultIds.has(c.id));
    return [...DEFAULT_CATEGORIES, ...customCategories];
  } catch (error) {
    return DEFAULT_CATEGORIES;
  }
};

/**
 * Save all categories to AsyncStorage
 */
export const saveCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    // Error saving categories
  }
};

/**
 * Add a new custom category
 */
export const addCategory = async (category) => {
  const categories = await loadCategories();
  const newCategory = {
    ...category,
    id: category.id || `custom_${Date.now()}`,
    type: category.type || 'expense',
  };
  categories.push(newCategory);
  await saveCategories(categories);
  return newCategory;
};

/**
 * Delete a custom category (cannot delete default categories)
 */
export const deleteCategory = async (id) => {
  const categories = await loadCategories();
  const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
  if (defaultIds.has(id)) {
    throw new Error('Cannot delete default category');
  }
  const filtered = categories.filter(cat => cat.id !== id);
  await saveCategories(filtered);
};

/**
 * Update a category
 */
export const updateCategory = async (id, updatedCategory) => {
  const categories = await loadCategories();
  const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
  if (defaultIds.has(id)) {
    throw new Error('Cannot modify default category');
  }
  const index = categories.findIndex(cat => cat.id === id);
  if (index !== -1) {
    categories[index] = {
      ...categories[index],
      ...updatedCategory,
      id, // Preserve the original id
    };
    await saveCategories(categories);
    return categories[index];
  }
  return null;
};

/**
 * Get category by id
 */
export const getCategoryById = async (id) => {
  const categories = await loadCategories();
  return categories.find(cat => cat.id === id) || null;
};

/**
 * Get categories by type (expense or income)
 */
export const getCategoriesByType = async (type) => {
  const categories = await loadCategories();
  return categories.filter(cat => cat.type === type);
};


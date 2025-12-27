import { loadCategories } from './categoryStorage';

/**
 * Prepare chart data for category-wise expense breakdown
 */
export const prepareCategoryChart = async (entries) => {
  const categories = await loadCategories();
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  
  // Filter only expense entries with categories
  const expenseEntries = entries.filter(
    entry => entry.type === 'expense' && entry.category_id
  );
  
  // Aggregate by category
  const categoryTotals = {};
  expenseEntries.forEach(entry => {
    const categoryId = entry.category_id;
    if (!categoryTotals[categoryId]) {
      categoryTotals[categoryId] = {
        id: categoryId,
        amount: 0,
        count: 0,
      };
    }
    categoryTotals[categoryId].amount += parseFloat(entry.amount) || 0;
    categoryTotals[categoryId].count += 1;
  });
  
  // Convert to array and sort by amount (descending)
  const categoryData = Object.values(categoryTotals)
    .map(item => {
      const category = categoryMap.get(item.id);
      return {
        id: item.id,
        name: category?.name || 'Unknown',
        icon: category?.icon || 'ellipse-outline',
        color: category?.color || '#9E9E9E',
        amount: item.amount,
        count: item.count,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10 categories
  
  // Prepare chart data
  const labels = categoryData.map(item => item.name);
  const data = categoryData.map(item => item.amount);
  const colors = categoryData.map(item => item.color);
  
  return {
    labels,
    datasets: [{ data }],
    colors,
    categoryData, // Full data for legend/display
  };
};

/**
 * Get category statistics
 */
export const getCategoryStats = async (entries) => {
  const categories = await loadCategories();
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  
  const stats = {
    totalExpenses: 0,
    totalIncome: 0,
    categoryBreakdown: {},
    uncategorized: {
      expense: 0,
      income: 0,
      count: 0,
    },
  };
  
  entries.forEach(entry => {
    if (entry.type === 'expense') {
      stats.totalExpenses += parseFloat(entry.amount) || 0;
      if (entry.category_id) {
        if (!stats.categoryBreakdown[entry.category_id]) {
          const category = categoryMap.get(entry.category_id);
          stats.categoryBreakdown[entry.category_id] = {
            id: entry.category_id,
            name: category?.name || 'Unknown',
            icon: category?.icon || 'ellipse-outline',
            color: category?.color || '#9E9E9E',
            amount: 0,
            count: 0,
          };
        }
        stats.categoryBreakdown[entry.category_id].amount += parseFloat(entry.amount) || 0;
        stats.categoryBreakdown[entry.category_id].count += 1;
      } else {
        stats.uncategorized.expense += parseFloat(entry.amount) || 0;
        stats.uncategorized.count += 1;
      }
    } else if (entry.type === 'income') {
      stats.totalIncome += parseFloat(entry.amount) || 0;
      if (entry.category_id) {
        if (!stats.categoryBreakdown[entry.category_id]) {
          const category = categoryMap.get(entry.category_id);
          stats.categoryBreakdown[entry.category_id] = {
            id: entry.category_id,
            name: category?.name || 'Unknown',
            icon: category?.icon || 'ellipse-outline',
            color: category?.color || '#9E9E9E',
            amount: 0,
            count: 0,
          };
        }
        stats.categoryBreakdown[entry.category_id].amount += parseFloat(entry.amount) || 0;
        stats.categoryBreakdown[entry.category_id].count += 1;
      } else {
        stats.uncategorized.income += parseFloat(entry.amount) || 0;
        stats.uncategorized.count += 1;
      }
    }
  });
  
  return stats;
};


import { filterEntriesByPeriod, calculateTotals } from './dateUtils';

/**
 * Prepare chart data for expense vs income comparison
 */
export const prepareExpenseIncomeChart = (entries, period) => {
  const filtered = filterEntriesByPeriod(entries, period);
  const totals = calculateTotals(filtered);

  return {
    labels: ['Expense', 'Income'],
    datasets: [
      {
        data: [totals.expense || 0, totals.income || 0],
      },
    ],
  };
};

/**
 * Prepare monthly breakdown chart data
 */
export const prepareMonthlyChart = (entries) => {
  // Group entries by month
  const monthlyData = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.date + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        label: monthLabel,
        expense: 0,
        income: 0,
      };
    }
    
    if (entry.type === 'expense') {
      monthlyData[monthKey].expense += parseFloat(entry.amount) || 0;
    } else {
      monthlyData[monthKey].income += parseFloat(entry.amount) || 0;
    }
  });

  // Sort by date and get last 6 months
  const sortedMonths = Object.keys(monthlyData)
    .sort()
    .slice(-6);

  if (sortedMonths.length === 0) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  return {
    labels: sortedMonths.map(key => monthlyData[key].label),
    datasets: [
      {
        data: sortedMonths.map(key => monthlyData[key].expense),
      },
      {
        data: sortedMonths.map(key => monthlyData[key].income),
      },
    ],
  };
};

/**
 * Prepare chart data for UPI vs Cash comparison
 */
export const preparePaymentMethodChart = (entries) => {
  const totals = calculateTotals(entries);
  
  return {
    labels: ['Digital', 'Cash'],
    datasets: [
      {
        data: [
          totals.expenseUpi + totals.incomeUpi || 0,
          totals.expenseCash + totals.incomeCash || 0
        ],
      },
    ],
  };
};

/**
 * Prepare chart data for UPI vs Cash breakdown by expense/income
 */
export const preparePaymentMethodBreakdownChart = (entries) => {
  const totals = calculateTotals(entries);
  
  return {
    labels: ['Expense Digital', 'Expense Cash', 'Income Digital', 'Income Cash'],
    datasets: [
      {
        data: [
          totals.expenseUpi || 0,
          totals.expenseCash || 0,
          totals.incomeUpi || 0,
          totals.incomeCash || 0,
        ],
      },
    ],
  };
};

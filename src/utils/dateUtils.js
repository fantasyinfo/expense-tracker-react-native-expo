/**
 * Format date to YYYY-MM-DD (for storage)
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date to DD/MM/YYYY (for display)
 */
export const formatDateDisplay = (dateString) => {
  const date = parseDate(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date with month name (e.g., "19 December 2025")
 */
export const formatDateWithMonthName = (dateString) => {
  const date = parseDate(dateString);
  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Parse YYYY-MM-DD string to Date object
 */
export const parseDate = (dateString) => {
  return new Date(dateString + 'T00:00:00');
};

/**
 * Get start and end dates for a period
 */
export const getPeriodDates = (period, referenceDate = new Date()) => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      break;

    case 'weekly':
      // Start of week (Monday)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.getFullYear(), today.getMonth(), diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;

    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;

    case 'quarterly':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      break;

    case 'yearly':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;

    default:
      startDate = new Date(today);
      endDate = new Date(today);
  }

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

/**
 * Filter entries by date range
 */
export const filterEntriesByPeriod = (entries, period, referenceDate) => {
  const { start, end } = getPeriodDates(period, referenceDate);
  return entries.filter(entry => {
    return entry.date >= start && entry.date <= end;
  });
};

/**
 * Filter entries by custom date range
 */
export const filterEntriesByDateRange = (entries, startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return entries.filter(entry => {
    return entry.date >= start && entry.date <= end;
  });
};

/**
 * Calculate totals from entries
 */
export const calculateTotals = (entries) => {
  const totals = entries.reduce(
    (acc, entry) => {
      if (entry.type === 'expense') {
        acc.expense += parseFloat(entry.amount) || 0;
      } else {
        acc.income += parseFloat(entry.amount) || 0;
      }
      return acc;
    },
    { expense: 0, income: 0 }
  );

  totals.balance = totals.income - totals.expense;
  return totals;
};


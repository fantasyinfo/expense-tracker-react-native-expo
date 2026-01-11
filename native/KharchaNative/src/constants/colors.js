/**
 * Color Constants for the Expense Tracker App
 * Maintains consistent color scheme across all screens and components
 */

export const Colors = {
  // Background Colors
  background: {
    primary: '#0A0A0A',      // Main app background
    secondary: '#1a1a1a',   // Card backgrounds, secondary surfaces
    tertiary: '#222',        // Borders, dividers
    modal: '#1a1a1a',       // Modal backgrounds
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlays
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',     // Main text
    secondary: '#888',       // Secondary text
    tertiary: '#666',        // Tertiary text, placeholders
    disabled: '#444',        // Disabled text
  },

  // Accent Colors
  accent: {
    primary: '#667eea',     // Primary accent (purple)
    secondary: '#764ba2',   // Secondary accent (purple gradient)
    gradient: {
      positive: ['#667eea', '#764ba2'],  // Positive balance gradient
      negative: ['#f093fb', '#f5576c'],  // Negative balance gradient
    },
  },

  // Status Colors
  status: {
    expense: '#FF6B6B',     // Expense color (red)
    income: '#51CF66',      // Income color (green)
    adjustment: '#FF9800',   // Balance adjustment (orange)
    warning: '#FFD43B',      // Warning (yellow)
    info: '#4DABF7',         // Info (blue)
  },

  // Payment Method Colors
  payment: {
    upi: '#4DABF7',         // UPI (blue)
    cash: '#FFD43B',        // Cash (yellow)
  },

  // Icon Background Colors (with opacity)
  iconBackground: {
    expense: 'rgba(255, 107, 107, 0.15)',
    income: 'rgba(81, 207, 102, 0.15)',
    adjustment: 'rgba(255, 152, 0, 0.15)',
    upi: 'rgba(77, 171, 247, 0.15)',
    cash: 'rgba(255, 212, 59, 0.15)',
  },

  // Border Colors
  border: {
    primary: '#222',        // Main borders
    secondary: '#1a1a1a',   // Secondary borders
    light: 'rgba(255,255,255,0.15)', // Light borders (on gradients)
  },

  // Button Colors
  button: {
    primary: '#667eea',     // Primary button
    secondary: '#222',      // Secondary button
    danger: '#FF6B6B',      // Danger button
    success: '#51CF66',     // Success button
  },

  // Tab Bar Colors
  tabBar: {
    background: '#0A0A0A',
    border: '#1a1a1a',
    active: '#667eea',
    inactive: '#666',
  },

  // Chart Colors
  chart: {
    background: '#1a1a1a',
    expense: '#FF6B6B',
    income: '#51CF66',
    grid: '#222',
    text: '#888',
  },
};

export default Colors;

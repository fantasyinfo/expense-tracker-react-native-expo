import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDateWithMonthName, formatDateShort, calculateTotals, formatCurrency } from '../utils/dateUtils';
import { loadCategories } from '../utils/categoryStorage';
import Colors from '../constants/colors';
import { useCurrency } from '../context/CurrencyContext';

const EntriesReportModal = ({ visible, entries, onClose, onEdit, onDuplicate, onDelete, title = 'Entries Report' }) => {
  const { currency } = useCurrency();
  const [categories, setCategories] = useState([]);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedEntryForMenu, setSelectedEntryForMenu] = useState(null);

  useEffect(() => {
    if (visible) {
      loadCategories().then(setCategories);
    }
  }, [visible]);

  const handleMenuAction = (action, entry) => {
    setActionMenuVisible(false);
    setSelectedEntryForMenu(null);
    if (action === 'edit' && onEdit) {
      onEdit(entry);
    } else if (action === 'duplicate' && onDuplicate) {
      onDuplicate(entry);
    } else if (action === 'delete' && onDelete) {
      onDelete(entry);
    }
  };
  const groupedEntries = useMemo(() => {
    const grouped = {};
    entries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    sortedDates.forEach(date => {
      grouped[date].sort((a, b) => parseInt(b.id) - parseInt(a.id));
    });

    return sortedDates.map(date => ({
      date,
      entries: grouped[date],
      totals: calculateTotals(grouped[date]),
    }));
  }, [entries]);

  const renderEntry = (entry) => {
    const isBalanceAdjustment = entry.type === 'balance_adjustment';
    const isCashWithdrawal = entry.type === 'cash_withdrawal';
    const isCashDeposit = entry.type === 'cash_deposit';
    const adjustmentIsAdd = isBalanceAdjustment ? (entry.adjustment_type === 'add' || !entry.adjustment_type) : false;
    
    // Get category for this entry
    const category = entry.category_id ? categories.find(cat => cat.id === entry.category_id) : null;
    
    return (
      <View style={styles.transactionCard} key={entry.id}>
        <View style={styles.transactionLeft}>
          {category ? (
            <View style={[styles.transactionIconContainer, { backgroundColor: `${category.color}20` }]}>
              <Ionicons
                name={category.icon}
                size={18}
                color={category.color}
              />
            </View>
          ) : (
            <View style={[
              styles.transactionIconContainer,
              isCashWithdrawal || isCashDeposit
                ? (isCashWithdrawal ? styles.transactionIconWithdrawal : styles.transactionIconDeposit)
                : (isBalanceAdjustment 
                    ? styles.transactionIconAdjustment
                    : (entry.type === 'expense' ? styles.transactionIconExpense : styles.transactionIconIncome))
            ]}>
              <Ionicons
                name={
                  isCashWithdrawal || isCashDeposit
                    ? 'swap-horizontal'
                    : (isBalanceAdjustment 
                        ? (adjustmentIsAdd ? 'add-circle' : 'remove-circle')
                        : (entry.type === 'expense' ? 'arrow-down' : 'arrow-up'))
                }
                size={18}
                color="#FFFFFF"
              />
            </View>
          )}
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionNote} numberOfLines={1}>
              {entry.note || (isCashWithdrawal ? 'Cash Withdrawal' : (isCashDeposit ? 'Cash Deposit' : (isBalanceAdjustment ? 'Balance Adjustment' : (entry.type === 'expense' ? 'Expense' : 'Income'))))}
            </Text>
            <View style={styles.transactionMeta}>
              <View style={styles.transactionMetaLeft}>
                <Text style={styles.transactionDate}>{formatDateShort(entry.date)}</Text>
                {category && (
                  <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon} size={10} color={category.color} />
                    <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <View style={styles.transactionRightTop}>
            {isCashWithdrawal ? (
              <View style={styles.transactionModeContainer}>
                <View style={styles.transactionMode}>
                  <Ionicons name="phone-portrait" size={14} color={Colors.payment.upi} />
                </View>
                <Text style={styles.transactionModeText}>→</Text>
                <View style={styles.transactionMode}>
                  <Ionicons name="cash" size={14} color={Colors.payment.cash} />
                </View>
              </View>
            ) : isCashDeposit ? (
              <View style={styles.transactionModeContainer}>
                <View style={styles.transactionMode}>
                  <Ionicons name="cash" size={14} color={Colors.payment.cash} />
                </View>
                <Text style={styles.transactionModeText}>→</Text>
                <View style={styles.transactionMode}>
                  <Ionicons name="phone-portrait" size={14} color={Colors.payment.upi} />
                </View>
              </View>
            ) : (
              <View style={styles.transactionMode}>
                <Ionicons
                  name={(entry.mode || 'upi') === 'upi' ? 'phone-portrait' : 'cash'}
                  size={14}
                  color={(entry.mode || 'upi') === 'upi' ? Colors.payment.upi : Colors.payment.cash}
                />
              </View>
            )}
            <Text style={[
              styles.transactionAmount,
              isCashWithdrawal || isCashDeposit
                ? (isCashWithdrawal ? styles.transactionAmountWithdrawal : styles.transactionAmountDeposit)
                : (isBalanceAdjustment 
                    ? styles.transactionAmountAdjustment
                    : (entry.type === 'expense' ? styles.transactionAmountExpense : styles.transactionAmountIncome))
            ]}>
              {isCashWithdrawal || isCashDeposit || isBalanceAdjustment
                ? (isCashWithdrawal || isCashDeposit ? '' : (adjustmentIsAdd ? '+' : '-'))
                : (entry.type === 'expense' ? '-' : '+')
              }{currency.symbol}{formatCurrency(entry.amount)}
            </Text>
          </View>
          {(onEdit || onDuplicate || onDelete) && (
            <TouchableOpacity
              onPress={() => {
                setSelectedEntryForMenu(entry);
                setActionMenuVisible(true);
              }}
              style={styles.transactionMoreButton}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const overallTotals = useMemo(() => calculateTotals(entries), [entries]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {entries.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Overall Summary</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: Colors.iconBackground.expense }]}>
                      <Ionicons name="arrow-down" size={20} color={Colors.status.expense} />
                    </View>
                    <Text style={styles.summaryLabel}>Expense</Text>
                    <Text 
                      style={[styles.summaryValue, styles.expenseAmount]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {currency.symbol}{formatCurrency(overallTotals.expense)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: Colors.iconBackground.income }]}>
                      <Ionicons name="arrow-up" size={20} color={Colors.status.income} />
                    </View>
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text 
                      style={[styles.summaryValue, styles.incomeAmount]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {currency.symbol}{formatCurrency(overallTotals.income)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { 
                      backgroundColor: overallTotals.balance >= 0 
                        ? Colors.iconBackground.income 
                        : Colors.iconBackground.expense 
                    }]}>
                      <Ionicons 
                        name={overallTotals.balance >= 0 ? 'trending-up' : 'trending-down'} 
                        size={20} 
                        color={overallTotals.balance >= 0 ? Colors.status.income : Colors.status.expense} 
                      />
                    </View>
                    <Text style={styles.summaryLabel}>Balance</Text>
                    <Text 
                      style={[
                        styles.summaryValue,
                        overallTotals.balance >= 0 ? styles.incomeAmount : styles.expenseAmount
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {currency.symbol}{formatCurrency(overallTotals.balance)}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentBreakdown}>
                  <Text style={styles.breakdownTitle}>Payment Method Breakdown</Text>
                  
                  <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownSectionTitle}>Expense</Text>
                    <View style={styles.breakdownRow}>
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownIconContainer, { backgroundColor: Colors.iconBackground.upi }]}>
                          <Ionicons name="phone-portrait" size={16} color={Colors.payment.upi} />
                        </View>
                        <Text style={styles.breakdownLabel}>UPI</Text>
                        <Text 
                          style={styles.breakdownValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.8}
                        >
                          {currency.symbol}{formatCurrency(overallTotals.expenseUpi || 0)}
                        </Text>
                      </View>
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownIconContainer, { backgroundColor: Colors.iconBackground.cash }]}>
                          <Ionicons name="cash" size={16} color={Colors.payment.cash} />
                        </View>
                        <Text style={styles.breakdownLabel}>Cash</Text>
                        <Text 
                          style={styles.breakdownValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.8}
                        >
                          {currency.symbol}{formatCurrency(overallTotals.expenseCash || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.breakdownSection}>
                    <Text style={styles.breakdownSectionTitle}>Income</Text>
                    <View style={styles.breakdownRow}>
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownIconContainer, { backgroundColor: Colors.iconBackground.upi }]}>
                          <Ionicons name="phone-portrait" size={16} color={Colors.payment.upi} />
                        </View>
                        <Text style={styles.breakdownLabel}>UPI</Text>
                        <Text 
                          style={styles.breakdownValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.8}
                        >
                          {currency.symbol}{formatCurrency(overallTotals.incomeUpi || 0)}
                        </Text>
                      </View>
                      <View style={styles.breakdownItem}>
                        <View style={[styles.breakdownIconContainer, { backgroundColor: Colors.iconBackground.cash }]}>
                          <Ionicons name="cash" size={16} color={Colors.payment.cash} />
                        </View>
                        <Text style={styles.breakdownLabel}>Cash</Text>
                        <Text 
                          style={styles.breakdownValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.8}
                        >
                          {currency.symbol}{formatCurrency(overallTotals.incomeCash || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {groupedEntries.length > 0 ? (
              <View style={styles.entriesListContainer}>
                {groupedEntries.map((item) => (
                  <View key={item.date} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                      <View style={styles.dateHeaderLeft}>
                        <View style={styles.dateIconContainer}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.accent.primary} />
                        </View>
                        <Text style={styles.dateText}>{formatDateWithMonthName(item.date)}</Text>
                      </View>
                      <View style={styles.dateTotals}>
                        <View style={styles.dateTotalBadge}>
                          <Ionicons name="arrow-down" size={12} color={Colors.status.expense} />
                          <Text style={[styles.dateTotalText, { color: Colors.status.expense }]}>
                            {currency.symbol}{formatCurrency(item.totals.expense)}
                          </Text>
                        </View>
                        <View style={styles.dateTotalBadge}>
                          <Ionicons name="arrow-up" size={12} color={Colors.status.income} />
                          <Text style={[styles.dateTotalText, { color: Colors.status.income }]}>
                            {currency.symbol}{formatCurrency(item.totals.income)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.entriesContainer}>
                      {item.entries.map(renderEntry)}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="document-outline" size={56} color={Colors.text.tertiary} />
                </View>
                <Text style={styles.emptyText}>No entries found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setActionMenuVisible(false);
          setSelectedEntryForMenu(null);
        }}
      >
        <TouchableOpacity
          style={styles.actionMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setActionMenuVisible(false);
            setSelectedEntryForMenu(null);
          }}
        >
          <View style={styles.actionMenuContainer}>
            {onEdit && selectedEntryForMenu && 
             selectedEntryForMenu.type !== 'cash_withdrawal' && 
             selectedEntryForMenu.type !== 'cash_deposit' && 
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handleMenuAction('edit', selectedEntryForMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.actionMenuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDuplicate && selectedEntryForMenu && 
             selectedEntryForMenu.type !== 'cash_withdrawal' && 
             selectedEntryForMenu.type !== 'cash_deposit' && 
             selectedEntryForMenu.type !== 'balance_adjustment' && (
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handleMenuAction('duplicate', selectedEntryForMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.actionMenuText}>Duplicate</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionMenuItem, styles.actionMenuItemDanger]}
                onPress={() => handleMenuAction('delete', selectedEntryForMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.actionMenuText, styles.actionMenuTextDanger]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.modal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: Colors.background.secondary,
    margin: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  expenseAmount: {
    color: Colors.status.expense,
  },
  incomeAmount: {
    color: Colors.status.income,
  },
  paymentBreakdown: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  breakdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  entriesListContainer: {
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginBottom: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.iconBackground.upi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dateTotals: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTotalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  dateTotalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  entriesContainer: {
    padding: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    alignItems: 'center',
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionIconExpense: {
    backgroundColor: Colors.iconBackground.expense,
  },
  transactionIconIncome: {
    backgroundColor: Colors.iconBackground.income,
  },
  transactionIconAdjustment: {
    backgroundColor: Colors.iconBackground.adjustment,
  },
  transactionIconWithdrawal: {
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
  },
  transactionIconDeposit: {
    backgroundColor: 'rgba(81, 207, 102, 0.15)',
  },
  transactionModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionModeText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  transactionNote: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  transactionMode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  transactionModeText: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginHorizontal: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  transactionRightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  transactionMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 12,
  },
  actionMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    marginTop: 4,
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  actionMenuTextDanger: {
    color: '#FF6B6B',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionAmountExpense: {
    color: Colors.status.expense,
  },
  transactionAmountIncome: {
    color: Colors.status.income,
  },
  transactionAmountAdjustment: {
    color: Colors.status.adjustment,
  },
  transactionAmountWithdrawal: {
    color: '#4DABF7',
  },
  transactionAmountDeposit: {
    color: '#51CF66',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

export default EntriesReportModal;

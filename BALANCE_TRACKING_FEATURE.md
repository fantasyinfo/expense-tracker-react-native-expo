# Balance Tracking Feature - Design Options

## Understanding Income vs Balance

### Income
**Income** represents **newly earned money** - money that comes from external sources like:
- Salary
- Business revenue
- Freelance payments
- Investment returns
- Gifts (if you consider them income)

### Balance Adjustments
**Balance Adjustments** represent **movement of your existing money** - not new income, but changes to your current holdings:
- Borrowing money from someone (wife, friend, family)
- Lending money to someone
- Transferring money between your own accounts (bank to cash, or vice versa)
- Correcting errors in your balance
- Finding money you forgot about

**Key Difference**: Income increases your net worth. Balance adjustments just move money around or correct your records - they don't change your net worth.

---

## Current App Structure

Currently, the app tracks:
- **Entries** with: `id`, `amount`, `note`, `type` ('expense' | 'income'), `mode` ('upi' | 'cash'), `date`
- **Totals**: Expense, Income, Net Balance (Income - Expense)
- Payment method breakdown (UPI vs Cash) for expenses and income

**Limitation**: The app doesn't track actual bank/cash balances. It only shows transaction totals, not your current available balance.

---

## Design Options

### Option 1: Balance Tracking with Separate Balance Adjustments (RECOMMENDED)

#### Concept
- Store initial bank balance and cash balance as separate values
- Track balance changes automatically through transactions
- Add a new entry type: **"Balance Adjustment"** (separate from income/expense)
- Income increases the respective balance (bank or cash)
- Expenses decrease the respective balance (bank or cash)
- Balance adjustments modify balance without affecting income/expense totals

#### Data Model Changes
```javascript
// New storage keys
'@expense_tracker_bank_balance'  // Current bank balance
'@expense_tracker_cash_balance'  // Current cash balance

// Entry types expanded
type: 'expense' | 'income' | 'balance_adjustment'

// Balance adjustment entries
{
  id: string,
  amount: number,
  note: string,
  type: 'balance_adjustment',
  mode: 'upi' | 'cash',  // Which balance to adjust
  adjustment_type: 'add' | 'subtract',  // Add or subtract from balance
  date: string
}
```

#### How It Works
1. **Initial Setup**: User sets starting bank balance (e.g., ₹9,000) and cash balance (e.g., ₹1,200)
2. **Income Entry**: 
   - User adds income of ₹5,000 via UPI
   - Bank balance increases: ₹9,000 → ₹14,000
   - Income total increases by ₹5,000
3. **Expense Entry**:
   - User adds expense of ₹500 via UPI
   - Bank balance decreases: ₹14,000 → ₹13,500
   - Expense total increases by ₹500
4. **Balance Adjustment** (e.g., borrowing from wife):
   - User adds balance adjustment: +₹2,000 via UPI
   - Bank balance increases: ₹13,500 → ₹15,500
   - **Income total does NOT change** (this is not income)
   - Note: "Borrowed from wife"
5. **Transfer Between Accounts**:
   - User withdraws ₹1,000 cash from bank
   - Creates two balance adjustments:
     - Bank: -₹1,000
     - Cash: +₹1,000
   - Or a single "transfer" entry that handles both

#### UI Changes
- **Home Screen**: Show current bank balance and cash balance prominently
- **Add Entry Modal**: 
  - Add third option: "Balance Adjustment" (alongside Expense/Income)
  - For balance adjustments, show toggle: "Add to Balance" / "Subtract from Balance"
- **Settings Screen**: Add option to set/modify initial balances
- **Summary Screen**: Show balance history or balance changes over time

#### Pros
✅ Clear separation between income and balance adjustments
✅ Accurate real-time balance tracking
✅ Simple to understand and use
✅ Maintains existing income/expense reporting
✅ Handles all use cases (borrowing, transfers, corrections)

#### Cons
⚠️ Need to handle edge cases (negative balances, transfers)
⚠️ Initial setup required (user must enter starting balances)
⚠️ If user deletes old entries, balance might become incorrect (need to recalculate)

---

### Option 2: Account-Based System

#### Concept
- Treat bank and cash as separate "accounts"
- Each account has its own balance
- All transactions are account-specific
- Income and expenses are always tied to an account
- Balance adjustments are just another transaction type

#### Data Model Changes
```javascript
// Account structure
{
  id: 'bank',
  name: 'Bank Account',
  balance: 9000,
  type: 'bank'
},
{
  id: 'cash',
  name: 'Cash',
  balance: 1200,
  type: 'cash'
}

// Entries reference account
{
  id: string,
  account_id: 'bank' | 'cash',
  amount: number,
  note: string,
  type: 'expense' | 'income' | 'transfer' | 'adjustment',
  date: string,
  // For transfers
  to_account_id?: 'bank' | 'cash'
}
```

#### How It Works
- Every entry must specify which account it affects
- Transfers between accounts are a single entry type
- Balance is calculated per account
- Income/expense totals can be filtered by account

#### Pros
✅ More flexible (can add more accounts later)
✅ Clear account separation
✅ Natural handling of transfers

#### Cons
⚠️ More complex data model
⚠️ Requires significant refactoring
⚠️ Might be overkill for simple use case
⚠️ UI becomes more complex

---

### Option 3: Hybrid Approach (Simpler Version)

#### Concept
- Keep current income/expense system as-is
- Add separate balance tracking that syncs with transactions
- Balance adjustments are a special type of entry that only affects balance
- Income/expense reports remain unchanged

#### Data Model Changes
```javascript
// Simple balance storage
'@expense_tracker_bank_balance'
'@expense_tracker_cash_balance'

// Entry type addition
type: 'expense' | 'income' | 'adjustment'

// Adjustment entries
{
  id: string,
  amount: number,
  note: string,
  type: 'adjustment',
  mode: 'upi' | 'cash',
  is_positive: boolean,  // true = add, false = subtract
  date: string
}
```

#### How It Works
- Similar to Option 1, but simpler
- Balance adjustments don't appear in income/expense totals
- Balance is recalculated from all entries (income, expense, adjustments)
- Initial balance is set once, then all changes are tracked

#### Pros
✅ Minimal changes to existing code
✅ Simple to implement
✅ Clear separation

#### Cons
⚠️ Less flexible than Option 1
⚠️ Transfers between accounts need two separate adjustment entries

---

## Recommendation: Option 1 (Balance Tracking with Separate Balance Adjustments)

### Why Option 1?
1. **Clear Concept**: Users understand the difference between income and balance adjustments
2. **Accurate Tracking**: Real-time balance updates as transactions happen
3. **Complete Solution**: Handles all scenarios (borrowing, transfers, corrections)
4. **Maintains Existing Features**: Doesn't break current income/expense reporting
5. **User-Friendly**: Simple mental model - "I have X in bank, Y in cash"

### Implementation Considerations

#### 1. Initial Balance Setup
- **First Launch**: Prompt user to enter starting bank and cash balances
- **Settings Screen**: Allow user to modify balances manually (with note/confirmation)
- **Migration**: For existing users, calculate initial balance from all historical entries

#### 2. Balance Calculation Logic
```javascript
// Calculate current balance from all entries
function calculateCurrentBalance(initialBalance, entries, mode) {
  return entries.reduce((balance, entry) => {
    if (entry.mode !== mode) return balance;
    
    if (entry.type === 'income') {
      return balance + entry.amount;
    } else if (entry.type === 'expense') {
      return balance - entry.amount;
    } else if (entry.type === 'balance_adjustment') {
      return entry.adjustment_type === 'add' 
        ? balance + entry.amount 
        : balance - entry.amount;
    }
    return balance;
  }, initialBalance);
}
```

#### 3. Handling Edge Cases
- **Negative Balances**: Allow but show warning (red color, alert icon)
- **Deleting Entries**: Recalculate balance when entry is deleted
- **Editing Entries**: Recalculate balance when entry is modified
- **Transfers**: Option to create transfer entry (subtracts from one, adds to other)

#### 4. UI/UX Enhancements
- **Home Screen Cards**: Add two new cards showing Bank Balance and Cash Balance
- **Balance Warnings**: Show visual warning if balance goes negative
- **Balance History**: Optional chart showing balance over time
- **Quick Balance Update**: Easy way to adjust balance if it gets out of sync

#### 5. Data Migration
For existing users:
```javascript
// Calculate initial balances from all past entries
const allEntries = await loadEntries();
const initialBankBalance = calculateBalanceFromEntries(allEntries, 'upi');
const initialCashBalance = calculateBalanceFromEntries(allEntries, 'cash');
// Save these as starting balances
```

---

## Alternative: Simplified Option 3

If you want a **quicker implementation** with less complexity, Option 3 is also viable:
- Add balance tracking
- Add "Adjustment" entry type
- Keep everything else the same
- Simpler UI (no transfer feature initially)

You can always enhance it later to Option 1 if needed.

---

## Questions to Consider

1. **Do you want to track balance history?** (See balance changes over time in a chart)
2. **Should transfers be a single entry or two separate entries?** (Single is cleaner UX)
3. **What happens if balance goes negative?** (Allow it with warning, or prevent it?)
4. **Should balance adjustments appear in reports?** (Probably not in income/expense totals, but maybe in a separate section)
5. **Do you want to track multiple bank accounts?** (If yes, Option 2 might be better long-term)

---

## Next Steps

Once you decide on an option, the implementation would involve:

1. **Storage Layer** (`src/utils/storage.js`):
   - Add functions to save/load balances
   - Add functions to update balance when entries are added/deleted/modified

2. **Entry Model** (`src/components/AddEntryModal.js`):
   - Add "Balance Adjustment" type option
   - Add adjustment type toggle (add/subtract)

3. **Balance Calculation** (`src/utils/balanceUtils.js` - new file):
   - Calculate current balances from entries
   - Handle balance updates

4. **UI Updates**:
   - Home screen: Show balance cards
   - Settings: Initial balance setup
   - Summary: Balance information

5. **Migration**:
   - Handle existing users' data
   - Calculate initial balances from history

---

## Summary

**Recommended Approach**: Option 1 - Balance Tracking with Separate Balance Adjustments

This provides:
- ✅ Clear distinction between income and balance adjustments
- ✅ Real-time balance tracking
- ✅ Handles all use cases (borrowing, transfers, corrections)
- ✅ Maintains existing income/expense features
- ✅ User-friendly and intuitive

The key insight: **Income = new money earned. Balance Adjustment = moving existing money around.**

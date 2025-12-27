# Category Feature Documentation

## Overview

The Category feature allows users to categorize their expenses and income transactions for better organization, filtering, and analysis. This feature includes default categories, custom category support, category-wise filtering, and category-based charts.

## Table of Contents

1. [Features](#features)
2. [Default Categories](#default-categories)
3. [Category Management](#category-management)
4. [Using Categories](#using-categories)
5. [Filtering by Category](#filtering-by-category)
6. [Category Charts](#category-charts)
7. [Export/Import with Categories](#exportimport-with-categories)
8. [Technical Implementation](#technical-implementation)
9. [API Reference](#api-reference)

---

## Features

### ✅ Implemented Features

- **Default Categories**: 50+ pre-defined categories covering common expense and income types
- **Category Selection**: Easy-to-use horizontal scrollable category picker in Add Entry Modal
- **Visual Indicators**: Each category has a unique icon and color for easy identification
- **Type-Specific Categories**: Categories are filtered by transaction type (expense/income)
- **Export/Import Support**: Categories are included in CSV and JSON exports/imports
- **Backward Compatibility**: Import supports both old format (without categories) and new format (with categories)

### 🔄 Future Enhancements (Not Yet Implemented)

- Category filtering in HomeScreen and SummaryScreen
- Category-wise charts and analytics
- Custom category creation UI
- Category editing and deletion
- Category statistics and insights

---

## Default Categories

The app comes with 50+ default categories organized into the following groups:

### Food & Dining (4 categories)
- **Groceries** 🛒 - Daily grocery shopping
- **Restaurant** 🍽️ - Dining at restaurants
- **Food Delivery** 🍕 - Online food orders
- **Coffee & Tea** ☕ - Beverages and snacks

### Transportation (4 categories)
- **Fuel** ⛽ - Gas/petrol expenses
- **Taxi/Ride** 🚕 - Ride-sharing services
- **Public Transport** 🚌 - Buses, trains, metro
- **Parking** 🅿️ - Parking fees

### Shopping (4 categories)
- **Clothing** 👕 - Apparel and accessories
- **Electronics** 📱 - Gadgets and devices
- **Online Shopping** 🛍️ - E-commerce purchases
- **Shopping Other** 🏪 - Other shopping expenses

### Bills & Utilities (6 categories)
- **Electricity** ⚡ - Power bills
- **Water** 💧 - Water supply bills
- **Internet** 📶 - Internet/ISP bills
- **Phone Bill** 📞 - Mobile/landline bills
- **Rent** 🏠 - Housing rent
- **Insurance** 🛡️ - Insurance premiums

### Entertainment (4 categories)
- **Movies** 🎬 - Cinema tickets
- **Games** 🎮 - Video games and gaming
- **Music/Streaming** 🎵 - Music and streaming services
- **Sports** ⚽ - Sports activities

### Health & Fitness (3 categories)
- **Medicine** 💊 - Medications and pharmacy
- **Gym/Fitness** 💪 - Gym memberships and fitness
- **Doctor** 👨‍⚕️ - Medical consultations

### Education (3 categories)
- **Books** 📚 - Educational books
- **Courses** 🎓 - Online/offline courses
- **Tuition** 📖 - Tuition fees

### Personal Care (3 categories)
- **Haircut** ✂️ - Haircuts and grooming
- **Beauty & Spa** 💅 - Beauty treatments and spa
- **Laundry** 👔 - Laundry services

### Travel (3 categories)
- **Flight** ✈️ - Air travel
- **Hotel** 🛏️ - Hotel accommodations
- **Travel Food** 🍴 - Food during travel

### Income Categories (6 categories)
- **Salary** 💰 - Monthly salary
- **Freelance** 💼 - Freelance work income
- **Business** 🏢 - Business income
- **Investment** 📈 - Investment returns
- **Gift** 🎁 - Gifts received
- **Other Income** 💵 - Other income sources

### Other (1 category)
- **General** ⚪ - Uncategorized transactions

---

## Category Management

### Category Storage

Categories are stored in AsyncStorage with the key `@expense_tracker_categories`. The storage system:

- **Preserves Default Categories**: Default categories cannot be deleted or modified
- **Supports Custom Categories**: Users can add custom categories (UI pending)
- **Auto-Initialization**: Default categories are automatically created on first use

### Category Structure

Each category has the following properties:

```javascript
{
  id: 'food_groceries',           // Unique identifier
  name: 'Groceries',              // Display name
  icon: 'cart-outline',           // Ionicons icon name
  color: '#4CAF50',               // Hex color code
  type: 'expense'                 // 'expense' or 'income'
}
```

---

## Using Categories

### Adding a Category to a Transaction

1. Open the **Add Entry** modal (tap the + button)
2. Select transaction type (Expense or Income)
3. Scroll through the **Category** section (horizontal scrollable list)
4. Tap on a category to select it
5. Selected category will be highlighted with its color
6. Tap again to deselect (optional)
7. Fill in amount, note, and other details
8. Save the entry

### Category Selection UI

- **Horizontal Scrollable**: Categories are displayed in a horizontal scrollable list
- **Visual Feedback**: Selected category is highlighted with its color
- **Icon + Name**: Each category shows an icon and name
- **Type Filtering**: Only shows categories matching the selected transaction type
- **Optional**: Category selection is optional - transactions can be saved without a category

### Editing Category

When editing an existing transaction:
- The previously selected category is automatically pre-selected
- You can change or remove the category
- Changes are saved when you update the entry

---

## Filtering by Category

### Current Status

Category filtering UI is **pending implementation**. The following features are planned:

- Filter transactions by category in HomeScreen
- Filter transactions by category in SummaryScreen
- Category filter dropdown/selector
- Multiple category selection
- "All Categories" option

### Implementation Plan

1. Add category filter dropdown in HomeScreen
2. Add category filter in SummaryScreen
3. Update entry filtering logic to include category
4. Add "Clear Category Filter" option

---

## Category Charts

### Current Status

Category-wise charts are **pending implementation**. The following visualizations are planned:

- **Pie Chart**: Expense distribution by category
- **Bar Chart**: Category-wise spending comparison
- **Trend Chart**: Category spending over time
- **Top Categories**: Most used/spent categories

### Implementation Plan

1. Create category aggregation utility
2. Add category chart component
3. Integrate charts in SummaryScreen
4. Add chart type selector (pie/bar/line)

---

## Export/Import with Categories

### Export Format

#### CSV Export

The CSV export now includes a **Category** column:

```csv
Date,Type,Amount,Payment Method,Category,Note
15/01/2024,Expense,500.00,UPI,food_groceries,Grocery shopping
16/01/2024,Income,5000.00,UPI,income_salary,Monthly salary
```

#### JSON Export

JSON export includes `category_id` field:

```json
{
  "id": "1234567890",
  "amount": 500,
  "note": "Grocery shopping",
  "type": "expense",
  "mode": "upi",
  "date": "2024-01-15",
  "category_id": "food_groceries"
}
```

### Import Format

The import utility supports both formats:

1. **New Format** (with Category):
   ```csv
   Date,Type,Amount,Payment Method,Category,Note
   ```

2. **Old Format** (without Category):
   ```csv
   Date,Type,Amount,Payment Method,Note
   ```

When importing:
- If category column exists, it's imported
- If category column is missing, `category_id` is set to `undefined`
- Invalid category IDs are preserved but may not display correctly

### Backward Compatibility

- Old exports (without categories) can still be imported
- New exports (with categories) can be imported into older app versions (category will be ignored)
- Category data is preserved during import/export cycles

---

## Technical Implementation

### File Structure

```
src/
├── utils/
│   ├── categoryStorage.js      # Category storage utilities
│   ├── exportUtils.js          # Export with categories
│   └── importUtils.js          # Import with categories
├── components/
│   └── AddEntryModal.js        # Category selection UI
└── screens/
    ├── HomeScreen.js           # (Category filtering pending)
    └── SummaryScreen.js        # (Category charts pending)
```

### Key Functions

#### Category Storage (`categoryStorage.js`)

- `loadCategories()` - Load all categories
- `saveCategories(categories)` - Save categories
- `addCategory(category)` - Add custom category
- `deleteCategory(id)` - Delete custom category
- `updateCategory(id, category)` - Update category
- `getCategoryById(id)` - Get category by ID
- `getCategoriesByType(type)` - Get categories by type

#### Entry Storage

Entries now include optional `category_id` field:

```javascript
{
  id: "1234567890",
  amount: 500,
  note: "Grocery shopping",
  type: "expense",
  mode: "upi",
  date: "2024-01-15",
  category_id: "food_groceries"  // Optional
}
```

### Data Flow

1. **Adding Entry with Category**:
   - User selects category in AddEntryModal
   - `category_id` is stored with entry
   - Entry is saved to AsyncStorage

2. **Editing Entry with Category**:
   - Existing `category_id` is loaded
   - Category is pre-selected in UI
   - User can change/remove category
   - Updated entry is saved

3. **Exporting with Category**:
   - `category_id` is included in CSV/JSON
   - Category name can be resolved from category storage

4. **Importing with Category**:
   - `category_id` is parsed from CSV/JSON
   - Category is validated against available categories
   - Entry is saved with `category_id`

---

## API Reference

### Category Storage API

#### `loadCategories()`

Load all categories from storage.

```javascript
const categories = await loadCategories();
// Returns: Array of category objects
```

#### `getCategoriesByType(type)`

Get categories filtered by type.

```javascript
const expenseCategories = await getCategoriesByType('expense');
const incomeCategories = await getCategoriesByType('income');
```

#### `addCategory(category)`

Add a custom category.

```javascript
const newCategory = await addCategory({
  name: 'Custom Category',
  icon: 'star-outline',
  color: '#FF5722',
  type: 'expense'
});
```

#### `deleteCategory(id)`

Delete a custom category (cannot delete defaults).

```javascript
try {
  await deleteCategory('custom_1234567890');
} catch (error) {
  console.error('Cannot delete default category');
}
```

### Entry with Category

#### Adding Entry with Category

```javascript
import { addEntry } from '../utils/storage';

const entry = {
  amount: 500,
  note: 'Grocery shopping',
  type: 'expense',
  mode: 'upi',
  date: '2024-01-15',
  category_id: 'food_groceries'  // Optional
};

await addEntry(entry);
```

#### Getting Category for Entry

```javascript
import { getCategoryById } from '../utils/categoryStorage';

const category = await getCategoryById(entry.category_id);
if (category) {
  console.log(category.name);  // "Groceries"
  console.log(category.icon);   // "cart-outline"
  console.log(category.color);  // "#4CAF50"
}
```

---

## Best Practices

### Category Selection

1. **Be Consistent**: Use the same category for similar transactions
2. **Use Specific Categories**: Choose the most specific category available
3. **Use "General" Sparingly**: Only use "General" when no other category fits
4. **Review Regularly**: Periodically review uncategorized transactions

### Category Management

1. **Don't Over-Categorize**: Too many categories can be overwhelming
2. **Use Defaults First**: Try default categories before creating custom ones
3. **Group Similar Transactions**: Use categories to group related expenses
4. **Track Trends**: Use categories to identify spending patterns

### Export/Import

1. **Backup Regularly**: Export data regularly to preserve category information
2. **Verify After Import**: Check that categories are correctly imported
3. **Use JSON for Backup**: JSON format preserves all data including categories
4. **CSV for Analysis**: Use CSV format for spreadsheet analysis

---

## Troubleshooting

### Category Not Showing

- **Check Transaction Type**: Categories are filtered by type (expense/income)
- **Verify Category Exists**: Ensure category is in the default list
- **Reload Categories**: Try closing and reopening the modal

### Category Not Saving

- **Check Entry Save**: Verify the entry itself is saving correctly
- **Check Category ID**: Ensure `category_id` matches a valid category
- **Verify Storage**: Check AsyncStorage for category data

### Import Issues

- **Format Compatibility**: Ensure CSV matches expected format
- **Category Validation**: Invalid category IDs are preserved but may not display
- **Missing Categories**: Old exports without categories will import without category

---

## Future Enhancements

### Planned Features

1. **Category Filtering UI**
   - Dropdown selector in HomeScreen
   - Multi-select category filter
   - "All Categories" option

2. **Category Charts**
   - Pie chart for expense distribution
   - Bar chart for category comparison
   - Trend analysis by category

3. **Category Management UI**
   - Add custom categories
   - Edit custom categories
   - Delete custom categories
   - Category icons and colors picker

4. **Category Insights**
   - Top spending categories
   - Category-wise trends
   - Budget by category
   - Category alerts

5. **Category Templates**
   - Quick add with category
   - Category-based templates
   - Smart category suggestions

---

## Support

For issues or questions about the Category feature:

1. Check this documentation
2. Review the code comments
3. Check the console logs for debugging information
4. Verify category storage in AsyncStorage

---

## Version History

- **v1.0.0** (Current)
  - Initial category feature implementation
  - 50+ default categories
  - Category selection in Add Entry Modal
  - Export/Import with categories
  - Backward compatibility support

---

**Last Updated**: January 2024


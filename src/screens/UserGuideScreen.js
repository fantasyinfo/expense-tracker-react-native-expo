import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UserGuideScreen = ({ visible, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef(null);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const scrollToSection = (sectionId) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1) {
      // Expand the section if collapsed
      if (!expandedSections[sectionId]) {
        toggleSection(sectionId);
      }
      // Wait a bit for the section to expand, then scroll
      setTimeout(() => {
        if (scrollViewRef.current) {
          // Calculate approximate position: TOC (200px) + each section (~300-400px)
          const tocHeight = 200;
          const sectionHeight = 350;
          const estimatedPosition = tocHeight + (sectionIndex * sectionHeight);
          scrollViewRef.current.scrollTo({ y: estimatedPosition, animated: true });
        }
      }, 100);
    }
  };

  const sections = [
    {
      id: 'getting-started',
      title: '🚀 Getting Started',
      icon: 'rocket-outline',
      content: [
        {
          type: 'subtitle',
          text: 'What is SpendOrbit?',
        },
        {
          type: 'text',
          text: 'SpendOrbit is a powerful expense and income tracking app designed for global users. It helps you track every penny you spend and earn, monitor your Digital and Cash balances separately, set savings goals, analyze spending patterns, and export your data.',
        },
        {
          type: 'subtitle',
          text: 'Why Use SpendOrbit?',
        },
        {
          type: 'list',
          items: [
            '100% Offline - Works without internet connection',
            'Dual Balance Tracking - Separate UPI and Cash balances',
            'Smart Categories - Organize expenses by category',
            'Goal Tracking - Set and achieve savings goals',
            'Visual Analytics - Beautiful charts and reports',
            'Data Export - Backup your data anytime',
            'Quick Templates - Save time with recurring expenses',
          ],
        },
      ],
    },
    {
      id: 'first-day-setup',
      title: '📅 First Day Setup',
      icon: 'calendar-outline',
      content: [
        {
          type: 'subtitle',
          text: 'Step 1: Set Your Initial Balances',
        },
        {
          type: 'text',
          text: 'Why it\'s important: Setting accurate initial balances ensures your app shows the correct amount of money you have.',
        },
        {
          type: 'steps',
          items: [
            'Open the app',
            'Tap the Settings icon (⚙️) at the bottom',
            'Scroll to Balance Management section',
            'Tap "Set Bank / UPI Balance"',
            'Enter your current UPI/Bank balance (e.g., ₹50,000)',
            'Tap "Set Cash Balance"',
            'Enter your current cash balance (e.g., ₹5,000)',
            'Tap Save',
          ],
        },
        {
          type: 'tip',
          text: 'Pro Tip: If you\'ve been tracking expenses elsewhere, use "Auto Calculate from Entries" to automatically calculate your balances from existing entries.',
        },
        {
          type: 'subtitle',
          text: 'Step 2: Set Up Your Profile',
        },
        {
          type: 'text',
          text: 'Why it\'s important: Personalizing your profile makes the app feel more yours and helps with motivation.',
        },
        {
          type: 'steps',
          items: [
            'Tap the Profile icon (👤) at the bottom',
            'Enter your name',
            'Optionally add a profile picture',
            'Save your changes',
          ],
        },
        {
          type: 'subtitle',
          text: 'Step 3: Set Your First Savings Goal',
        },
        {
          type: 'text',
          text: 'Why it\'s important: Goals give you a target to work towards and help you stay motivated.',
        },
        {
          type: 'steps',
          items: [
            'Go to Settings → Savings Goals',
            'Tap "Set Monthly Savings Goal"',
            'Enter your target (e.g., ₹10,000 per month)',
            'Save',
          ],
        },
        {
          type: 'tip',
          text: 'Pro Tip: Start with a realistic goal. You can always increase it later!',
        },
        {
          type: 'subtitle',
          text: 'Step 4: Add Your First Entry',
        },
        {
          type: 'text',
          text: 'Why it\'s important: This gets you familiar with the entry process.',
        },
        {
          type: 'steps',
          items: [
            'Tap the big + button in the center of the bottom navigation',
            'Select Expense or Income',
            'Enter the amount (e.g., ₹500)',
            'Add a note (e.g., "Lunch at restaurant")',
            'Select a category (e.g., "Food & Dining")',
            'Choose payment method (UPI or Cash)',
            'Select the date',
            'Tap Save',
          ],
        },
        {
          type: 'success',
          text: '🎉 Congratulations! You\'ve completed your first day setup.',
        },
      ],
    },
    {
      id: 'daily-usage',
      title: '📖 Daily Usage Guide',
      icon: 'today-outline',
      content: [
        {
          type: 'subtitle',
          text: 'Morning Routine (5 minutes)',
        },
        {
          type: 'text',
          text: '1. Check Today\'s Budget',
        },
        {
          type: 'list',
          items: [
            'Open the app',
            'Look at the Home screen',
            'Check your daily expense limit (if set)',
            'See how much you\'ve spent today',
          ],
        },
        {
          type: 'text',
          text: '2. Review Yesterday\'s Expenses',
        },
        {
          type: 'list',
          items: [
            'Scroll down on the Home screen',
            'Review yesterday\'s transactions',
            'Identify any unnecessary spending',
          ],
        },
        {
          type: 'subtitle',
          text: 'During the Day',
        },
        {
          type: 'text',
          text: 'Add Expenses Immediately - Don\'t wait until the end of the day. Add expenses as they happen. Use the Quick Templates for common expenses.',
        },
        {
          type: 'subtitle',
          text: 'Evening Routine (5 minutes)',
        },
        {
          type: 'text',
          text: '1. Review Today\'s Spending',
        },
        {
          type: 'list',
          items: [
            'Check the Home screen',
            'See total expenses vs. income',
            'Review your balance',
          ],
        },
        {
          type: 'text',
          text: '2. Check Goal Progress',
        },
        {
          type: 'list',
          items: [
            'Go to Goals tab',
            'See how close you are to your savings goal',
            'Check if you\'re within your expense limit',
          ],
        },
      ],
    },
    {
      id: 'home-screen',
      title: '🏠 Home Screen',
      icon: 'home-outline',
      content: [
        {
          type: 'text',
          text: 'The Home screen shows today\'s total expenses and income, current UPI and Cash balances, list of today\'s transactions, and quick access to add new entries.',
        },
        {
          type: 'subtitle',
          text: 'Key Features:',
        },
        {
          type: 'feature',
          title: 'Today\'s Summary Cards',
          description: 'Shows total expenses for today, total income for today, and your current UPI and Cash balances. Benefits: Quick overview of your financial day, instant balance check, visual representation of your money.',
        },
        {
          type: 'feature',
          title: 'Transaction List',
          description: 'Shows all transactions for today. Each transaction shows category icon and name, amount (color-coded), payment method icon, date and note. Actions: Tap three dots (⋮) for Edit, Duplicate, or Delete. Benefits: Easy transaction review, quick corrections, duplicate recurring expenses.',
        },
        {
          type: 'feature',
          title: 'Search & Filter',
          description: 'Search Bar: Search by note, amount, or date. Category Filter: Filter by category (All, Food & Dining, Transportation, etc.). Benefits: Find transactions quickly, analyze spending by category, review specific time periods.',
        },
      ],
    },
    {
      id: 'summary-screen',
      title: '📊 Summary Screen',
      icon: 'stats-chart-outline',
      content: [
        {
          type: 'text',
          text: 'The Summary screen shows financial summaries for different time periods, beautiful charts and visualizations, and detailed transaction reports.',
        },
        {
          type: 'subtitle',
          text: 'Key Features:',
        },
        {
          type: 'feature',
          title: 'Period Selection',
          description: 'Today, Weekly, Monthly, Quarterly, Yearly, or Custom Range. Benefits: Analyze spending patterns, compare different time periods, plan future expenses.',
        },
        {
          type: 'feature',
          title: 'Charts & Visualizations',
          description: 'Expense vs Income Chart: Bar chart comparing expenses and income. Monthly Breakdown Chart: Shows expenses and income over the last 6 months. Payment Method Chart: Shows UPI vs Cash usage. Category Breakdown Chart: Pie/Bar chart showing expenses by category. Benefits: Visual understanding of finances, identify spending trends, make informed decisions.',
        },
        {
          type: 'feature',
          title: 'Category Filtering',
          description: 'Filter transactions by category. See category-wise spending. Analyze specific expense types. Benefits: Focus on specific spending areas, category-wise analysis, better budget planning.',
        },
      ],
    },
    {
      id: 'goals-screen',
      title: '🎯 Goals Screen',
      icon: 'flag-outline',
      content: [
        {
          type: 'text',
          text: 'The Goals screen shows your savings goals progress, expense limits and tracking, and achievement notifications.',
        },
        {
          type: 'subtitle',
          text: 'Savings Goals',
          description: 'Types: Daily, Weekly, Monthly, Yearly, Custom. How it works: App calculates your actual savings (Income - Expenses), shows progress percentage, sends notifications when you achieve goals. Benefits: Stay motivated to save, track progress visually, achieve financial targets.',
        },
        {
          type: 'subtitle',
          text: 'Expense Limits',
          description: 'Types: Daily, Weekly, Monthly, Yearly, Custom. How it works: App tracks your expenses, shows how much you\'ve spent vs. your limit, warns you when approaching the limit. Benefits: Control spending, stay within budget, avoid overspending.',
        },
      ],
    },
    {
      id: 'adding-entries',
      title: '➕ Adding Entries',
      icon: 'add-circle-outline',
      content: [
        {
          type: 'text',
          text: 'Entry Types: Expense (money you spend), Income (money you earn), Balance Adjustment (manually adjust balance - rarely used).',
        },
        {
          type: 'subtitle',
          text: 'How to add an entry:',
        },
        {
          type: 'steps',
          items: [
            'Tap the + button (center of bottom navigation)',
            'Select Entry Type: Tap Expense for spending or Income for earnings',
            'Enter Amount: Type the amount (e.g., 500)',
            'Add Note (Optional but Recommended): Describe the transaction',
            'Select Category: Scroll through categories and tap to select',
            'Choose Payment Method: UPI for digital payments or Cash for cash transactions',
            'Select Date: Default is today\'s date, tap date to change',
            'Save: Tap Save button and entry is added immediately',
          ],
        },
        {
          type: 'subtitle',
          text: 'Quick Templates',
          description: 'Save frequently used transactions as templates for one-tap entry. How to create: Add an entry, tap "Save as Template", enter template name, save. How to use: Tap + button, scroll to "Quick Templates" section, tap a template, adjust if needed and save. Benefits: Save time, consistent entries, faster data entry.',
        },
      ],
    },
    {
      id: 'categories',
      title: '📈 Categories',
      icon: 'grid-outline',
      content: [
        {
          type: 'text',
          text: 'Categories help you organize expenses and income by type. Each category has a unique icon, color code, and name.',
        },
        {
          type: 'subtitle',
          text: 'Default Categories:',
        },
        {
          type: 'text',
          text: 'Expense Categories: Food & Dining, Transportation, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Education, Personal Care, Travel, General',
        },
        {
          type: 'text',
          text: 'Income Categories: Salary, Business, Other Income',
        },
        {
          type: 'text',
          text: 'Benefits: Organized tracking, category-wise analysis, better budgeting, visual identification.',
        },
      ],
    },
    {
      id: 'export-import',
      title: '📤 Export & Import',
      icon: 'download-outline',
      content: [
        {
          type: 'subtitle',
          text: 'Export Formats:',
        },
        {
          type: 'feature',
          title: 'Excel (CSV)',
          description: 'Spreadsheet format, opens in Excel/Google Sheets. Contains all transaction data, summary, payment breakdown. Best for: Analysis, sharing with accountant, backup.',
        },
        {
          type: 'feature',
          title: 'JSON',
          description: 'Structured data format. Contains all transaction data with metadata. Best for: Developers, data migration, backup.',
        },
        {
          type: 'feature',
          title: 'PDF (HTML)',
          description: 'Printable report format. Contains formatted report with charts. Best for: Printing, sharing reports, presentations.',
        },
        {
          type: 'subtitle',
          text: 'How to Export:',
        },
        {
          type: 'steps',
          items: [
            'Go to Settings → Data Export',
            'Choose format (Excel, JSON, or PDF)',
            'Select entry type (optional)',
            'Select date range (optional)',
            'Choose export action (Share or Save)',
            'Tap Export',
          ],
        },
        {
          type: 'subtitle',
          text: 'How to Import:',
        },
        {
          type: 'steps',
          items: [
            'Go to Settings → Data Import',
            'Tap "Import from CSV/JSON"',
            'Choose import option (Replace All or Merge)',
            'Select file from your device',
            'Confirm import',
          ],
        },
        {
          type: 'warning',
          text: 'Important: Always backup before importing. CSV files must match the export format. Date format: YYYY-MM-DD (e.g., 2025-12-21)',
        },
      ],
    },
    {
      id: 'backup-restore',
      title: '💾 Backup & Restore',
      icon: 'cloud-upload-outline',
      content: [
        {
          type: 'text',
          text: 'Why Backup is Important: Protect your data, recover from device loss, transfer to new device, peace of mind.',
        },
        {
          type: 'subtitle',
          text: 'How to Create Backup:',
        },
        {
          type: 'steps',
          items: [
            'Go to Settings → Backup & Restore',
            'Tap "Create Backup"',
            'Choose where to save the file',
            'Backup file is created',
          ],
        },
        {
          type: 'subtitle',
          text: 'How to Restore:',
        },
        {
          type: 'steps',
          items: [
            'Go to Settings → Backup & Restore',
            'Tap "Restore from Backup"',
            'Select backup file',
            'Confirm restore',
          ],
        },
        {
          type: 'warning',
          text: 'Warning: Restore replaces current data. Always backup before restoring!',
        },
      ],
    },
    {
      id: 'tips-practices',
      title: '💡 Tips & Best Practices',
      icon: 'bulb-outline',
      content: [
        {
          type: 'subtitle',
          text: 'Daily Habits:',
        },
        {
          type: 'list',
          items: [
            'Add Expenses Immediately - Don\'t wait until end of day',
            'Use Categories Consistently - Always select a category',
            'Add Descriptive Notes - Write clear notes',
            'Review Daily - Check spending at end of day',
          ],
        },
        {
          type: 'subtitle',
          text: 'Weekly Habits:',
        },
        {
          type: 'list',
          items: [
            'Review Weekly Summary - Check weekly totals',
            'Check Goal Progress - Review savings goals',
            'Export Data - Create weekly backup',
          ],
        },
        {
          type: 'subtitle',
          text: 'Monthly Habits:',
        },
        {
          type: 'list',
          items: [
            'Monthly Review - Analyze monthly spending',
            'Set New Goals - Review and adjust goals',
            'Category Analysis - Check category-wise spending',
          ],
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: '🔧 Troubleshooting',
      icon: 'construct-outline',
      content: [
        {
          type: 'subtitle',
          text: 'Common Issues:',
        },
        {
          type: 'issue',
          title: 'Balance Not Updating',
          solution: 'Check if you set initial balance correctly. Verify all entries are added. Use "Auto Calculate from Entries".',
        },
        {
          type: 'issue',
          title: 'Can\'t Find a Transaction',
          solution: 'Use search bar. Check date range. Try different search terms.',
        },
        {
          type: 'issue',
          title: 'Export Not Working',
          solution: 'Check if you have entries. Verify date range selection. Try different export format.',
        },
        {
          type: 'issue',
          title: 'Import Not Working',
          solution: 'Check file format (CSV or JSON). Verify date format (YYYY-MM-DD). Ensure file matches export format.',
        },
        {
          type: 'subtitle',
          text: 'Getting Help:',
        },
        {
          type: 'text',
          text: 'If you encounter issues:',
        },
        {
          type: 'list',
          items: [
            'Check this guide first',
            'Review the app\'s "How to Use" section in Settings',
            'Contact developer: Phone: +91 6397520221, Email: gs27349@gmail.com',
          ],
        },
      ],
    },
  ];

  // Auto-expand all sections when searching
  useEffect(() => {
    if (searchQuery) {
      const allExpanded = {};
      sections.forEach(section => {
        allExpanded[section.id] = true;
      });
      setExpandedSections(allExpanded);
    }
  }, [searchQuery]);

  const filteredSections = searchQuery
    ? sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.some(item =>
          (item.text || item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : sections;

  const renderContent = (content) => {
    return content.map((item, index) => {
      switch (item.type) {
        case 'subtitle':
          return (
            <Text key={index} style={styles.subtitle}>
              {item.text}
            </Text>
          );
        case 'text':
          return (
            <Text key={index} style={styles.text}>
              {item.text}
            </Text>
          );
        case 'list':
          return (
            <View key={index} style={styles.listContainer}>
              {item.items.map((listItem, listIndex) => (
                <View key={listIndex} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.status.income} style={styles.listIcon} />
                  <Text style={styles.listText}>{listItem}</Text>
                </View>
              ))}
            </View>
          );
        case 'steps':
          return (
            <View key={index} style={styles.stepsContainer}>
              {item.items.map((step, stepIndex) => (
                <View key={stepIndex} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          );
        case 'tip':
          return (
            <View key={index} style={styles.tipContainer}>
              <Ionicons name="bulb" size={20} color="#FFD43B" />
              <Text style={styles.tipText}>{item.text}</Text>
            </View>
          );
        case 'warning':
          return (
            <View key={index} style={styles.warningContainer}>
              <Ionicons name="warning" size={20} color="#FF6B6B" />
              <Text style={styles.warningText}>{item.text}</Text>
            </View>
          );
        case 'success':
          return (
            <View key={index} style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.status.income} />
              <Text style={styles.successText}>{item.text}</Text>
            </View>
          );
        case 'feature':
          return (
            <View key={index} style={styles.featureContainer}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDescription}>{item.description}</Text>
            </View>
          );
        case 'issue':
          return (
            <View key={index} style={styles.issueContainer}>
              <Text style={styles.issueTitle}>{item.title}</Text>
              <Text style={styles.issueSolution}>Solution: {item.solution}</Text>
            </View>
          );
        default:
          return null;
      }
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="book" size={28} color={Colors.accent.primary} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>User Guide</Text>
              <Text style={styles.headerSubtitle}>Complete app documentation</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search guide..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.searchClearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Guide Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.guideScroll}
          contentContainerStyle={styles.guideContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Table of Contents */}
          <View style={styles.tocContainer}>
            <Text style={styles.tocTitle}>📋 Table of Contents</Text>
            <View style={styles.tocGrid}>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={styles.tocItem}
                  onPress={() => {
                    scrollToSection(section.id);
                    toggleSection(section.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={section.icon} size={20} color={Colors.accent.primary} />
                  <Text style={styles.tocItemText} numberOfLines={2}>{section.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
            {filteredSections.map((section) => (
              <View
                key={section.id}
                style={styles.section}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name={section.icon} size={24} color={Colors.accent.primary} />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <Ionicons
                    name={expandedSections[section.id] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.text.secondary}
                  />
                </TouchableOpacity>
                {expandedSections[section.id] && (
                  <View style={styles.sectionContent}>
                    {renderContent(section.content)}
                  </View>
                )}
              </View>
            ))}

            {/* Contact Section */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>📞 Need Help?</Text>
              <Text style={styles.contactText}>
                If you have questions or need support, please contact:
              </Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={20} color={Colors.accent.primary} />
                  <Text style={styles.contactDetail}>+91 6397520221</Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={20} color={Colors.accent.primary} />
                  <Text style={styles.contactDetail}>gs27349@gmail.com</Text>
                </View>
              </View>
            </View>
          </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background.secondary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 4,
  },
  tocContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tocTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  tocGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tocItem: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tocItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  guideScroll: {
    flex: 1,
  },
  guideContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.primary,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  listContainer: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  listIcon: {
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  stepsContainer: {
    marginVertical: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginTop: 4,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFD43B20',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD43B',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FF6B6B20',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#51CF6620',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#51CF66',
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  featureContainer: {
    backgroundColor: Colors.background.primary,
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  issueContainer: {
    backgroundColor: Colors.background.primary,
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 6,
  },
  issueSolution: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactDetail: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
});

export default UserGuideScreen;


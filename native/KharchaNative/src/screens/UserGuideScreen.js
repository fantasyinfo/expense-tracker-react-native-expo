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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'react-native-linear-gradient';
import Colors from '../constants/colors';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UserGuideScreen = ({ visible, onClose }) => {
  const { currency } = useCurrency();
  const { t } = useLanguage();
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

  // Helper to interpolate content with currency symbol
  const interpolateContent = (content) => {
    if (!content) return [];
    return content.map(item => {
      const newItem = { ...item };
      // Interpolate 'text'
      if (typeof newItem.text === 'string') {
        newItem.text = newItem.text.replace(/{{symbol}}/g, currency.symbol);
      }
      // Interpolate 'items' (array of strings) - e.g. steps or list
      if (Array.isArray(newItem.items)) {
        newItem.items = newItem.items.map(s => s.replace(/{{symbol}}/g, currency.symbol));
      }
      // Interpolate 'description' - e.g. features
      if (typeof newItem.description === 'string') {
        newItem.description = newItem.description.replace(/{{symbol}}/g, currency.symbol);
      }
      // Interpolate 'solution' - e.g. troubleshooting
      if (typeof newItem.solution === 'string') {
        newItem.solution = newItem.solution.replace(/{{symbol}}/g, currency.symbol);
      }
      return newItem;
    });
  };

  const rawSections = t('userGuide.sections') || {};
  
  const sectionConfig = [
    { id: 'getting-started', icon: 'rocket-outline' },
    { id: 'first-day-setup', icon: 'calendar-outline' },
    { id: 'daily-usage', icon: 'today-outline' },
    { id: 'home-screen', icon: 'home-outline' },
    { id: 'summary-screen', icon: 'stats-chart-outline' },
    { id: 'goals-screen', icon: 'flag-outline' },
    { id: 'adding-entries', icon: 'add-circle-outline' },
    { id: 'categories', icon: 'grid-outline' },
    { id: 'export-import', icon: 'download-outline' },
    { id: 'backup-restore', icon: 'cloud-upload-outline' },
    { id: 'tips-practices', icon: 'bulb-outline' },
    { id: 'troubleshooting', icon: 'construct-outline' }
  ];

  const sections = sectionConfig.map(config => {
     const sectionData = rawSections[config.id] || {};
     return {
       id: config.id,
       title: sectionData.title || config.id, 
       icon: config.icon,
       content: interpolateContent(sectionData.content || [])
     };
  });
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
              <Text style={styles.headerTitle}>{t('userGuide.headerTitle')}</Text>
              <Text style={styles.headerSubtitle}>{t('userGuide.headerSubtitle')}</Text>
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
              placeholder={t('userGuide.searchPlaceholder')}
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
            <Text style={styles.tocTitle}>{t('userGuide.tocTitle')}</Text>
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
              <Text style={styles.contactTitle}>{t('userGuide.contactTitle')}</Text>
              <Text style={styles.contactText}>
                {t('userGuide.contactText')}
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


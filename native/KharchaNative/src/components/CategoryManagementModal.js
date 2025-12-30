import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/colors';
import { loadCategories, addCategory, deleteCategory, saveCategories, DEFAULT_CATEGORIES } from '../utils/categoryStorage';

// Available icons for category selection
const AVAILABLE_ICONS = [
  'restaurant-outline', 'basket-outline', 'car-outline', 'bag-outline', 'flash-outline',
  'film-outline', 'medical-outline', 'school-outline', 'sparkles-outline', 'airplane-outline',
  'cash-outline', 'briefcase-outline', 'wallet-outline', 'ellipse-outline', 'person-outline',
  'home-outline', 'phone-portrait-outline', 'shirt-outline', 'fitness-outline', 'book-outline',
  'musical-notes-outline', 'game-controller-outline', 'cafe-outline', 'pizza-outline', 'wine-outline',
  'gift-outline', 'heart-outline', 'star-outline', 'trophy-outline', 'ribbon-outline',
  'card-outline', 'receipt-outline', 'calculator-outline', 'stats-chart-outline', 'trending-up-outline',
  'build-outline', 'hammer-outline', 'construct-outline', 'car-sport-outline', 'bicycle-outline',
  'train-outline', 'bus-outline', 'boat-outline', 'bed-outline',
];

// Available colors for category selection
const AVAILABLE_COLORS = [
  '#FF9800', '#4CAF50', '#2196F3', '#E91E63', '#FFC107',
  '#9C27B0', '#F44336', '#00BCD4', '#607D8B', '#9E9E9E',
  '#FF5722', '#795548', '#3F51B5', '#009688', '#CDDC39',
  '#FFEB3B',
];

const CategoryManagementModal = ({ visible, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [selectedIcon, setSelectedIcon] = useState('ellipse-outline');
  const [selectedColor, setSelectedColor] = useState('#9E9E9E');

  useEffect(() => {
    if (visible) {
      loadCategoriesData();
    }
  }, [visible]);

  const loadCategoriesData = async () => {
    const cats = await loadCategories();
    setCategories(cats);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType('expense');
    setSelectedIcon('ellipse-outline');
    setSelectedColor('#9E9E9E');
    setShowAddModal(true);
  };

  const handleEditCategory = (category) => {
    // Check if it's a default category
    const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
    if (defaultIds.has(category.id)) {
      Alert.alert('Cannot Edit', 'Default categories cannot be edited. You can only delete custom categories.');
      return;
    }
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowAddModal(true);
  };

  const handleDeleteCategory = (category) => {
    // Check if it's a default category
    const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
    if (defaultIds.has(category.id)) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              await loadCategoriesData();
              Alert.alert('Success', 'Category deleted successfully!');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name.');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id
            ? { ...cat, name: categoryName.trim(), type: categoryType, icon: selectedIcon, color: selectedColor }
            : cat
        );
        // Filter out default categories and save only custom ones
        const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
        const customCategories = updatedCategories.filter(c => !defaultIds.has(c.id));
        await saveCategories([...DEFAULT_CATEGORIES, ...customCategories]);
      } else {
        // Add new category
        await addCategory({
          name: categoryName.trim(),
          type: categoryType,
          icon: selectedIcon,
          color: selectedColor,
        });
      }
      await loadCategoriesData();
      setShowAddModal(false);
      setEditingCategory(null);
      setCategoryName('');
      Alert.alert('Success', editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save category.');
    }
  };

  const renderCategoryItem = ({ item }) => {
    const isDefault = DEFAULT_CATEGORIES.some(c => c.id === item.id);
    return (
      <View style={styles.categoryItem}>
        <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryType}>{item.type === 'expense' ? 'Expense' : 'Income'}</Text>
        </View>
        {isDefault ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        ) : (
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditCategory(item)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteCategory(item)}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.status.expense} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Categories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Add Category Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
            <Ionicons name="add-circle" size={20} color={Colors.accent.primary} />
            <Text style={styles.addButtonText}>Add New Category</Text>
          </TouchableOpacity>

          {/* Categories List */}
          <View style={styles.categoriesListContainer}>
            <Text style={styles.sectionTitle}>All Categories ({categories.length})</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              style={styles.categoriesList}
              contentContainerStyle={styles.categoriesListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No categories found</Text>
                </View>
              }
            />
          </View>

          {/* Add/Edit Category Modal */}
          <Modal visible={showAddModal} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.addModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                      setCategoryName('');
                    }}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.addModalContent}>
                  {/* Category Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category Name</Text>
                    <TextInput
                      style={styles.input}
                      value={categoryName}
                      onChangeText={setCategoryName}
                      placeholder="Enter category name"
                      placeholderTextColor={Colors.text.secondary}
                    />
                  </View>

                  {/* Category Type */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category Type</Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          categoryType === 'expense' && styles.typeButtonActive,
                        ]}
                        onPress={() => setCategoryType('expense')}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            categoryType === 'expense' && styles.typeButtonTextActive,
                          ]}
                        >
                          Expense
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          categoryType === 'income' && styles.typeButtonActive,
                        ]}
                        onPress={() => setCategoryType('income')}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            categoryType === 'income' && styles.typeButtonTextActive,
                          ]}
                        >
                          Income
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Icon Selection */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Icon</Text>
                    <View style={styles.iconGrid}>
                      {AVAILABLE_ICONS.map((icon, index) => (
                        <TouchableOpacity
                          key={`icon-${index}-${icon}`}
                          style={[
                            styles.iconOption,
                            selectedIcon === icon && {
                              borderColor: selectedColor,
                              backgroundColor: selectedColor + '20',
                              borderWidth: 3,
                            },
                          ]}
                          onPress={() => setSelectedIcon(icon)}
                        >
                          <Ionicons
                            name={icon}
                            size={24}
                            color={selectedIcon === icon ? selectedColor : Colors.text.secondary}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Color Selection */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Color</Text>
                    <View style={styles.colorGrid}>
                      {AVAILABLE_COLORS.map((color, index) => (
                        <TouchableOpacity
                          key={`color-${index}-${color}`}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorOptionSelected,
                          ]}
                          onPress={() => setSelectedColor(color)}
                        >
                          {selectedColor === color && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                    <Text style={styles.saveButtonText}>
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingBottom: 20,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.primary + '20',
    padding: 15,
    margin: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: Colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoriesListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 15,
    marginTop: 10,
  },
  categoriesList: {
    flex: 1,
  },
  categoriesListContent: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  defaultBadge: {
    backgroundColor: Colors.accent.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  defaultBadgeText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  addModalContainer: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  addModalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.accent.primary + '20',
    borderColor: Colors.accent.primary,
  },
  typeButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: Colors.accent.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border.primary,
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  saveButton: {
    backgroundColor: Colors.accent.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
});

export default CategoryManagementModal;


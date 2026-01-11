import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelectionScreen = ({ navigation, route }) => {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  
  const isSettingsMode = route?.params?.mode === 'settings';

  const handleSelectLanguage = async (code) => {
    await setLanguage(code);
    if (isSettingsMode && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = language === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelectLanguage(item.code)}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{item.name}</Text>
          <Text style={styles.nativeName}>{item.nativeName}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        {isSettingsMode && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{t('languageSelection.title')}</Text>
          <Text style={styles.subtitle}>{t('languageSelection.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={supportedLanguages}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1C1C1E',
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  selectedItem: {
    borderColor: Colors.primary || '#0A84FF',
    backgroundColor: '#1C1C1E',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nativeName: {
    fontSize: 14,
    color: '#A0A0A0',
  },
});

export default LanguageSelectionScreen;

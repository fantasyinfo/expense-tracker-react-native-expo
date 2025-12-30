import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { loadProfile, saveProfile } from '../utils/profileStorage';
import Colors from '../constants/colors';
import AppFooter from '../components/AppFooter';

const ProfileScreen = () => {
  const [profile, setProfile] = useState({
    name: 'User',
    bio: 'Welcome to your expense tracker! Start managing your finances and take control of your money.',
    dreams: 'My goal is to achieve financial freedom by tracking every expense and income. I want to build better spending habits and save for my future dreams.',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadProfileData = useCallback(async () => {
    const data = await loadProfile();
    setProfile(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSave = async () => {
    try {
      await saveProfile(profile);
      setIsEditing(false);
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleCancel = () => {
    loadProfileData();
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Personalize your experience</Text>
        </View>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!hasChanges}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={hasChanges ? Colors.accent.gradient.positive : [Colors.background.secondary, Colors.background.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Avatar Card */}
      <View style={styles.avatarCard}>
        <LinearGradient
          colors={Colors.accent.gradient.positive}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarContainer}
        >
          <Text style={styles.avatarText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <Text style={styles.avatarName}>
          {profile.name}
        </Text>
      </View>

      {/* Name Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Name *</Text>
        {isEditing ? (
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.text.secondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.text.tertiary}
              value={profile.name}
              onChangeText={(value) => handleChange('name', value)}
              autoCapitalize="words"
            />
          </View>
        ) : (
          <View style={styles.displayContainer}>
            <Text style={styles.displayText}>
              {profile.name}
            </Text>
          </View>
        )}
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Bio</Text>
        {isEditing ? (
          <View style={styles.textAreaContainer}>
            <View style={styles.textAreaIconContainer}>
              <Ionicons name="document-text-outline" size={20} color={Colors.text.secondary} />
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.text.tertiary}
              value={profile.bio}
              onChangeText={(value) => handleChange('bio', value)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        ) : (
          <View style={styles.displayContainer}>
            <Text style={styles.displayText}>
              {profile.bio}
            </Text>
          </View>
        )}
      </View>

      {/* Dreams/Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Future Dreams & Goals</Text>
        {isEditing ? (
          <View style={styles.textAreaContainer}>
            <View style={styles.textAreaIconContainer}>
              <Ionicons name="star-outline" size={20} color={Colors.text.secondary} />
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="What are your dreams for using this app? What financial goals do you want to achieve?"
              placeholderTextColor={Colors.text.tertiary}
              value={profile.dreams}
              onChangeText={(value) => handleChange('dreams', value)}
              multiline={true}
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        ) : (
          <View style={styles.displayContainer}>
            <Text style={styles.displayText}>
              {profile.dreams}
            </Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.accent.primary} />
        </View>
        <Text style={styles.infoTitle}>Your Privacy Matters</Text>
        <Text style={styles.infoText}>
          All your profile information is stored locally on your device. We don't collect or share any of your personal data. Your information stays private and secure.
        </Text>
      </View>

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  textAreaContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 120,
  },
  textAreaIconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
    minHeight: 100,
  },
  displayContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minHeight: 56,
  },
  displayText: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
    lineHeight: 22,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.iconBackground.upi,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default ProfileScreen;

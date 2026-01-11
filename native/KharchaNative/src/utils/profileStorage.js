import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@expense_tracker_profile';

/**
 * Get default profile values
 */
const getDefaultProfile = () => {
  return {
    name: 'User',
    bio: 'Welcome to your expense tracker! Start managing your finances and take control of your money.',
    dreams: 'My goal is to achieve financial freedom by tracking every expense and income. I want to build better spending habits and save for my future dreams.',
  };
};

/**
 * Load user profile from AsyncStorage
 * Returns default values if no profile exists
 */
export const loadProfile = async () => {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (!data) {
      // Return defaults but don't save them yet - let user customize first
      return getDefaultProfile();
    }
    const profile = JSON.parse(data);
    // If profile exists but has empty fields, merge with defaults
    const defaults = getDefaultProfile();
    return {
      name: profile.name || defaults.name,
      bio: profile.bio || defaults.bio,
      dreams: profile.dreams || defaults.dreams,
    };
  } catch (error) {
    return getDefaultProfile();
  }
};

/**
 * Save user profile to AsyncStorage
 */
export const saveProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    throw error;
  }
};

/**
 * Update profile field
 */
export const updateProfileField = async (field, value) => {
  try {
    const profile = await loadProfile();
    profile[field] = value;
    await saveProfile(profile);
    return profile;
  } catch (error) {
    throw error;
  }
};

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePremium } from '../context/PremiumContext';
import { useCurrency } from '../context/CurrencyContext'; // Added this import
import Colors from '../constants/colors';

const PremiumScreen = () => {
  const navigation = useNavigation();
  const { isPremium, buyPremium } = usePremium();
  const { currency } = useCurrency(); // Added this line
  
  // Regional Pricing Logic
  const price = currency.code === 'INR' ? '₹99' : '$4.99'; // Added this line, corrected price to 99 for INR
  const currencySymbol = currency.code === 'INR' ? '₹' : '$'; // Added this line

  const handlePurchase = async () => {
    const success = await buyPremium();
    if (success) {
      Alert.alert(
        'Success',
        'Thank you for upgrading to Premium! You now have access to all features.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    }
  };

  const FeatureRow = ({ icon, title, description }) => (
    <View style={styles.featureRow}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color={Colors.accent.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Upgrade</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.2)', 'transparent']}
            style={styles.heroGradient}
          />
          <Ionicons name="ribbon" size={64} color="#FFD700" style={styles.crownIcon} />
          <Text style={styles.heroTitle}>Unlock Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Get meaningful insights and unlimited freedom with SpendOrbit Premium
          </Text>
        </View>

        <View style={styles.featuresList}>
          <FeatureRow
            icon="download-outline"
            title="Data Export"
            description="Export your data to Excel, JSON, and PDF formats for advanced analysis."
          />
          <FeatureRow
            icon="list-outline"
            title="Unlimited Categories"
            description="Create as many custom categories as you need to organize your expenses."
          />
          <FeatureRow
            icon="stats-chart-outline"
            title="Advanced Reports"
            description="Access detailed PDF reports and deeper insights into your spending."
          />
          <FeatureRow
            icon="heart-outline"
            title="Support Development"
            description="Help us maintain and improve the app. SpendOrbit is 100% offline and ad-free."
          />
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.priceLabel}>One-time purchase. Lifetime access.</Text>
          <Text style={styles.priceValue}>{price}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FA5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.purchaseButtonText}>
              {isPremium ? 'Premium Unlocked' : `Upgrade for ${price}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.restoreText}>Restore Purchase</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 40,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  crownIcon: {
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  featuresList: {
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  pricingContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 100,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restoreText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PremiumScreen;

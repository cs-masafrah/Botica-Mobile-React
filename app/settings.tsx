// app/settings.tsx - Fixed with proper function ordering
import { router, Stack } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Globe,
  Info,
  Shield,
  HelpCircle,
  Mail,
  FileText,
  Star,
  Layout,
  DollarSign,
  X,
  Check,
  TrendingUp,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

type SettingItem = {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  badge?: string;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const { locale, changeLanguage } = useLanguage();
  const { currencies, currentCurrency, baseCurrency, setCurrency, formatPrice } = useCurrency();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // ========== HANDLER FUNCTIONS (Declared before they're used) ==========
  
  const handleLanguageChange = () => {
    Alert.alert(
      'Change Language',
      'Select your preferred language',
      [
        {
          text: 'English',
          onPress: () => changeLanguage('en'),
        },
        {
          text: 'العربية',
          onPress: () => changeLanguage('ar'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCurrencyPress = () => {
    setCurrencyModalVisible(true);
  };

  const handleCurrencySelect = (currency: any) => {
    setCurrency(currency);
    setCurrencyModalVisible(false);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your personal data when you visit our app and tell you about your privacy rights.\n\nData Collection:\n• Personal identification information\n• Order and purchase history\n• Delivery addresses\n• Payment information\n\nData Usage:\n• Process orders\n• Improve our services\n• Send promotional offers (with consent)\n• Customer support\n\nData Protection:\nWe implement security measures to maintain the safety of your personal information.\n\nFor more details, please contact our support team.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsConditions = () => {
    Alert.alert(
      'Terms & Conditions',
      'Welcome to our Beauty Shop App. By accessing and using this application, you accept and agree to be bound by the terms and conditions.\n\nAccount Terms:\n• You must be 18 years or older\n• Provide accurate account information\n• Keep your password secure\n\nOrders & Payment:\n• Prices are subject to change\n• Payment must be made at time of order\n• We reserve the right to refuse any order\n\nShipping & Returns:\n• Delivery times are estimates\n• Return policy: 14 days from delivery\n• Products must be unused and in original packaging\n\nIntellectual Property:\nAll content is owned by us and protected by copyright laws.\n\nContact: support@beautyapp.com',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Linking.openURL('mailto:support@beautyapp.com');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Beauty App',
      'Version 1.0.0\n\nYour premium destination for authentic beauty and cosmetic products. We curate the finest selection of makeup, skincare, and beauty tools from renowned brands worldwide.\n\nOur Mission:\nTo make premium beauty products accessible to everyone while ensuring authenticity and quality.\n\nFeatures:\n• Authentic products guaranteed\n• Fast & secure delivery\n• Easy returns policy\n• 24/7 customer support\n• Exclusive deals & offers\n\nThank you for choosing us!\n\n© 2025 Beauty App. All rights reserved.',
      [{ text: 'OK' }]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Our App',
      'Love our app? Please take a moment to rate us on the App Store. Your feedback helps us improve!',
      [
        {
          text: 'Rate Now',
          onPress: () => {
            Alert.alert('Thank You!', 'This would redirect to the App Store in a production app.');
          },
        },
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
      ]
    );
  };

  // ========== SECTIONS ARRAY (Now after all handlers are declared) ==========
  
  const sections: SettingSection[] = [
    {
      title: 'General',
      items: [
        {
          id: 'language',
          icon: Globe,
          label: 'Language',
          type: 'action',
          badge: locale === 'en' ? 'English' : 'العربية',
          onPress: handleLanguageChange,
        },
        {
          id: 'currency',
          icon: DollarSign,
          label: 'Currency',
          type: 'action',
          badge: currentCurrency ? `${currentCurrency.code} (${currentCurrency.symbol})` : 'USD ($)',
          onPress: handleCurrencyPress,
        },
        {
          id: 'customizeHomepage',
          icon: Layout,
          label: 'Customize Homepage',
          type: 'navigation',
          onPress: () => router.push('/customize-homepage' as any),
        },
      ],
    },

    {
      title: 'Notifications',
      items: [
        {
          id: 'pushNotifications',
          icon: Bell,
          label: 'Push Notifications',
          type: 'toggle',
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          id: 'orderUpdates',
          icon: Bell,
          label: 'Order Updates',
          type: 'toggle',
          value: orderUpdates,
          onToggle: setOrderUpdates,
        },
        {
          id: 'emailNotifications',
          icon: Mail,
          label: 'Email Notifications',
          type: 'toggle',
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: HelpCircle,
          label: 'Help & Support',
          type: 'navigation',
          onPress: handleHelpSupport,
        },
        {
          id: 'contact',
          icon: Mail,
          label: 'Contact Us',
          type: 'navigation',
          badge: 'support@beautyapp.com',
          onPress: () => Linking.openURL('mailto:support@beautyapp.com'),
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'privacy',
          icon: Shield,
          label: 'Privacy Policy',
          type: 'navigation',
          onPress: handlePrivacyPolicy,
        },
        {
          id: 'terms',
          icon: FileText,
          label: 'Terms & Conditions',
          type: 'navigation',
          onPress: handleTermsConditions,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'about',
          icon: Info,
          label: 'About App',
          type: 'navigation',
          badge: 'v1.0.0',
          onPress: handleAbout,
        },
        {
          id: 'rate',
          icon: Star,
          label: 'Rate Our App',
          type: 'navigation',
          onPress: handleRateApp,
        },
      ],
    },
  ];

  // ========== HELPER FUNCTIONS for Currency Modal ==========
  
  const getEquivalentAmount = (currency: any) => {
    if (!baseCurrency) return '';
    
    if (currency.code === baseCurrency.code) {
      return `1 ${baseCurrency.code} = 1 ${currency.code}`;
    }
    
    if (currency.exchangeRate) {
      return `1 ${baseCurrency.code} = ${currency.exchangeRate.rate} ${currency.code}`;
    }
    
    return '';
  };

  const getExampleConversion = (currency: any) => {
    if (!baseCurrency) return '';
    
    const exampleAmount = 100;
    
    if (currency.code === baseCurrency.code) {
      return formatPrice(exampleAmount);
    }
    
    if (currency.exchangeRate) {
      const converted = exampleAmount * currency.exchangeRate.rate;
      return `${formatPrice(exampleAmount)} = ${currency.symbol}${converted.toFixed(2)}`;
    }
    
    return '';
  };

  // ========== RENDER FUNCTIONS ==========
  
  const renderSettingItem = (item: SettingItem) => {
    const Icon = item.icon;

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.settingItem,
          pressed && styles.settingItemPressed,
        ]}
        onPress={item.type === 'toggle' ? undefined : item.onPress}
      >
        <View style={styles.settingItemLeft}>
          <View style={styles.iconContainer}>
            <Icon size={20} color={Colors.primary} />
          </View>
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>

        <View style={styles.settingItemRight}>
          {item.badge && (
            <Text style={styles.badge}>{item.badge}</Text>
          )}
          
          {item.type === 'toggle' && item.onToggle && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.border}
            />
          )}
          
          {item.type === 'navigation' && (
            <ChevronRight size={20} color={Colors.textSecondary} />
          )}
          
          {item.type === 'action' && (
            <ChevronRight size={20} color={Colors.textSecondary} />
          )}
        </View>
      </Pressable>
    );
  };

  // Currency Modal Component
  const CurrencyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={currencyModalVisible}
      onRequestClose={() => setCurrencyModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <DollarSign size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Select Currency</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Base Currency Info */}
          {baseCurrency && (
            <View style={styles.baseCurrencyInfo}>
              <View style={styles.baseCurrencyBadge}>
                <TrendingUp size={16} color={Colors.white} />
                <Text style={styles.baseCurrencyBadgeText}>Base Currency</Text>
              </View>
              <Text style={styles.baseCurrencyText}>
                {baseCurrency.name} ({baseCurrency.code})
              </Text>
              <Text style={styles.baseCurrencyRate}>
                1 {baseCurrency.code} = 1 {baseCurrency.code}
              </Text>
            </View>
          )}

          {/* Currency List */}
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.currencyList}
            renderItem={({ item }) => {
              const isSelected = currentCurrency?.id === item.id;
              const isBaseCurrency = baseCurrency?.id === item.id;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    isSelected && styles.currencyItemSelected,
                  ]}
                  onPress={() => handleCurrencySelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyItemLeft}>
                    <View style={styles.currencySymbolContainer}>
                      <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    </View>
                    <View style={styles.currencyInfo}>
                      <View style={styles.currencyNameRow}>
                        <Text style={styles.currencyCode}>{item.code}</Text>
                        {isBaseCurrency && (
                          <View style={styles.baseBadge}>
                            <Text style={styles.baseBadgeText}>BASE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.currencyName}>{item.name}</Text>
                      
                      {/* Exchange Rate Info */}
                      {item.exchangeRate && !isBaseCurrency && (
                        <View style={styles.rateContainer}>
                          <Text style={styles.rateText}>
                            1 {baseCurrency?.code} = {item.exchangeRate.rate} {item.code}
                          </Text>
                          <Text style={styles.exampleText}>
                            $100 USD ≈ {item.symbol}{(100 * item.exchangeRate.rate).toFixed(2)}
                          </Text>
                        </View>
                      )}
                      
                      {isBaseCurrency && (
                        <View style={styles.rateContainer}>
                          <Text style={styles.rateText}>
                            Base Currency
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.checkmarkContainer}>
                      <Check size={20} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* Footer Note */}
          <View style={styles.modalFooter}>
            <Text style={styles.modalFooterText}>
              All prices will be converted using the selected currency
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ========== MAIN RETURN ==========
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {sections.map((section, index) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.settingsCard}>
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    {renderSettingItem(item)}
                    {itemIndex < section.items.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.footerText}>
            Made with ❤️ for Beauty Lovers
          </Text>
        </ScrollView>
      </View>

      {/* Currency Selection Modal */}
      <CurrencyModal />
    </>
  );
}

// All styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingItemPressed: {
    backgroundColor: Colors.cardBackground,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '80%',
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseCurrencyInfo: {
    backgroundColor: Colors.borderLight,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  baseCurrencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  baseCurrencyBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  baseCurrencyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  baseCurrencyRate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currencyList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  currencySymbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  baseBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baseBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  currencyName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rateContainer: {
    marginTop: 2,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  exampleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 8,
  },
  modalFooterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
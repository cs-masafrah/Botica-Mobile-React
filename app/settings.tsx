// app/settings.tsx
import { router, Stack } from "expo-router";
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
  RefreshCw,
} from "lucide-react-native";
import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function SettingsScreen() {
  const { locale, changeLanguage } = useLanguage();
  const {
    selectedCurrency,
    availableCurrencies,
    baseCurrency,
    setSelectedCurrency,
    formatPrice,
    convertPrice,
    exchangeRates,
    isLoading,
    refreshRates,
  } = useCurrency();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [refreshingRates, setRefreshingRates] = useState(false);

  const handleLanguageChange = () => {
    Alert.alert("Change Language", "Select your preferred language", [
      { text: "English", onPress: () => changeLanguage("en") },
      { text: "العربية", onPress: () => changeLanguage("ar") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleCurrencyChange = (currency: any) => {
    setSelectedCurrency(currency);
    setCurrencyModalVisible(false);
    Alert.alert(
      "Currency Updated",
      `All prices will now be displayed in ${currency.name} (${currency.symbol})`,
      [{ text: "OK" }],
    );
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    await refreshRates();
    setRefreshingRates(false);
    Alert.alert("Success", "Exchange rates have been updated");
  };

  const CurrencyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={currencyModalVisible}
      onRequestClose={() => setCurrencyModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              onPress={() => setCurrencyModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading currencies...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={availableCurrencies}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedCurrency?.id === item.id;
                  // Calculate converted price for preview
                  const baseAmount = 99.99;
                  const convertedAmount = convertPrice(
                    baseAmount,
                    baseCurrency?.code,
                  );

                  return (
                    <TouchableOpacity
                      style={[
                        styles.currencyItem,
                        isSelected && styles.currencyItemSelected,
                      ]}
                      onPress={() => handleCurrencyChange(item)}
                    >
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencySymbol}>{item.symbol}</Text>
                        <View>
                          <Text style={styles.currencyCode}>{item.code}</Text>
                          <Text style={styles.currencyName}>{item.name}</Text>
                          {/* Show what 99.99 in base currency equals in this currency */}
                          <Text style={styles.currencyPreview}>
                            {baseAmount} {baseCurrency?.code} ={" "}
                            {formatPrice(convertedAmount, item.code)}
                          </Text>
                          {/* Show inverse rate for clarity */}
                          <Text style={styles.currencyPreviewInverse}>
                            1 {item.code} ={" "}
                            {exchangeRates[item.code]?.toFixed(2)}{" "}
                            {baseCurrency?.code}
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.currencyList}
              />

              {/* Exchange Rates Section */}
              {baseCurrency && (
                <View style={styles.exchangeRateContainer}>
                  <View style={styles.exchangeRateHeader}>
                    <Text style={styles.exchangeRateTitle}>Exchange Rates</Text>
                    <TouchableOpacity
                      onPress={handleRefreshRates}
                      disabled={refreshingRates}
                      style={styles.refreshButton}
                    >
                      {refreshingRates ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                      ) : (
                        <RefreshCw size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.exchangeRateSubtitle}>
                    1 {baseCurrency.code} = 1 {baseCurrency.code} (Base)
                  </Text>

                  {availableCurrencies.map((currency) => {
                    if (currency.code === baseCurrency.code) return null;
                    // How many units of this currency equal 1 base currency
                    const rate = 1 / exchangeRates[currency.code];
                    return (
                      <View key={currency.id} style={styles.exchangeRateRow}>
                        <Text style={styles.exchangeRateCurrency}>
                          1 {baseCurrency.code} =
                        </Text>
                        <Text style={styles.exchangeRateValue}>
                          {rate.toFixed(4)} {currency.code}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={styles.exchangeRateDivider} />

                  <Text style={styles.exchangeRateSubtitle}>
                    1 {baseCurrency.code} in other currencies:
                  </Text>

                  {availableCurrencies.map((currency) => {
                    if (currency.code === baseCurrency.code) return null;
                    return (
                      <View key={currency.id} style={styles.exchangeRateRow}>
                        <Text style={styles.exchangeRateCurrency}>
                          1 {currency.code} =
                        </Text>
                        <Text style={styles.exchangeRateValue}>
                          {exchangeRates[currency.code].toFixed(2)}{" "}
                          {baseCurrency.code}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Price Preview Section */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Price Preview:</Text>

                {/* Base Currency Price */}
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    In {baseCurrency?.code}:
                  </Text>
                  <Text style={styles.basePriceText}>
                    {formatPrice(99.99, baseCurrency?.code)}
                  </Text>
                </View>

                {/* Converted Price (if different from base) */}
                {selectedCurrency &&
                  baseCurrency &&
                  selectedCurrency.code !== baseCurrency.code && (
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>
                        In {selectedCurrency.code}:
                      </Text>
                      <Text style={styles.convertedPriceText}>
                        {formatPrice(convertPrice(99.99, baseCurrency.code))}
                      </Text>
                    </View>
                  )}

                {/* Exchange Rate Info */}
                {selectedCurrency &&
                  baseCurrency &&
                  selectedCurrency.code !== baseCurrency.code && (
                    <View style={styles.rateInfoContainer}>
                      <Text style={styles.rateInfoText}>
                        1 {baseCurrency.code} ={" "}
                        {(1 / exchangeRates[selectedCurrency.code]).toFixed(4)}{" "}
                        {selectedCurrency.code}
                      </Text>
                      <Text style={styles.rateInfoText}>
                        1 {selectedCurrency.code} ={" "}
                        {exchangeRates[selectedCurrency.code].toFixed(2)}{" "}
                        {baseCurrency.code}
                      </Text>
                    </View>
                  )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const sections = [
    {
      title: "General",
      items: [
        {
          id: "language",
          icon: Globe,
          label: "Language",
          type: "action",
          badge: locale === "en" ? "English" : "العربية",
          onPress: handleLanguageChange,
        },
        {
          id: "currency",
          icon: DollarSign,
          label: "Currency",
          type: "action",
          badge: selectedCurrency
            ? `${selectedCurrency.symbol} ${selectedCurrency.code}`
            : "Loading...",
          onPress: () => setCurrencyModalVisible(true),
        },
        {
          id: "customizeHomepage",
          icon: Layout,
          label: "Customize Homepage",
          type: "navigation",
          onPress: () => router.push("/customize-homepage" as any),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          id: "pushNotifications",
          icon: Bell,
          label: "Push Notifications",
          type: "toggle",
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          id: "emailNotifications",
          icon: Mail,
          label: "Email Notifications",
          type: "toggle",
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
        {
          id: "orderUpdates",
          icon: Bell,
          label: "Order Updates",
          type: "toggle",
          value: orderUpdates,
          onToggle: setOrderUpdates,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          icon: HelpCircle,
          label: "Help & Support",
          type: "navigation",
          onPress: () => Linking.openURL("mailto:support@beautyapp.com"),
        },
        {
          id: "contact",
          icon: Mail,
          label: "Contact Us",
          type: "navigation",
          badge: "support@beautyapp.com",
          onPress: () => Linking.openURL("mailto:support@beautyapp.com"),
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          id: "privacy",
          icon: Shield,
          label: "Privacy Policy",
          type: "navigation",
          onPress: () =>
            Alert.alert(
              "Privacy Policy",
              "Your privacy policy content here...",
            ),
        },
        {
          id: "terms",
          icon: FileText,
          label: "Terms & Conditions",
          type: "navigation",
          onPress: () =>
            Alert.alert("Terms & Conditions", "Your terms content here..."),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          id: "about",
          icon: Info,
          label: "About App",
          type: "navigation",
          badge: "v1.0.0",
          onPress: () => Alert.alert("About", "Your about content here..."),
        },
        {
          id: "rate",
          icon: Star,
          label: "Rate Our App",
          type: "navigation",
          onPress: () => Alert.alert("Rate", "Rate our app..."),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    const Icon = item.icon;

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.settingItem,
          pressed && styles.settingItemPressed,
        ]}
        onPress={item.type === "toggle" ? undefined : item.onPress}
        disabled={item.id === "currency" && isLoading}
      >
        <View style={styles.settingItemLeft}>
          <View style={styles.iconContainer}>
            <Icon size={20} color={Colors.primary} />
          </View>
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>

        <View style={styles.settingItemRight}>
          {item.badge && <Text style={styles.badge}>{item.badge}</Text>}

          {item.type === "toggle" && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          )}

          {(item.type === "navigation" || item.type === "action") && (
            <ChevronRight size={20} color={Colors.textSecondary} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerBackTitle: "Back" }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {sections.map((section) => (
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

          <Text style={styles.footerText}>Made with ❤️ for Beauty Lovers</Text>
        </ScrollView>

        <CurrencyModal />
      </View>
    </>
  );
}

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
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingItemPressed: {
    backgroundColor: Colors.cardBackground,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  settingItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "60%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currencyList: {
    padding: 16,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  currencyItemSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    width: 40,
    textAlign: "center",
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  currencyName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  currencyPreview: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  currencyPreviewInverse: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicatorText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  exchangeRateContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  exchangeRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exchangeRateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  refreshButton: {
    padding: 4,
  },
  exchangeRateSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  exchangeRateDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  exchangeRateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  exchangeRateCurrency: {
    fontSize: 14,
    color: Colors.text,
  },
  exchangeRateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  previewContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  basePriceText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  convertedPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  rateInfoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    alignItems: "center",
  },
  rateInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  previewPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewPriceText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  convertedPreview: {
    marginTop: 8,
  },
  convertedPreviewText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});

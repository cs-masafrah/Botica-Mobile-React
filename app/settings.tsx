// app/settings.tsx - Fixed with proper function ordering
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
  X,
  Check,
  TrendingUp,
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
} from "react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

type SettingItem = {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  type: "toggle" | "navigation" | "action";
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
  const { t, locale, changeLanguage, isRTL } = useLanguage();
  const {
    currencies,
    currentCurrency,
    baseCurrency,
    setCurrency,
    formatPrice,
  } = useCurrency();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // ========== HANDLER FUNCTIONS (Declared before they're used) ==========

  const handleLanguageChange = () => {
    Alert.alert(t("changeLanguage"), t("selectLanguage"), [
      {
        text: "English",
        onPress: () => changeLanguage("en"),
      },
      {
        text: "العربية",
        onPress: () => changeLanguage("ar"),
      },
      {
        text: t("cancel"),
        style: "cancel",
      },
    ]);
  };

  const handleCurrencyPress = () => {
    setCurrencyModalVisible(true);
  };

  const handleCurrencySelect = (currency: any) => {
    setCurrency(currency);
    setCurrencyModalVisible(false);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t("privacyPolicy"), t("privacyPolicyText"), [
      { text: t("ok") },
    ]);
  };

  const handleTermsConditions = () => {
    Alert.alert(t("termsConditions"), t("termsConditionsText"), [
      { text: t("ok") },
    ]);
  };

  const handleHelpSupport = () => {
    Linking.openURL("mailto:support@beautyapp.com");
  };

  const handleAbout = () => {
    Alert.alert(t("aboutApp"), t("aboutAppText"), [{ text: t("ok") }]);
  };

  const handleRateApp = () => {
    Alert.alert(t("rateOurApp"), t("rateAppMessage"), [
      {
        text: t("rateNow"),
        onPress: () => {
          Alert.alert(t("thankYou"), t("appStoreRedirect"));
        },
      },
      {
        text: t("maybeLater"),
        style: "cancel",
      },
    ]);
  };

  // ========== SECTIONS ARRAY (Now after all handlers are declared) ==========

  const sections: SettingSection[] = [
    {
      title: t("general"),
      items: [
        {
          id: "language",
          icon: Globe,
          label: t("language"),
          type: "action",
          badge: locale === "en" ? t("english") : t("arabic"),
          onPress: handleLanguageChange,
        },
        {
          id: "currency",
          icon: DollarSign,
          label: t("currency"),
          type: "action",
          badge: currentCurrency
            ? `${currentCurrency.code} (${currentCurrency.symbol})`
            : "USD ($)",
          onPress: handleCurrencyPress,
        },
        {
          id: "customizeHomepage",
          icon: Layout,
          label: t("customizeHomepage"),
          type: "navigation",
          onPress: () => router.push("/customize-homepage" as any),
        },
      ],
    },

    {
      title: t("notifications"),
      items: [
        {
          id: "pushNotifications",
          icon: Bell,
          label: t("pushNotifications"),
          type: "toggle",
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          id: "orderUpdates",
          icon: Bell,
          label: t("orderUpdates"),
          type: "toggle",
          value: orderUpdates,
          onToggle: setOrderUpdates,
        },
        {
          id: "emailNotifications",
          icon: Mail,
          label: t("emailNotifications"),
          type: "toggle",
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
      ],
    },
    {
      title: t("support"),
      items: [
        {
          id: "help",
          icon: HelpCircle,
          label: t("helpSupport"),
          type: "navigation",
          onPress: handleHelpSupport,
        },
        {
          id: "contact",
          icon: Mail,
          label: t("contactUs"),
          type: "navigation",
          badge: "support@beautyapp.com",
          onPress: () => Linking.openURL("mailto:support@beautyapp.com"),
        },
      ],
    },
    {
      title: t("legal"),
      items: [
        {
          id: "privacy",
          icon: Shield,
          label: t("privacyPolicy"),
          type: "navigation",
          onPress: handlePrivacyPolicy,
        },
        {
          id: "terms",
          icon: FileText,
          label: t("termsConditions"),
          type: "navigation",
          onPress: handleTermsConditions,
        },
      ],
    },
    {
      title: t("about"),
      items: [
        {
          id: "about",
          icon: Info,
          label: t("aboutApp"),
          type: "navigation",
          badge: "v1.0.0",
          onPress: handleAbout,
        },
        {
          id: "rate",
          icon: Star,
          label: t("rateOurApp"),
          type: "navigation",
          onPress: handleRateApp,
        },
      ],
    },
  ];

  // ========== HELPER FUNCTIONS for Currency Modal ==========

  const getEquivalentAmount = (currency: any) => {
    if (!baseCurrency) return "";

    if (currency.code === baseCurrency.code) {
      return `1 ${baseCurrency.code} = 1 ${currency.code}`;
    }

    if (currency.exchangeRate) {
      return `1 ${baseCurrency.code} = ${currency.exchangeRate.rate} ${currency.code}`;
    }

    return "";
  };

  const getExampleConversion = (currency: any) => {
    if (!baseCurrency) return "";

    const exampleAmount = 100;

    if (currency.code === baseCurrency.code) {
      return formatPrice(exampleAmount);
    }

    if (currency.exchangeRate) {
      const converted = exampleAmount * currency.exchangeRate.rate;
      return `${formatPrice(exampleAmount)} = ${currency.symbol}${converted.toFixed(2)}`;
    }

    return "";
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
          isRTL && styles.settingItemRTL,
        ]}
        onPress={item.type === "toggle" ? undefined : item.onPress}
      >
        <View
          style={[styles.settingItemLeft, isRTL && styles.settingItemLeftRTL]}
        >
          <View
            style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}
          >
            <Icon size={20} color={Colors.primary} />
          </View>
          <Text style={[styles.settingLabel, isRTL && styles.settingLabelRTL]}>
            {item.label}
          </Text>
        </View>

        <View
          style={[styles.settingItemRight, isRTL && styles.settingItemRightRTL]}
        >
          {item.badge && (
            <Text style={[styles.badge, isRTL && styles.badgeRTL]}>
              {item.badge}
            </Text>
          )}

          {item.type === "toggle" && item.onToggle && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.border}
            />
          )}

          {item.type === "navigation" && (
            <ChevronRight
              size={20}
              color={Colors.textSecondary}
              style={isRTL && { transform: [{ scaleX: -1 }] }}
            />
          )}

          {item.type === "action" && (
            <ChevronRight
              size={20}
              color={Colors.textSecondary}
              style={isRTL && { transform: [{ scaleX: -1 }] }}
            />
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
      <View style={[styles.modalOverlay, isRTL && styles.modalOverlayRTL]}>
        <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
            <View
              style={[
                styles.modalHeaderLeft,
                isRTL && styles.modalHeaderLeftRTL,
              ]}
            >
              <DollarSign size={24} color={Colors.primary} />
              <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
                {t("selectCurrency")}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                isRTL && styles.modalCloseButtonRTL,
              ]}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Base Currency Info */}
          {baseCurrency && (
            <View
              style={[
                styles.baseCurrencyInfo,
                isRTL && styles.baseCurrencyInfoRTL,
              ]}
            >
              <View
                style={[
                  styles.baseCurrencyBadge,
                  isRTL && styles.baseCurrencyBadgeRTL,
                ]}
              >
                <TrendingUp size={16} color={Colors.white} />
                <Text
                  style={[
                    styles.baseCurrencyBadgeText,
                    isRTL && styles.baseCurrencyBadgeTextRTL,
                  ]}
                >
                  {t("baseCurrency")}
                </Text>
              </View>
              <Text
                style={[
                  styles.baseCurrencyText,
                  isRTL && styles.baseCurrencyTextRTL,
                ]}
              >
                {baseCurrency.name} ({baseCurrency.code})
              </Text>
              <Text
                style={[
                  styles.baseCurrencyRate,
                  isRTL && styles.baseCurrencyRateRTL,
                ]}
              >
                {t("baseCurrencyRate", { code: baseCurrency.code })}
              </Text>
            </View>
          )}

          {/* Currency List */}
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.currencyList,
              isRTL && styles.currencyListRTL,
            ]}
            renderItem={({ item }) => {
              const isSelected = currentCurrency?.id === item.id;
              const isBaseCurrency = baseCurrency?.id === item.id;

              return (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    isSelected && styles.currencyItemSelected,
                    isRTL && styles.currencyItemRTL,
                  ]}
                  onPress={() => handleCurrencySelect(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.currencyItemLeft,
                      isRTL && styles.currencyItemLeftRTL,
                    ]}
                  >
                    <View
                      style={[
                        styles.currencySymbolContainer,
                        isRTL && styles.currencySymbolContainerRTL,
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencySymbol,
                          isRTL && styles.currencySymbolRTL,
                        ]}
                      >
                        {item.symbol}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.currencyInfo,
                        isRTL && styles.currencyInfoRTL,
                      ]}
                    >
                      <View
                        style={[
                          styles.currencyNameRow,
                          isRTL && styles.currencyNameRowRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencyCode,
                            isRTL && styles.currencyCodeRTL,
                          ]}
                        >
                          {item.code}
                        </Text>
                        {isBaseCurrency && (
                          <View
                            style={[
                              styles.baseBadge,
                              isRTL && styles.baseBadgeRTL,
                            ]}
                          >
                            <Text
                              style={[
                                styles.baseBadgeText,
                                isRTL && styles.baseBadgeTextRTL,
                              ]}
                            >
                              {t("base")}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.currencyName,
                          isRTL && styles.currencyNameRTL,
                        ]}
                      >
                        {item.name}
                      </Text>

                      {/* Exchange Rate Info */}
                      {item.exchangeRate && !isBaseCurrency && (
                        <View
                          style={[
                            styles.rateContainer,
                            isRTL && styles.rateContainerRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.rateText,
                              isRTL && styles.rateTextRTL,
                            ]}
                          >
                            {t("exchangeRate", {
                              baseCode: baseCurrency?.code,
                              rate: item.exchangeRate.rate,
                              code: item.code,
                            })}
                          </Text>
                          <Text
                            style={[
                              styles.exampleText,
                              isRTL && styles.exampleTextRTL,
                            ]}
                          >
                            {t("exampleConversion", {
                              amount: "100",
                              baseCode: baseCurrency?.code,
                              symbol: item.symbol,
                              converted: (100 * item.exchangeRate.rate).toFixed(
                                2,
                              ),
                            })}
                          </Text>
                        </View>
                      )}

                      {isBaseCurrency && (
                        <View
                          style={[
                            styles.rateContainer,
                            isRTL && styles.rateContainerRTL,
                          ]}
                        >
                          <Text
                            style={[
                              styles.rateText,
                              isRTL && styles.rateTextRTL,
                            ]}
                          >
                            {t("baseCurrency")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkmarkContainer,
                        isRTL && styles.checkmarkContainerRTL,
                      ]}
                    >
                      <Check size={20} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* Footer Note */}
          <View style={[styles.modalFooter, isRTL && styles.modalFooterRTL]}>
            <Text
              style={[
                styles.modalFooterText,
                isRTL && styles.modalFooterTextRTL,
              ]}
            >
              {t("currencyModalNote")}
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
          title: t("settings"),
          headerBackTitle: t("back"),
        }}
      />
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={[styles.section, isRTL && styles.sectionRTL]}
            >
              <Text
                style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
              >
                {section.title}
              </Text>
              <View
                style={[styles.settingsCard, isRTL && styles.settingsCardRTL]}
              >
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    {renderSettingItem(item)}
                    {itemIndex < section.items.length - 1 && (
                      <View
                        style={[styles.divider, isRTL && styles.dividerRTL]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          <Text style={[styles.footerText, isRTL && styles.footerTextRTL]}>
            {t("madeWithLove")}
          </Text>
        </ScrollView>
      </View>

      {/* Currency Selection Modal */}
      <CurrencyModal />
    </>
  );
}

// All styles with RTL support
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
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
  sectionRTL: {
    // textAlign: "left",
    // alignSelf: "flex-start",
    // alignContent: "flex-start",
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
  sectionTitleRTL: {
    textAlign: "left",
    marginLeft: 0,
    marginRight: 4,
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
  settingsCardRTL: {},
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingItemRTL: {
    // flexDirection: "row-reverse",
  },
  settingItemPressed: {
    backgroundColor: Colors.cardBackground,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemLeftRTL: {},
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  settingLabelRTL: {
    textAlign: "left",
  },
  settingItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingItemRightRTL: {
    flexDirection: "row-reverse",
  },
  badge: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  badgeRTL: {
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 68,
  },
  dividerRTL: {
    marginLeft: 0,
    marginRight: 68,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  footerTextRTL: {
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayRTL: {},
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "80%",
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalContentRTL: {
    direction: "rtl",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalHeaderLeftRTL: {
    // flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  modalTitleRTL: {
    textAlign: "right",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonRTL: {},
  baseCurrencyInfo: {
    backgroundColor: Colors.borderLight,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  baseCurrencyInfoRTL: {},
  baseCurrencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  baseCurrencyBadgeRTL: {
    // flexDirection: "row-reverse",
    alignSelf: "flex-end",
  },
  baseCurrencyBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  baseCurrencyBadgeTextRTL: {
    textAlign: "right",
  },
  baseCurrencyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  baseCurrencyTextRTL: {
    textAlign: "right",
  },
  baseCurrencyRate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  baseCurrencyRateRTL: {
    textAlign: "right",
  },
  currencyList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  currencyListRTL: {},
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  currencyItemRTL: {
    // flexDirection: "row-reverse",
  },
  currencyItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  currencyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  currencyItemLeftRTL: {
    // flexDirection: "row-reverse",
  },
  currencySymbolContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  currencySymbolContainerRTL: {},
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  currencySymbolRTL: {},
  currencyInfo: {
    flex: 1,
  },
  currencyInfoRTL: {
    alignItems: "flex-end",
  },
  currencyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  currencyNameRowRTL: {
    // flexDirection: "row-reverse",
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  currencyCodeRTL: {
    textAlign: "right",
  },
  baseBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  baseBadgeRTL: {},
  baseBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  baseBadgeTextRTL: {
    textAlign: "right",
  },
  currencyName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  currencyNameRTL: {
    textAlign: "right",
  },
  rateContainer: {
    marginTop: 2,
  },
  rateContainerRTL: {},
  rateText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
  },
  rateTextRTL: {
    textAlign: "right",
  },
  exampleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exampleTextRTL: {
    textAlign: "right",
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkContainerRTL: {},
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 8,
  },
  modalFooterRTL: {},
  modalFooterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalFooterTextRTL: {
    textAlign: "center",
  },
});

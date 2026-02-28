import {
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Package,
} from "lucide-react-native";
import React, { useState, useCallback, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import {
  APP_CURRENCY,
  convertCurrency,
  formatPrice,
  parseFormattedPrice,
} from "@/utils/currency";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CartScreen() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    shippingDiscounts,
    applicableShippingDiscount,
    currencyCode,
    getDiscountThreshold,
    loadCart,
    isLoading,
    cartDetails,
    hasError,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const displayCurrency = currencyCode || APP_CURRENCY;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCart(true);
    } catch (error) {
      Alert.alert(t("refreshFailed"), t("couldNotRefreshCart"));
    } finally {
      setRefreshing(false);
    }
  }, [loadCart, t]);

  const handleManualRefresh = async () => {
    setManualLoading(true);
    try {
      await loadCart(true);
    } catch (error) {
      Alert.alert(t("refreshFailed"), t("couldNotRefreshCart"));
    } finally {
      setManualLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(t("signInRequired"), t("pleaseSignInToCheckout"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("signIn"), onPress: () => router.push("/login") },
      ]);
      return;
    }
    router.push("/checkout");
  };

  const handleContinueShopping = () => {
    router.push("/");
  };

  // Loading state
  if (isLoading || manualLoading) {
    return (
      <View
        style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
      >
        <View style={styles.loadingIconWrapper}>
          <ShoppingBag size={40} color={Colors.primary} />
        </View>
        <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
          {manualLoading ? t("refreshingCart") : t("loadingCart")}
        </Text>
        <Text
          style={[styles.loadingSubtext, isRTL && styles.loadingSubtextRTL]}
        >
          {t("pleaseWait")}
        </Text>
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
        <View style={styles.errorIconWrapper}>
          <AlertCircle size={48} color={Colors.error} />
        </View>
        <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
          {t("unableToLoadCart")}
        </Text>
        <Text style={[styles.errorSubtitle, isRTL && styles.errorSubtitleRTL]}>
          {t("errorLoadingCartMessage")}
        </Text>
        <View style={[styles.errorActions, isRTL && styles.errorActionsRTL]}>
          <Pressable
            onPress={handleManualRefresh}
            style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
            disabled={manualLoading}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text
              style={[
                styles.retryButtonText,
                isRTL && styles.retryButtonTextRTL,
              ]}
            >
              {manualLoading ? t("retrying") : t("retry")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleContinueShopping}
            style={[styles.browseButton, isRTL && styles.browseButtonRTL]}
          >
            <Text
              style={[
                styles.browseButtonText,
                isRTL && styles.browseButtonTextRTL,
              ]}
            >
              {t("continueShopping")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}>
        <View style={styles.emptyIconWrapper}>
          <ShoppingBag size={56} color={Colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
          {t("cartEmpty")}
        </Text>
        <Text style={[styles.emptySubtitle, isRTL && styles.emptySubtitleRTL]}>
          {t("addProductsToCart")}
        </Text>
        <View style={[styles.emptyActions, isRTL && styles.emptyActionsRTL]}>
          <Pressable
            onPress={handleManualRefresh}
            style={[styles.refreshButton, isRTL && styles.refreshButtonRTL]}
            disabled={manualLoading}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text
              style={[
                styles.refreshButtonText,
                isRTL && styles.refreshButtonTextRTL,
              ]}
            >
              {manualLoading ? t("refreshing") : t("refreshCart")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleContinueShopping}
            style={[styles.shopButton, isRTL && styles.shopButtonRTL]}
          >
            <Text
              style={[styles.shopButtonText, isRTL && styles.shopButtonTextRTL]}
            >
              {t("browseProducts")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.borderLight, Colors.background, Colors.white]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
          <View style={[styles.headerLeft, isRTL && styles.headerLeftRTL]}>
            <View style={styles.headerIconWrapper}>
              <ShoppingBag size={22} color={Colors.primary} />
            </View>
            <View>
              <Text
                style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}
              >
                {t("myCart")}
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  isRTL && styles.headerSubtitleRTL,
                ]}
              >
                {items.length} {items.length === 1 ? t("item") : t("items")}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleManualRefresh}
            style={[styles.headerRefresh, isRTL && styles.headerRefreshRTL]}
          >
            <RefreshCw size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Cart Items */}
        <View
          style={[styles.itemsContainer, isRTL && styles.itemsContainerRTL]}
        >
          {items.map((item) => {
            const isUnavailable =
              !item.product.variantId || !item.product.inStock;
            const convertedUnitPrice = convertCurrency(
              item.product.price,
              item.product.currencyCode,
              displayCurrency,
            );

            return (
              <View
                key={`${item.id}-${item.quantity}`}
                style={[styles.cartItem, isRTL && styles.cartItemRTL]}
              >
                {item.product.image ? (
                  <Image
                    source={{ uri: item.product.image }}
                    style={[
                      styles.itemImage,
                      isUnavailable && styles.itemImageUnavailable,
                      isRTL && styles.itemImageRTL,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.itemImage,
                      styles.placeholderImage,
                      isUnavailable && styles.itemImageUnavailable,
                      isRTL && styles.itemImageRTL,
                    ]}
                  >
                    <Text style={styles.placeholderText}>
                      {item.product.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View
                  style={[styles.itemDetails, isRTL && styles.itemDetailsRTL]}
                >
                  <View
                    style={[styles.itemHeader, isRTL && styles.itemHeaderRTL]}
                  >
                    <View
                      style={[styles.itemInfo, isRTL && styles.itemInfoRTL]}
                    >
                      {item.product.brand && (
                        <Text
                          style={[
                            styles.brandText,
                            isRTL && styles.brandTextRTL,
                          ]}
                        >
                          {item.product.brand}
                        </Text>
                      )}
                      <Text
                        style={[styles.itemName, isRTL && styles.itemNameRTL]}
                        numberOfLines={2}
                      >
                        {item.product.name}
                      </Text>
                      {isUnavailable && (
                        <View
                          style={[
                            styles.unavailableBadge,
                            isRTL && styles.unavailableBadgeRTL,
                          ]}
                        >
                          <AlertCircle size={12} color={Colors.error} />
                          <Text
                            style={[
                              styles.unavailableText,
                              isRTL && styles.unavailableTextRTL,
                            ]}
                          >
                            {t("notAvailable")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      style={[
                        styles.deleteButton,
                        isRTL && styles.deleteButtonRTL,
                      ]}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.itemPriceRow,
                      isRTL && styles.itemPriceRowRTL,
                    ]}
                  >
                    <Text
                      style={[styles.itemPrice, isRTL && styles.itemPriceRTL]}
                    >
                      {formatPrice(convertedUnitPrice, displayCurrency)}
                    </Text>
                    <Text
                      style={[
                        styles.itemTotalLabel,
                        isRTL && styles.itemTotalLabelRTL,
                      ]}
                    >
                      {t("total")}:{" "}
                      <Text
                        style={[
                          styles.itemTotalValue,
                          isRTL && styles.itemTotalValueRTL,
                        ]}
                      >
                        {formatPrice(
                          convertedUnitPrice * item.quantity,
                          displayCurrency,
                        )}
                      </Text>
                    </Text>
                  </View>

                  {!isUnavailable && (
                    <View
                      style={[
                        styles.quantityContainer,
                        isRTL && styles.quantityContainerRTL,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quantityLabel,
                          isRTL && styles.quantityLabelRTL,
                        ]}
                      >
                        {t("qty")}:
                      </Text>
                      <View
                        style={[
                          styles.quantityControls,
                          isRTL && styles.quantityControlsRTL,
                        ]}
                      >
                        <Pressable
                          style={[
                            styles.quantityButton,
                            item.quantity <= 1 && styles.quantityButtonDisabled,
                            isRTL && styles.quantityButtonRTL,
                          ]}
                          onPress={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus
                            size={14}
                            color={
                              item.quantity <= 1
                                ? Colors.lightGray
                                : Colors.text
                            }
                          />
                        </Pressable>
                        <Text
                          style={[
                            styles.quantityText,
                            isRTL && styles.quantityTextRTL,
                          ]}
                        >
                          {item.quantity}
                        </Text>
                        <Pressable
                          style={[
                            styles.quantityButton,
                            isRTL && styles.quantityButtonRTL,
                          ]}
                          onPress={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={14} color={Colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, isRTL && styles.footerRTL]}>
        {/* Shipping Progress */}
        {applicableShippingDiscount ? (
          <View
            style={[
              styles.freeShippingBadge,
              isRTL && styles.freeShippingBadgeRTL,
            ]}
          >
            <Package size={18} color={Colors.primary} />
            <Text
              style={[
                styles.freeShippingText,
                isRTL && styles.freeShippingTextRTL,
              ]}
            >
              {t("freeShippingQualified")}
            </Text>
          </View>
        ) : shippingDiscounts.length > 0 ? (
          (() => {
            const nextDiscountEntry = shippingDiscounts
              .map((discount) => ({
                discount,
                threshold: getDiscountThreshold(),
              }))
              .filter((entry) => subtotal < entry.threshold)
              .sort((a, b) => a.threshold - b.threshold)[0];

            if (nextDiscountEntry) {
              const remaining = Math.max(
                0,
                nextDiscountEntry.threshold - subtotal,
              );
              const progress = Math.min(
                (subtotal / nextDiscountEntry.threshold) * 100,
                100,
              );

              return (
                <View
                  style={[
                    styles.shippingProgressContainer,
                    isRTL && styles.shippingProgressContainerRTL,
                  ]}
                >
                  <View
                    style={[
                      styles.progressHeader,
                      isRTL && styles.progressHeaderRTL,
                    ]}
                  >
                    <Package size={16} color={Colors.primary} />
                    <Text
                      style={[
                        styles.progressHeaderText,
                        isRTL && styles.progressHeaderTextRTL,
                      ]}
                    >
                      {t("add")}{" "}
                      <Text style={styles.progressAmount}>
                        {formatPrice(remaining, displayCurrency)}
                      </Text>{" "}
                      {t("forFreeShipping")}
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            }
            return null;
          })()
        ) : null}

        {/* Order Summary */}
        <View style={[styles.orderSummary, isRTL && styles.orderSummaryRTL]}>
          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text
              style={[styles.summaryLabel, isRTL && styles.summaryLabelRTL]}
            >
              {t("subtotal")}
            </Text>
            <Text
              style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}
            >
              {formatPrice(subtotal, displayCurrency)}
            </Text>
          </View>

          {cartDetails?.discountAmount > 0 && (
            <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
              <Text
                style={[styles.summaryLabel, isRTL && styles.summaryLabelRTL]}
              >
                {t("discount")}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  styles.discountValue,
                  isRTL && styles.summaryValueRTL,
                ]}
              >
                -{formatPrice(cartDetails.discountAmount, displayCurrency)}
              </Text>
            </View>
          )}

          {cartDetails?.taxTotal > 0 && (
            <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
              <Text
                style={[styles.summaryLabel, isRTL && styles.summaryLabelRTL]}
              >
                {t("tax")}
              </Text>
              <Text
                style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}
              >
                {formatPrice(cartDetails.taxTotal, displayCurrency)}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.summaryRow,
              styles.grandTotalRow,
              isRTL && styles.summaryRowRTL,
            ]}
          >
            <Text
              style={[
                styles.grandTotalLabel,
                isRTL && styles.grandTotalLabelRTL,
              ]}
            >
              {t("total")}
            </Text>
            <Text
              style={[
                styles.grandTotalValue,
                isRTL && styles.grandTotalValueRTL,
              ]}
            >
              {formatPrice(
                cartDetails?.grandTotal || subtotal,
                displayCurrency,
              )}
            </Text>
          </View>
        </View>

        {/* Authentication reminder for guests */}
        {!isAuthenticated && (
          <View style={[styles.authReminder, isRTL && styles.authReminderRTL]}>
            <AlertCircle size={16} color={Colors.warning} />
            <Text
              style={[
                styles.authReminderText,
                isRTL && styles.authReminderTextRTL,
              ]}
            >
              {t("signInToCompletePurchase")}
            </Text>
          </View>
        )}

        {/* Checkout Button */}
        <Pressable
          style={[
            styles.checkoutButton,
            !isAuthenticated && styles.checkoutButtonDisabled,
            isRTL && styles.checkoutButtonRTL,
          ]}
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text
            style={[
              styles.checkoutButtonText,
              isRTL && styles.checkoutButtonTextRTL,
            ]}
          >
            {isAuthenticated ? t("proceedToCheckout") : t("signInToCheckout")}
          </Text>
          <ArrowRight
            size={20}
            color={Colors.white}
            style={isRTL && { transform: [{ scaleX: -1 }] }}
          />
        </Pressable>
      </View>
    </View>
  );
}

// Add RTL styles at the end
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingContainerRTL: {},
  loadingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  loadingTextRTL: {
    textAlign: "right",
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingSubtextRTL: {
    textAlign: "right",
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorContainerRTL: {},
  errorIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  errorTitleRTL: {
    textAlign: "right",
  },
  errorSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  errorSubtitleRTL: {
    textAlign: "right",
  },
  errorActions: {
    gap: 12,
    width: "100%",
  },
  errorActionsRTL: {},
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonRTL: {
    flexDirection: "row-reverse",
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  retryButtonTextRTL: {
    textAlign: "right",
  },
  browseButton: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  browseButtonRTL: {},
  browseButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  browseButtonTextRTL: {
    textAlign: "right",
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  emptyContainerRTL: {},
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptyTitleRTL: {
    textAlign: "right",
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  emptySubtitleRTL: {
    textAlign: "right",
  },
  emptyActions: {
    gap: 12,
    width: "100%",
  },
  emptyActionsRTL: {},
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  refreshButtonRTL: {
    flexDirection: "row-reverse",
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButtonTextRTL: {
    textAlign: "right",
  },
  shopButton: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  shopButtonRTL: {},
  shopButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  shopButtonTextRTL: {
    textAlign: "right",
  },
  // Header
  header: {
    position: "relative",
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContentRTL: {
    // flexDirection: "row-reverse",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerLeftRTL: {
    flexDirection: "row-reverse",
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerTitleRTL: {
    textAlign: "right",
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerSubtitleRTL: {
    textAlign: "right",
  },
  headerRefresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRefreshRTL: {},
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemsContainer: {
    padding: 16,
  },
  itemsContainerRTL: {},
  // Cart Item
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cartItemRTL: {
    flexDirection: "row-reverse",
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
  },
  itemImageRTL: {
    marginLeft: 0,
    marginRight: 14,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  itemImageUnavailable: {
    opacity: 0.5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemDetailsRTL: {
    marginLeft: 0,
    marginRight: 14,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemHeaderRTL: {
    flexDirection: "row-reverse",
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemInfoRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandTextRTL: {
    textAlign: "right",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  itemNameRTL: {
    textAlign: "right",
  },
  unavailableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  unavailableBadgeRTL: {
    alignSelf: "flex-end",
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.error,
  },
  unavailableTextRTL: {
    textAlign: "right",
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonRTL: {},
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemPriceRowRTL: {
    flexDirection: "row-reverse",
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primary,
  },
  itemPriceRTL: {
    textAlign: "right",
  },
  itemTotalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemTotalLabelRTL: {
    textAlign: "right",
  },
  itemTotalValue: {
    fontWeight: "600",
    color: Colors.text,
  },
  itemTotalValueRTL: {
    textAlign: "right",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityContainerRTL: {
    flexDirection: "row-reverse",
  },
  quantityLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  quantityLabelRTL: {
    textAlign: "right",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 4,
  },
  quantityControlsRTL: {
    flexDirection: "row-reverse",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  quantityButtonRTL: {},
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginHorizontal: 14,
    minWidth: 20,
    textAlign: "center",
  },
  quantityTextRTL: {},
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerRTL: {},
  freeShippingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freeShippingBadgeRTL: {
    flexDirection: "row-reverse",
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  freeShippingTextRTL: {
    textAlign: "right",
  },
  shippingProgressContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shippingProgressContainerRTL: {},
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  progressHeaderRTL: {
    flexDirection: "row-reverse",
  },
  progressHeaderText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  progressHeaderTextRTL: {
    textAlign: "right",
  },
  progressAmount: {
    fontWeight: "700",
    color: Colors.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  orderSummary: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderSummaryRTL: {},
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryRowRTL: {
    flexDirection: "row-reverse",
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryLabelRTL: {
    textAlign: "right",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  summaryValueRTL: {
    textAlign: "right",
  },
  discountValue: {
    color: Colors.primary,
  },
  grandTotalRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  grandTotalLabelRTL: {
    textAlign: "right",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  grandTotalValueRTL: {
    textAlign: "right",
  },
  authReminder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  authReminderRTL: {
    flexDirection: "row-reverse",
  },
  authReminderText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: "500",
  },
  authReminderTextRTL: {
    textAlign: "right",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 56,
  },
  checkoutButtonRTL: {
    flexDirection: "row-reverse",
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.secondary,
    opacity: 0.9,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  checkoutButtonTextRTL: {
    textAlign: "right",
  },
});

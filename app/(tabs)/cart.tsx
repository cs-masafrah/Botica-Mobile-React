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
import { useAuth } from "@/contexts/AuthContext"; // Add this import

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

  const { isAuthenticated } = useAuth(); // Add authentication hook

  const [refreshing, setRefreshing] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const displayCurrency = currencyCode || APP_CURRENCY;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCart(true);
    } catch (error) {
      Alert.alert("Refresh Failed", "Could not refresh cart. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [loadCart]);

  const handleManualRefresh = async () => {
    setManualLoading(true);
    try {
      await loadCart(true);
    } catch (error) {
      Alert.alert("Refresh Failed", "Could not refresh cart. Please try again.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to sign-in page if not logged in
      Alert.alert(
        "Sign In Required",
        "Please sign in to proceed to checkout",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/login") }
        ]
      );
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
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconWrapper}>
          <ShoppingBag size={40} color={Colors.primary} />
        </View>
        <Text style={styles.loadingText}>
          {manualLoading ? "Refreshing cart..." : "Loading cart..."}
        </Text>
        <Text style={styles.loadingSubtext}>Please wait</Text>
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconWrapper}>
          <AlertCircle size={48} color={Colors.error} />
        </View>
        <Text style={styles.errorTitle}>Unable to Load Cart</Text>
        <Text style={styles.errorSubtitle}>
          There was an error loading your cart. Please try again.
        </Text>
        <View style={styles.errorActions}>
          <Pressable
            onPress={handleManualRefresh}
            style={styles.retryButton}
            disabled={manualLoading}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text style={styles.retryButtonText}>
              {manualLoading ? "Retrying..." : "Retry"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleContinueShopping}
            style={styles.browseButton}
          >
            <Text style={styles.browseButtonText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <ShoppingBag size={56} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some amazing products to get started!
        </Text>
        <View style={styles.emptyActions}>
          <Pressable
            onPress={handleManualRefresh}
            style={styles.refreshButton}
            disabled={manualLoading}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text style={styles.refreshButtonText}>
              {manualLoading ? "Refreshing..." : "Refresh Cart"}
            </Text>
          </Pressable>
          <Pressable onPress={handleContinueShopping} style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.borderLight, Colors.background, Colors.white]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <ShoppingBag size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>My Cart</Text>
              <Text style={styles.headerSubtitle}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleManualRefresh} style={styles.headerRefresh}>
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
        <View style={styles.itemsContainer}>
          {items.map((item) => {
            const isUnavailable = !item.product.variantId || !item.product.inStock;
            const convertedUnitPrice = convertCurrency(
              item.product.price,
              item.product.currencyCode,
              displayCurrency
            );

            return (
              <View key={`${item.id}-${item.quantity}`} style={styles.cartItem}>
                {item.product.image ? (
                  <Image
                    source={{ uri: item.product.image }}
                    style={[
                      styles.itemImage,
                      isUnavailable && styles.itemImageUnavailable,
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.itemImage,
                      styles.placeholderImage,
                      isUnavailable && styles.itemImageUnavailable,
                    ]}
                  >
                    <Text style={styles.placeholderText}>
                      {item.product.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      {item.product.brand && (
                        <Text style={styles.brandText}>{item.product.brand}</Text>
                      )}
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      {isUnavailable && (
                        <View style={styles.unavailableBadge}>
                          <AlertCircle size={12} color={Colors.error} />
                          <Text style={styles.unavailableText}>Not available</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </Pressable>
                  </View>

                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                      {formatPrice(convertedUnitPrice, displayCurrency)}
                    </Text>
                    <Text style={styles.itemTotalLabel}>
                      Total:{" "}
                      <Text style={styles.itemTotalValue}>
                        {formatPrice(
                          convertedUnitPrice * item.quantity,
                          displayCurrency
                        )}
                      </Text>
                    </Text>
                  </View>

                  {!isUnavailable && (
                    <View style={styles.quantityContainer}>
                      <Text style={styles.quantityLabel}>Qty:</Text>
                      <View style={styles.quantityControls}>
                        <Pressable
                          style={[
                            styles.quantityButton,
                            item.quantity <= 1 && styles.quantityButtonDisabled,
                          ]}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus
                            size={14}
                            color={item.quantity <= 1 ? Colors.lightGray : Colors.text}
                          />
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
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
      <View style={styles.footer}>
        {/* Shipping Progress */}
        {applicableShippingDiscount ? (
          <View style={styles.freeShippingBadge}>
            <Package size={18} color={Colors.primary} />
            <Text style={styles.freeShippingText}>
              You qualify for free shipping!
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
              const remaining = Math.max(0, nextDiscountEntry.threshold - subtotal);
              const progress = Math.min(
                (subtotal / nextDiscountEntry.threshold) * 100,
                100
              );

              return (
                <View style={styles.shippingProgressContainer}>
                  <View style={styles.progressHeader}>
                    <Package size={16} color={Colors.primary} />
                    <Text style={styles.progressHeaderText}>
                      Add{" "}
                      <Text style={styles.progressAmount}>
                        {formatPrice(remaining, displayCurrency)}
                      </Text>{" "}
                      for free shipping
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              );
            }
            return null;
          })()
        ) : null}

        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(subtotal, displayCurrency)}
            </Text>
          </View>

          {cartDetails?.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{formatPrice(cartDetails.discountAmount, displayCurrency)}
              </Text>
            </View>
          )}

          {cartDetails?.taxTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(cartDetails.taxTotal, displayCurrency)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatPrice(cartDetails?.grandTotal || subtotal, displayCurrency)}
            </Text>
          </View>
        </View>

        {/* Authentication reminder for guests */}
        {!isAuthenticated && (
          <View style={styles.authReminder}>
            <AlertCircle size={16} color={Colors.warning} />
            <Text style={styles.authReminderText}>
              Sign in to complete your purchase
            </Text>
          </View>
        )}

        {/* Checkout Button */}
        <Pressable
          style={[styles.checkoutButton, !isAuthenticated && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutButtonText}>
            {isAuthenticated ? "Proceed to Checkout" : "Sign In to Checkout"}
          </Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
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
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
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
  errorSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  errorActions: {
    gap: 12,
    width: "100%",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  browseButton: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  browseButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
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
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyActions: {
    gap: 12,
    width: "100%",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  shopButton: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  shopButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
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
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
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
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 6,
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
  unavailableText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.error,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primary,
  },
  itemTotalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemTotalValue: {
    fontWeight: "600",
    color: Colors.text,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 4,
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
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
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
  freeShippingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  shippingProgressContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  progressHeaderText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
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
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
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
  authReminderText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: "500",
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
  checkoutButtonDisabled: {
    backgroundColor: Colors.secondary,
    opacity: 0.9,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
});
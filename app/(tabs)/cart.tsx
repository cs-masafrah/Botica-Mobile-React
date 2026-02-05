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
    router.push("/checkout");
  };

  // Loading state
  if (isLoading || manualLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconWrapper}>
          <ShoppingBag size={40} color="#10b981" />
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
          <AlertCircle size={48} color="#ef4444" />
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
            <RefreshCw size={18} color="#ffffff" />
            <Text style={styles.retryButtonText}>
              {manualLoading ? "Retrying..." : "Retry"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/")}
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
          <ShoppingBag size={56} color="#10b981" />
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
            <RefreshCw size={18} color="#ffffff" />
            <Text style={styles.refreshButtonText}>
              {manualLoading ? "Refreshing..." : "Refresh Cart"}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/")} style={styles.shopButton}>
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
          colors={["#ecfdf5", "#f0fdf4", "#ffffff"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrapper}>
              <ShoppingBag size={22} color="#10b981" />
            </View>
            <View>
              <Text style={styles.headerTitle}>My Cart</Text>
              <Text style={styles.headerSubtitle}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleManualRefresh} style={styles.headerRefresh}>
            <RefreshCw size={18} color="#64748b" />
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
            tintColor="#10b981"
            colors={["#10b981"]}
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
                          <AlertCircle size={12} color="#ef4444" />
                          <Text style={styles.unavailableText}>Not available</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={16} color="#ef4444" />
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
                            color={item.quantity <= 1 ? "#cbd5e1" : "#1e293b"}
                          />
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} color="#1e293b" />
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
            <Package size={18} color="#059669" />
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
                    <Package size={16} color="#10b981" />
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

        {/* Checkout Button */}
        <Pressable
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <ArrowRight size={20} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loadingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8fafc",
  },
  errorIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: "#64748b",
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
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  browseButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  browseButtonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8fafc",
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
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
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 14,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  shopButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  shopButtonText: {
    color: "#1e293b",
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
    borderBottomColor: "#d1fae5",
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
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  headerRefresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#94a3b8",
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
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 20,
    marginBottom: 6,
  },
  unavailableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ef4444",
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
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
    color: "#10b981",
  },
  itemTotalLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  itemTotalValue: {
    fontWeight: "600",
    color: "#1e293b",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginHorizontal: 14,
    minWidth: 20,
    textAlign: "center",
  },
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  freeShippingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#d1fae5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  shippingProgressContainer: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  progressHeaderText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
  },
  progressAmount: {
    fontWeight: "700",
    color: "#10b981",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#d1fae5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  orderSummary: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  discountValue: {
    color: "#10b981",
  },
  grandTotalRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: 16,
    height: 56,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
  },
});
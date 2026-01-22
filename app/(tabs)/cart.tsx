import {
  Minus,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Bug,
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
    debugCart,
  } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const displayCurrency = currencyCode || APP_CURRENCY;

  // Debug effect
  useEffect(() => {
    console.log("🔍 [CART SCREEN DEBUG] Current state:", {
      itemsCount: items.length,
      items: items.map((item) => ({
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      })),
      subtotal,
      cartDetails: cartDetails
        ? {
            id: cartDetails.id,
            itemsCount: cartDetails.itemsCount,
            formattedPrice: cartDetails.formattedPrice,
            hasSubTotal: !!cartDetails.formattedPrice?.subTotal,
            subTotalValue: cartDetails.formattedPrice?.subTotal,
            parsedSubTotal: parseFormattedPrice(
              cartDetails.formattedPrice?.subTotal || "0",
            ),
          }
        : null,
    });
  }, [items, subtotal, cartDetails]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("🔄 [CART SCREEN] Pull to refresh");
      await loadCart(true);
    } catch (error) {
      console.error("❌ [CART SCREEN] Failed to refresh cart:", error);
      Alert.alert(
        "Refresh Failed",
        "Could not refresh cart. Please try again.",
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadCart]);

  const handleManualRefresh = async () => {
    setManualLoading(true);
    try {
      console.log("🔄 [CART SCREEN] Manual refresh");
      await loadCart(true);
    } catch (error) {
      console.error("❌ [CART SCREEN] Failed to refresh cart:", error);
      Alert.alert(
        "Refresh Failed",
        "Could not refresh cart. Please try again.",
      );
    } finally {
      setManualLoading(false);
    }
  };

  const handleDebug = async () => {
    console.log("🐛 [CART SCREEN] Debug triggered");
    await debugCart();
    setShowDebug(!showDebug);
  };

  // Show loading state
  if (isLoading || manualLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {manualLoading ? "Refreshing cart..." : "Loading cart..."}
        </Text>
        <Text style={styles.loadingSubtext}>
          Please wait while we load your cart items
        </Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <AlertCircle size={64} color={Colors.error} />
        </View>
        <Text style={styles.errorTitle}>Unable to Load Cart</Text>
        <Text style={styles.errorSubtitle}>
          There was an error loading your cart. Please try again.
        </Text>

        <View style={styles.errorActions}>
          <Pressable
            onPress={handleManualRefresh}
            style={styles.errorButton}
            disabled={manualLoading}
          >
            <RefreshCw size={20} color={Colors.white} />
            <Text style={styles.errorButtonText}>
              {manualLoading ? "Retrying..." : "Retry"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/")}
            style={[styles.errorButton, styles.secondaryButton]}
          >
            <Text style={[styles.errorButtonText, styles.secondaryButtonText]}>
              Continue Shopping
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some amazing products to get started!
        </Text>

        {/* Debug info */}
        {showDebug && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🛠️ Debug Information</Text>
            <Text style={styles.debugText}>
              • ORA Cart ID: {cartDetails?.id || "None"}
            </Text>
            <Text style={styles.debugText}>
              • ORA Items Count: {cartDetails?.itemsCount || 0}
            </Text>
            <Text style={styles.debugText}>
              • ORA Items Qty: {cartDetails?.itemsQty || 0}
            </Text>
            <Text style={styles.debugText}>
              • ORA Items Array: {cartDetails?.items?.length || 0} items
            </Text>
            {cartDetails?.items?.map((item, index) => (
              <Text key={index} style={styles.debugItemText}>
                &nbsp;&nbsp;{index + 1}. ID: {item.id}, Name: {item.name}, Qty:{" "}
                {item.quantity}
              </Text>
            ))}
            <Text style={styles.debugText}>• Local Items: {items.length}</Text>
            <Text style={styles.debugText}>
              • Has Error: {hasError ? "Yes" : "No"}
            </Text>
            <Text style={styles.debugText}>
              • Is Loading: {isLoading ? "Yes" : "No"}
            </Text>
          </View>
        )}

        <View style={styles.emptyActions}>
          <Pressable
            onPress={handleManualRefresh}
            style={styles.refreshButton}
            disabled={manualLoading}
          >
            <RefreshCw
              size={18}
              color={Colors.white}
              style={manualLoading && styles.refreshIconLoading}
            />
            <Text style={styles.refreshButtonText}>
              {manualLoading ? "Refreshing..." : "Refresh Cart"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/")} style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </Pressable>

          <Pressable onPress={handleDebug} style={styles.debugButton}>
            <Bug size={16} color={Colors.textSecondary} />
            <Text style={styles.debugButtonText}>
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShippingStrip />

      {/* Header with debug button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart ({items.length} items)</Text>
        <Pressable onPress={handleDebug} style={styles.debugHeaderButton}>
          <Bug size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
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
        {/* Debug info when showing */}
        {showDebug && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugInfoTitle}>Cart Debug</Text>
            <Text style={styles.debugInfoText}>
              • Local Items: {items.length}
            </Text>
            <Text style={styles.debugInfoText}>
              • Bagisto Items: {cartDetails?.itemsCount || 0}
            </Text>
            <Text style={styles.debugInfoText}>
              • Cart ID: {cartDetails?.id || "None"}
            </Text>
            <Text style={styles.debugInfoText}>
              • Last Updated: {new Date().toLocaleTimeString()}
            </Text>
            {/* Add formatted price debugging */}
            {cartDetails?.formattedPrice && (
              <>
                <Text style={styles.debugInfoText}>
                  • Raw Subtotal: {cartDetails.formattedPrice.subTotal}
                </Text>
                <Text style={styles.debugInfoText}>
                  • Parsed Subtotal:{" "}
                  {parseFormattedPrice(cartDetails.formattedPrice.subTotal)}
                </Text>
                <Text style={styles.debugInfoText}>
                  • Formatted Subtotal:{" "}
                  {formatPrice(
                    cartDetails.formattedPrice.subTotal,
                    displayCurrency,
                  )}
                </Text>
              </>
            )}
          </View>
        )}

        <View style={styles.itemsContainer}>
          {items.map((item) => {
            const isUnavailable =
              !item.product.variantId || !item.product.inStock;
            const convertedUnitPrice = convertCurrency(
              item.product.price,
              item.product.currencyCode,
              displayCurrency,
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
                      {item.product.brand ? (
                        <Text style={styles.brandText}>
                          {item.product.brand}
                        </Text>
                      ) : null}
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      {isUnavailable && (
                        <View style={styles.unavailableBadge}>
                          <AlertCircle size={12} color={Colors.error} />
                          <Text style={styles.unavailableText}>
                            Not available
                          </Text>
                        </View>
                      )}
                      <Text style={styles.itemPrice}>
                        {formatPrice(convertedUnitPrice, displayCurrency)}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Quantity: {item.quantity}
                      </Text>
                      <Text style={styles.itemTotal}>
                        Total:{" "}
                        {formatPrice(
                          convertedUnitPrice * item.quantity,
                          displayCurrency,
                        )}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={18} color={Colors.error} />
                    </Pressable>
                  </View>
                  {!isUnavailable && (
                    <View style={styles.quantityContainer}>
                      <Pressable
                        style={[
                          styles.quantityButton,
                          item.quantity <= 1 && styles.quantityButtonDisabled,
                        ]}
                        onPress={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus
                          size={16}
                          color={
                            item.quantity <= 1
                              ? Colors.textSecondary
                              : Colors.text
                          }
                        />
                      </Pressable>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus size={16} color={Colors.text} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {applicableShippingDiscount ? (
          <View style={styles.freeShippingBadge}>
            <Text style={styles.freeShippingText}>
              🎉 {applicableShippingDiscount.title}! You qualify for free
              shipping!
            </Text>
          </View>
        ) : shippingDiscounts.length > 0 ? (
          (() => {
            const nextDiscountEntry = shippingDiscounts
              .map((discount) => ({
                discount,
                threshold: getDiscountThreshold(discount),
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
                <View style={styles.shippingProgressContainer}>
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress}%` },
                        ]}
                      >
                        <View style={styles.progressBarShine} />
                      </View>
                    </View>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressText}>
                        Add{" "}
                        <Text style={styles.progressTextBold}>
                          {formatPrice(remaining, displayCurrency)}
                        </Text>{" "}
                        more for free shipping!
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
            return <View />;
          })()
        ) : (
          <View />
        )}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalAmount}>
            {formatPrice(subtotal, displayCurrency)}
          </Text>
        </View>

        {cartDetails && (
          <View style={styles.bagistoTotals}>
            <View style={styles.bagistoTotalRow}>
              <Text style={styles.bagistoTotalLabel}>ORA Subtotal:</Text>
              <Text style={styles.bagistoTotalValue}>
                {formatPrice(cartDetails.subTotal, displayCurrency)}
              </Text>
            </View>

            {cartDetails.taxTotal > 0 && (
              <View style={styles.bagistoTotalRow}>
                <Text style={styles.bagistoTotalLabel}>ORA Tax:</Text>
                <Text style={styles.bagistoTotalValue}>
                  {formatPrice(cartDetails.taxTotal, displayCurrency)}
                </Text>
              </View>
            )}

            {cartDetails.discountAmount > 0 && (
              <View style={styles.bagistoTotalRow}>
                <Text style={styles.bagistoTotalLabel}>ORA Discount:</Text>
                <Text style={styles.bagistoTotalValue}>
                  {formatPrice(cartDetails.discountAmount, displayCurrency)}
                </Text>
              </View>
            )}

            <View style={[styles.bagistoTotalRow, styles.bagistoGrandTotal]}>
              <Text style={styles.bagistoTotalLabel}>ORA Grand Total:</Text>
              <Text
                style={[
                  styles.bagistoTotalValue,
                  styles.bagistoGrandTotalValue,
                ]}
              >
                {formatPrice(cartDetails.grandTotal, displayCurrency)}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={styles.checkoutButton}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Pressable>

        <Pressable
          onPress={handleManualRefresh}
          style={styles.bottomRefreshButton}
        >
          <RefreshCw size={16} color={Colors.textSecondary} />
          <Text style={styles.bottomRefreshText}>Refresh Cart</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  debugHeaderButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.error,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 32,
    lineHeight: 22,
  },
  errorActions: {
    gap: 12,
    width: "100%",
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  secondaryButtonText: {
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: Colors.background,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyActions: {
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  refreshIconLoading: {
    transform: [{ rotate: "360deg" }],
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  shopButton: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
    alignItems: "center",
  },
  shopButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
  },
  debugButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  debugContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  debugItemText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    lineHeight: 14,
    fontFamily: "monospace",
  },
  debugInfo: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  debugInfoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#0369a1",
    marginBottom: 8,
  },
  debugInfoText: {
    fontSize: 12,
    color: "#0c4a6e",
    marginBottom: 4,
    lineHeight: 16,
  },
  itemsContainer: {
    padding: 20,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  itemImageUnavailable: {
    opacity: 0.5,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
  },
  brandText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  itemQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  unavailableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.error,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start" as const,
    marginTop: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: "center" as const,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shippingProgressContainer: {
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  progressBarWrapper: {
    position: "relative" as const,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBarBackground: {
    height: 30,
    backgroundColor: "#F0FDF4",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#86EFAC",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    position: "relative" as const,
    minWidth: 60,
  },
  progressBarShine: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  progressTextContainer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#000000",
    textAlign: "center" as const,
  },
  progressTextBold: {
    fontWeight: "900" as const,
    fontSize: 13,
    color: "#000000",
  },
  progressTextAchieved: {
    fontSize: 13,
    fontWeight: "900" as const,
    color: "#000000",
    textAlign: "center" as const,
  },
  progressPercentage: {
    display: "none" as const,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  bagistoTotals: {
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  bagistoTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  bagistoTotalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bagistoTotalValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  bagistoGrandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bagistoGrandTotalValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  checkoutButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  bottomRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
  },
  bottomRefreshText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  freeShippingBadge: {
    backgroundColor: "#D1FAE5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#86EFAC",
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#059669",
    textAlign: "center" as const,
  },
});

// app/order-details.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Package,
  Clock,
  CreditCard,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Layers,
  Receipt,
  Truck,
} from "lucide-react-native";
import { useCart } from "@/contexts/CartContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/currency";

const OrderDetailsScreen = () => {
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  const [reordering, setReordering] = useState(false);
  const { addToCart } = useCart();

  const order = orderData ? JSON.parse(orderData) : null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return Colors.success;
      case "processing":
      case "pending":
        return Colors.warning;
      case "canceled":
      case "cancelled":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return Package;
      case "processing":
        return Truck;
      case "pending":
        return Clock;
      case "canceled":
      case "cancelled":
        return Package;
      default:
        return Package;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleReorder = useCallback(
    async () => {
      if (!order?.items || order.items.length === 0) {
        Alert.alert("Unable to Reorder", "No items found for this order.");
        return;
      }

      setReordering(true);

      try {
        let successCount = 0;
        let failCount = 0;
        const failedItems: string[] = [];

        for (const item of order.items) {
          try {
            const productId = item.product?.id?.toString() || item.id.toString();
            const productType = item.product?.type || "simple";

            const product: Record<string, any> = {
              id: productId,
              productId: productId,
              name: item.name,
              price: item.price,
              sku: item.sku,
              type: productType,
              inStock: true,
              image: "",
              brand: item.sku || "",
              currencyCode: "USD",
            };

            if (productType === "configurable" && item.product?.id) {
              product.selectedConfigurableOption = parseInt(item.product.id, 10);
            }

            const result = await addToCart(product, item.qtyOrdered || 1);

            if (result?.success) {
              successCount++;
            } else {
              failCount++;
              failedItems.push(item.name);
            }
          } catch {
            failCount++;
            failedItems.push(item.name);
          }
        }

        if (failCount === 0) {
          Alert.alert(
            "Reorder Successful",
            `All ${successCount} item${successCount > 1 ? "s" : ""} have been added to your cart.`,
            [
              { text: "Continue Shopping", style: "cancel" },
              { text: "Go to Cart", onPress: () => router.push("/(tabs)/cart") },
            ],
          );
        } else if (successCount > 0) {
          Alert.alert(
            "Partially Added",
            `${successCount} added, ${failCount} failed:\n${failedItems.join(", ")}`,
            [
              { text: "OK", style: "cancel" },
              { text: "Go to Cart", onPress: () => router.push("/(tabs)/cart") },
            ],
          );
        } else {
          Alert.alert("Reorder Failed", "Items may no longer be available.");
        }
      } catch {
        Alert.alert("Reorder Failed", "Something went wrong. Please try again.");
      } finally {
        setReordering(false);
      }
    },
    [addToCart, order],
  );

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Package size={56} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorSubtitle}>
            We could not load this order. Please try again.
          </Text>
          <Pressable style={styles.backToOrdersBtn} onPress={() => router.back()}>
            <Text style={styles.backToOrdersBtnText}>Back to Orders</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusColor = getStatusColor(order.status);
  const itemCount = order.totalItemCount || order.totalQtyOrdered || order.items?.length || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Order #{order.incrementId}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + "0A" }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusColor + "18" }]}>
            <StatusIcon size={24} color={statusColor} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {order.statusLabel || order.status}
            </Text>
            <Text style={styles.statusDate}>
              Placed on {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShoppingBag size={18} color={Colors.text} />
              <Text style={styles.sectionTitle}>
                Items ({order.items.length})
              </Text>
            </View>
            <View style={styles.itemsCard}>
              {order.items.map((item: any, index: number) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.itemRow,
                    index < order.items.length - 1 && styles.itemDivider,
                  ]}
                >
                  <View style={styles.itemIconBox}>
                    <Layers size={18} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                      <View style={styles.itemQtyBadge}>
                        <Text style={styles.itemQtyText}>
                          Qty: {item.qtyOrdered || 1}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemPriceCol}>
                    <Text style={styles.itemUnitPrice}>
                      {formatPrice(item.price || 0)}
                    </Text>
                    {(item.qtyOrdered || 1) > 1 && (
                      <Text style={styles.itemTotalPrice}>
                        {formatPrice(item.total || item.price || 0)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Receipt size={18} color={Colors.text} />
            <Text style={styles.sectionTitle}>Price Summary</Text>
          </View>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </Text>
              <Text style={styles.priceValue}>
                {formatPrice(order.subTotal || order.formattedPrice?.subTotal || 0)}
              </Text>
            </View>

            {(order.shippingAmount || order.formattedPrice?.shippingAmount) ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Shipping</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(order.shippingAmount || order.formattedPrice?.shippingAmount || 0)}
                </Text>
              </View>
            ) : null}

            {(order.taxAmount || order.formattedPrice?.taxAmount) ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(order.taxAmount || order.formattedPrice?.taxAmount || 0)}
                </Text>
              </View>
            ) : null}

            {(order.discountAmount || order.formattedPrice?.discountAmount) ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: Colors.success }]}>
                  -{formatPrice(Math.abs(order.discountAmount || order.formattedPrice?.discountAmount || 0))}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalDivider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(order.grandTotal || order.formattedPrice?.grandTotal || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment & Shipping */}
        {(order.payment || order.shippingAddress) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={18} color={Colors.text} />
              <Text style={styles.sectionTitle}>Payment & Delivery</Text>
            </View>
            <View style={styles.infoCard}>
              {order.payment && (
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconCircle, { backgroundColor: "#F0F0FF" }]}>
                    <CreditCard size={16} color={Colors.text} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemLabel}>Payment Method</Text>
                    <Text style={styles.infoItemValue}>
                      {order.payment.methodTitle || order.payment.method || "N/A"}
                    </Text>
                  </View>
                </View>
              )}

              {order.payment && order.shippingAddress && (
                <View style={styles.infoDivider} />
              )}

              {order.shippingAddress && (
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconCircle, { backgroundColor: "#F0FFF4" }]}>
                    <MapPin size={16} color={Colors.text} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemLabel}>Shipping Address</Text>
                    <Text style={styles.infoItemValue}>
                      {[
                        order.shippingAddress.city,
                        order.shippingAddress.postcode,
                        order.shippingAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Reorder Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarTotal}>
          <Text style={styles.bottomBarTotalLabel}>Order Total</Text>
          <Text style={styles.bottomBarTotalValue}>
            {formatPrice(order.grandTotal || order.formattedPrice?.grandTotal || 0)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.reorderBtn,
            pressed && styles.reorderBtnPressed,
            reordering && styles.reorderBtnDisabled,
          ]}
          onPress={handleReorder}
          disabled={reordering || !order.items || order.items.length === 0}
        >
          {reordering ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <RefreshCw size={18} color={Colors.white} />
          )}
          <Text style={styles.reorderBtnText}>
            {reordering ? "Adding..." : "Reorder All"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSpacer: {
    width: 36,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  backToOrdersBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backToOrdersBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom bar
  },

  // Status Banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  statusDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  // Items
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemSku: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemQtyBadge: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemQtyText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  itemPriceCol: {
    alignItems: "flex-end",
  },
  itemUnitPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  itemTotalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Price Summary
  priceCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  // Info Card
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
    marginLeft: 48,
  },

  bottomSpacing: {
    height: 32,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomBarTotal: {
    gap: 2,
  },
  bottomBarTotalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bottomBarTotalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  reorderBtnPressed: {
    opacity: 0.85,
  },
  reorderBtnDisabled: {
    opacity: 0.5,
  },
  reorderBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default OrderDetailsScreen;
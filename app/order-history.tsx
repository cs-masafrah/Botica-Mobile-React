'use client';

// app/order-history.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  Clock,
  CreditCard,
  MapPin,
  RefreshCw,
  ChevronRight,
} from "lucide-react-native";
import { orderService } from "@/services/OrderService";
import { authService } from "@/services/auth";
import { useCart } from "@/contexts/CartContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/currency";

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | number | null>(null);
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const auth = await authService.getStoredAuth();
      setIsAuthenticated(!!auth);

      if (auth) {
        await loadOrders();
      } else {
        router.replace("/login");
      }
    } catch (error) {
      setIsAuthenticated(false);
      router.replace("/login");
    } finally {
      setAuthLoading(false);
    }
  };

  const loadOrders = async (
    pageNum: number = 1,
    isRefresh: boolean = false,
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await orderService.getOrdersList({
        page: pageNum,
        limit: 10,
      });

      if (isRefresh || pageNum === 1) {
        setOrders(result.data);
      } else {
        setOrders((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.paginatorInfo.hasMorePages || false);
      setPage(pageNum);
    } catch (error) {
      if (
        (error instanceof Error && error.message?.includes("Authentication")) ||
        (error instanceof Error && error.message?.includes("401"))
      ) {
        await authService.logout();
        setIsAuthenticated(false);
        router.replace("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    const auth = await authService.getStoredAuth();
    if (!auth) {
      setIsAuthenticated(false);
      router.replace("/login");
      return;
    }
    await loadOrders(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore && isAuthenticated) {
      loadOrders(page + 1);
    }
  };

  const handleReorder = useCallback(
    async (order: any) => {
      setReorderingOrderId(order.id);

      try {
        let items = order.items;

        if (!items || items.length === 0) {
          try {
            const orderDetail = await orderService.getOrderDetail(order.id.toString());
            items = orderDetail?.items;
          } catch (detailError: any) {
            // Fallback failed silently
          }
        }

        if (!items || items.length === 0) {
          Alert.alert(
            "Unable to Reorder",
            "No items found for this order.",
          );
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const failedItems: string[] = [];

        for (const item of items) {
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
          } catch (itemError: any) {
            failCount++;
            failedItems.push(item.name);
          }
        }

        if (failCount === 0) {
          Alert.alert(
            "Reorder Successful",
            `All ${successCount} item${successCount > 1 ? "s" : ""} from order #${order.incrementId} have been added to your cart.`,
            [
              { text: "Continue Shopping", style: "cancel" },
              {
                text: "Go to Cart",
                onPress: () => router.push("/(tabs)/cart"),
              },
            ],
          );
        } else if (successCount > 0) {
          Alert.alert(
            "Partially Added",
            `${successCount} item${successCount > 1 ? "s" : ""} added to cart. ${failCount} item${failCount > 1 ? "s" : ""} could not be added:\n${failedItems.join(", ")}`,
            [
              { text: "OK", style: "cancel" },
              {
                text: "Go to Cart",
                onPress: () => router.push("/(tabs)/cart"),
              },
            ],
          );
        } else {
          Alert.alert(
            "Reorder Failed",
            "None of the items could be added to your cart. Some items may no longer be available.",
          );
        }
      } catch (error: any) {
        Alert.alert(
          "Reorder Failed",
          "Something went wrong while adding items to your cart. Please try again.",
        );
      } finally {
        setReorderingOrderId(null);
      }
    },
    [addToCart],
  );

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Package size={64} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Authentication Required</Text>
          <Text style={styles.emptySubtitle}>
            Please login to view your orders
          </Text>
          <Pressable
            style={styles.shopButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.shopButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Package size={64} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              When you place orders, they will appear here
            </Text>
            <Pressable
              style={styles.shopButton}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.ordersList}>
              {orders.map((order) => {
                const isReordering = reorderingOrderId === order.id;
                return (
                  <Pressable
                    key={order.id}
                    style={({ pressed }) => [
                      styles.orderCard,
                      pressed && styles.orderCardPressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/order-details",
                        params: { orderData: JSON.stringify(order) },
                      })
                    }
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderHeaderLeft}>
                        <Text style={styles.orderNumber}>
                          Order #{order.incrementId}
                        </Text>
                        <View style={styles.dateRow}>
                          <Clock size={13} color={Colors.textSecondary} />
                          <Text style={styles.orderDate}>
                            {formatDate(order.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(order.status) + "15",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(order.status) },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(order.status) },
                          ]}
                        >
                          {order.statusLabel || order.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderInfo}>
                      {order.payment && (
                        <View style={styles.infoRow}>
                          <CreditCard size={15} color={Colors.textSecondary} />
                          <Text style={styles.infoText}>
                            {order.payment.methodTitle ||
                              order.payment.method ||
                              "N/A"}
                          </Text>
                        </View>
                      )}

                      {order.shippingAddress && (
                        <View style={styles.infoRow}>
                          <MapPin size={15} color={Colors.textSecondary} />
                          <Text style={styles.infoText}>
                            {[order.shippingAddress.city, order.shippingAddress.country]
                              .filter(Boolean)
                              .join(", ")}
                          </Text>
                        </View>
                      )}

                      <View style={styles.infoRow}>
                        <Package size={15} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>
                          {order.totalItemCount || order.totalQtyOrdered || 0}{" "}
                          item{(order.totalItemCount || order.totalQtyOrdered || 0) !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>
                          {formatPrice(
                            order.grandTotal ||
                              order.formattedPrice?.grandTotal ||
                              0,
                          )}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={Colors.textSecondary} />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.detailsButton,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/order-details",
                            params: { orderData: JSON.stringify(order) },
                          })
                        }
                      >
                        <Package size={15} color={Colors.primary} />
                        <Text style={styles.detailsButtonText}>
                          View Details
                        </Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.reorderButton,
                          pressed && styles.buttonPressed,
                          isReordering && styles.reorderButtonDisabled,
                        ]}
                        onPress={() => handleReorder(order)}
                        disabled={isReordering}
                      >
                        {isReordering ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <RefreshCw size={15} color={Colors.white} />
                        )}
                        <Text style={styles.reorderButtonText}>
                          {isReordering ? "Adding..." : "Reorder"}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {hasMore && (
              <Pressable
                style={styles.loadMoreButton}
                onPress={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More Orders</Text>
                )}
              </Pressable>
            )}

            <View style={styles.footerSpacing} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  ordersList: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardPressed: {
    backgroundColor: Colors.cardBackground,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  orderInfo: {
    marginBottom: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalSection: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  actionButtonRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  reorderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  reorderButtonDisabled: {
    opacity: 0.6,
  },
  reorderButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  loadMoreButton: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  footerSpacing: {
    height: 32,
  },
});

export default OrderHistoryScreen;

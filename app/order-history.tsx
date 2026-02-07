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

// 'use client';

// // app/order-history.tsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Pressable,
//   ActivityIndicator,
//   RefreshControl,
//   StatusBar,
//   Platform,
//   Alert,
// } from "react-native";
// import { router } from "expo-router";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import {
//   ArrowLeft,
//   Package,
//   Clock,
//   CreditCard,
//   MapPin,
//   RefreshCw,
//   ChevronDown,
//   ChevronUp,
//   ShoppingBag,
//   Hash,
//   DollarSign,
//   Truck,
// } from "lucide-react-native";
// import { orderService } from "@/services/OrderService";
// import { authService } from "@/services/auth";
// import { useCart } from "@/contexts/CartContext";
// import Colors from "@/constants/colors";
// import { formatPrice } from "@/utils/currency";

// const OrderHistoryScreen = () => {
//   const [orders, setOrders] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [authLoading, setAuthLoading] = useState(true);
//   const [reorderingOrderId, setReorderingOrderId] = useState<string | number | null>(null);
//   const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);
//   const insets = useSafeAreaInsets();
//   const { addToCart } = useCart();

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       setAuthLoading(true);
//       const auth = await authService.getStoredAuth();
//       setIsAuthenticated(!!auth);

//       if (auth) {
//         console.log("✅ User authenticated, loading orders...");
//         await loadOrders();
//       } else {
//         console.log("⚠️ User not authenticated, redirecting to login...");
//         router.replace("/login");
//       }
//     } catch (error) {
//       console.error("❌ Authentication check failed:", error);
//       setIsAuthenticated(false);
//       router.replace("/login");
//     } finally {
//       setAuthLoading(false);
//     }
//   };

//   const loadOrders = async (
//     pageNum: number = 1,
//     isRefresh: boolean = false,
//   ) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }

//       const result = await orderService.getOrdersList({
//         page: pageNum,
//         limit: 10,
//       });

//       console.log("📋 Orders loaded:", {
//         count: result.data.length,
//         hasMore: result.paginatorInfo.hasMorePages,
//         page: pageNum,
//       });

//       if (isRefresh || pageNum === 1) {
//         setOrders(result.data);
//       } else {
//         setOrders((prev) => [...prev, ...result.data]);
//       }

//       setHasMore(result.paginatorInfo.hasMorePages || false);
//       setPage(pageNum);
//     } catch (error) {
//       console.error("Failed to load orders:", error);
//       // Check if it's an authentication error
//       if (
//         (error instanceof Error && error.message?.includes("Authentication")) ||
//         (error instanceof Error && error.message?.includes("401"))
//       ) {
//         console.log("🔐 Authentication error, clearing auth state...");
//         await authService.logout();
//         setIsAuthenticated(false);
//         router.replace("/login");
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = async () => {
//     // First check authentication
//     const auth = await authService.getStoredAuth();
//     if (!auth) {
//       setIsAuthenticated(false);
//       router.replace("/login");
//       return;
//     }
//     await loadOrders(1, true);
//   };

//   const loadMore = () => {
//     if (!loading && hasMore && isAuthenticated) {
//       loadOrders(page + 1);
//     }
//   };

//   const handleReorder = useCallback(
//     async (order: any) => {
//       setReorderingOrderId(order.id);

//       try {
//         // Debug: log the order object to see what data we have
//         console.log(`[v0] Order data keys: ${Object.keys(order).join(", ")}`);
//         console.log(`[v0] Order items: ${JSON.stringify(order.items)}`);

//         // Use items from the ordersList response directly
//         let items = order.items;

//         // If items not available from list, try fetching order detail as fallback
//         if (!items || items.length === 0) {
//           console.log(`[v0] No items on order object, trying orderDetail for order #${order.incrementId} (id: ${order.id})`);
//           try {
//             const orderDetail = await orderService.getOrderDetail(order.id.toString());
//             console.log(`[v0] orderDetail response: ${JSON.stringify(orderDetail?.items)}`);
//             items = orderDetail?.items;
//           } catch (detailError: any) {
//             console.error(`[v0] orderDetail fallback failed: ${detailError.message}`);
//           }
//         }

//         if (!items || items.length === 0) {
//           console.log(`[v0] No items found for order ${order.id} from either source`);
//           Alert.alert(
//             "Unable to Reorder",
//             "No items found for this order.",
//           );
//           return;
//         }

//         console.log(`[v0] Reordering ${items.length} items from order #${order.incrementId}`);

//         let successCount = 0;
//         let failCount = 0;
//         const failedItems: string[] = [];

//         for (const item of items) {
//           try {
//             // Use product.id if available (the actual catalog product ID), fall back to item.id
//             const productId = item.product?.id?.toString() || item.id.toString();
//             const productType = item.product?.type || "simple";

//             const product: Record<string, any> = {
//               id: productId,
//               productId: productId,
//               name: item.name,
//               price: item.price,
//               sku: item.sku,
//               type: productType,
//               inStock: true,
//               image: "",
//               brand: item.sku || "",
//               currencyCode: "USD",
//             };

//             // Only set selectedConfigurableOption for configurable products, and as an integer
//             if (productType === "configurable" && item.product?.id) {
//               product.selectedConfigurableOption = parseInt(item.product.id, 10);
//             }

//             const result = await addToCart(product, item.qtyOrdered || 1);

//             if (result?.success) {
//               successCount++;
//               console.log(`[v0] Added "${item.name}" (x${item.qtyOrdered || 1}) to cart`);
//             } else {
//               failCount++;
//               failedItems.push(item.name);
//               console.warn(`[v0] Failed to add "${item.name}": ${result?.message}`);
//             }
//           } catch (itemError: any) {
//             failCount++;
//             failedItems.push(item.name);
//             console.error(`[v0] Error adding "${item.name}":`, itemError.message);
//           }
//         }

//         // Show result to user
//         if (failCount === 0) {
//           Alert.alert(
//             "Reorder Successful",
//             `All ${successCount} item${successCount > 1 ? "s" : ""} from order #${order.incrementId} have been added to your cart.`,
//             [
//               { text: "Continue Shopping", style: "cancel" },
//               {
//                 text: "Go to Cart",
//                 onPress: () => router.push("/(tabs)/cart"),
//               },
//             ],
//           );
//         } else if (successCount > 0) {
//           Alert.alert(
//             "Partially Added",
//             `${successCount} item${successCount > 1 ? "s" : ""} added to cart. ${failCount} item${failCount > 1 ? "s" : ""} could not be added:\n${failedItems.join(", ")}`,
//             [
//               { text: "OK", style: "cancel" },
//               {
//                 text: "Go to Cart",
//                 onPress: () => router.push("/(tabs)/cart"),
//               },
//             ],
//           );
//         } else {
//           Alert.alert(
//             "Reorder Failed",
//             "None of the items could be added to your cart. Some items may no longer be available.",
//           );
//         }
//       } catch (error: any) {
//         console.error(`[v0] Reorder failed:`, error.message);
//         Alert.alert(
//           "Reorder Failed",
//           "Something went wrong while adding items to your cart. Please try again.",
//         );
//       } finally {
//         setReorderingOrderId(null);
//       }
//     },
//     [addToCart],
//   );

//   const getStatusColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case "completed":
//       case "delivered":
//         return Colors.success;
//       case "processing":
//       case "pending":
//         return Colors.warning;
//       case "canceled":
//       case "cancelled":
//         return Colors.error;
//       default:
//         return Colors.textSecondary;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });
//     } catch (error) {
//       return dateString;
//     }
//   };

//   // Show loading while checking authentication
//   if (authLoading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//           <Text style={styles.loadingText}>Checking authentication...</Text>
//         </View>
//       </View>
//     );
//   }

//   // Redirect if not authenticated (should have happened already, but as fallback)
//   if (!isAuthenticated) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" />
//         <View style={styles.emptyContainer}>
//           <View style={styles.emptyIcon}>
//             <Package size={64} color={Colors.textSecondary} />
//           </View>
//           <Text style={styles.emptyTitle}>Authentication Required</Text>
//           <Text style={styles.emptySubtitle}>
//             Please login to view your orders
//           </Text>
//           <Pressable
//             style={styles.shopButton}
//             onPress={() => router.push("/login")}
//           >
//             <Text style={styles.shopButtonText}>Go to Login</Text>
//           </Pressable>
//         </View>
//       </View>
//     );
//   }

//   if (loading && orders.length === 0) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="dark-content" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={Colors.primary} />
//           <Text style={styles.loadingText}>Loading your orders...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={[Colors.primary]}
//             tintColor={Colors.primary}
//           />
//         }
//       >
//         {orders.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <View style={styles.emptyIcon}>
//               <Package size={64} color={Colors.textSecondary} />
//             </View>
//             <Text style={styles.emptyTitle}>No Orders Yet</Text>
//             <Text style={styles.emptySubtitle}>
//               When you place orders, they will appear here
//             </Text>
//             <Pressable
//               style={styles.shopButton}
//               onPress={() => router.push("/(tabs)")}
//             >
//               <Text style={styles.shopButtonText}>Start Shopping</Text>
//             </Pressable>
//           </View>
//         ) : (
//           <>
//             <View style={styles.ordersList}>
//               {orders.map((order) => {
//                 const isReordering = reorderingOrderId === order.id;
//                 const isExpanded = expandedOrderId === order.id;
//                 return (
//                   <View
//                     key={order.id}
//                     style={styles.orderCard}
//                   >
//                     <View style={styles.orderHeader}>
//                       <View>
//                         <Text style={styles.orderNumber}>
//                           Order #{order.incrementId}
//                         </Text>
//                         <Text style={styles.orderDate}>
//                           <Clock size={14} color={Colors.textSecondary} />{" "}
//                           {formatDate(order.createdAt)}
//                         </Text>
//                       </View>
//                       <View
//                         style={[
//                           styles.statusBadge,
//                           {
//                             backgroundColor: getStatusColor(order.status) + "20",
//                           },
//                         ]}
//                       >
//                         <Text
//                           style={[
//                             styles.statusText,
//                             { color: getStatusColor(order.status) },
//                           ]}
//                         >
//                           {order.statusLabel || order.status}
//                         </Text>
//                       </View>
//                     </View>

//                     <View style={styles.orderInfo}>
//                       {order.payment && (
//                         <View style={styles.infoRow}>
//                           <CreditCard size={16} color={Colors.textSecondary} />
//                           <Text style={styles.infoText}>
//                             {order.payment.methodTitle ||
//                               order.payment.method ||
//                               "N/A"}
//                           </Text>
//                         </View>
//                       )}

//                       {order.shippingAddress && (
//                         <View style={styles.infoRow}>
//                           <MapPin size={16} color={Colors.textSecondary} />
//                           <Text style={styles.infoText}>
//                             {order.shippingAddress.city},{" "}
//                             {order.shippingAddress.country}
//                           </Text>
//                         </View>
//                       )}

//                       <View style={styles.infoRow}>
//                         <Package size={16} color={Colors.textSecondary} />
//                         <Text style={styles.infoText}>
//                           {order.totalItemCount || order.totalQtyOrdered || 0}{" "}
//                           items
//                         </Text>
//                       </View>
//                     </View>

//                     <View style={styles.orderFooter}>
//                       <Text style={styles.totalLabel}>Total</Text>
//                       <Text style={styles.totalAmount}>
//                         {formatPrice(
//                           order.grandTotal ||
//                             order.formattedPrice?.grandTotal ||
//                             0,
//                         )}
//                       </Text>
//                     </View>

//                     {/* Action Buttons */}
//                     <View style={styles.actionButtonRow}>
//                       <Pressable
//                         style={({ pressed }) => [
//                           styles.detailsButton,
//                           pressed && styles.detailsButtonPressed,
//                           isExpanded && styles.detailsButtonActive,
//                         ]}
//                         onPress={() =>
//                           setExpandedOrderId(isExpanded ? null : order.id)
//                         }
//                       >
//                         {isExpanded ? (
//                           <ChevronUp size={16} color={isExpanded ? Colors.white : Colors.primary} />
//                         ) : (
//                           <ChevronDown size={16} color={Colors.primary} />
//                         )}
//                         <Text
//                           style={[
//                             styles.detailsButtonText,
//                             isExpanded && styles.detailsButtonTextActive,
//                           ]}
//                         >
//                           {isExpanded ? "Hide Details" : "View Details"}
//                         </Text>
//                       </Pressable>

//                       <Pressable
//                         style={({ pressed }) => [
//                           styles.reorderButton,
//                           pressed && styles.reorderButtonPressed,
//                           isReordering && styles.reorderButtonDisabled,
//                         ]}
//                         onPress={() => handleReorder(order)}
//                         disabled={isReordering}
//                       >
//                         {isReordering ? (
//                           <ActivityIndicator size="small" color={Colors.white} />
//                         ) : (
//                           <RefreshCw size={16} color={Colors.white} />
//                         )}
//                         <Text style={styles.reorderButtonText}>
//                           {isReordering ? "Adding..." : "Reorder"}
//                         </Text>
//                       </Pressable>
//                     </View>

//                     {/* Expanded Order Details */}
//                     {isExpanded && (
//                       <View style={styles.orderDetails}>
//                         {/* Order Summary */}
//                         <View style={styles.detailsSection}>
//                           <Text style={styles.detailsSectionTitle}>Order Summary</Text>
//                           <View style={styles.summaryGrid}>
//                             <View style={styles.summaryItem}>
//                               <Hash size={14} color={Colors.textSecondary} />
//                               <Text style={styles.summaryLabel}>Order ID</Text>
//                               <Text style={styles.summaryValue}>#{order.incrementId}</Text>
//                             </View>
//                             <View style={styles.summaryItem}>
//                               <Clock size={14} color={Colors.textSecondary} />
//                               <Text style={styles.summaryLabel}>Date</Text>
//                               <Text style={styles.summaryValue}>{formatDate(order.createdAt)}</Text>
//                             </View>
//                             <View style={styles.summaryItem}>
//                               <ShoppingBag size={14} color={Colors.textSecondary} />
//                               <Text style={styles.summaryLabel}>Items</Text>
//                               <Text style={styles.summaryValue}>
//                                 {order.totalItemCount || order.totalQtyOrdered || 0}
//                               </Text>
//                             </View>
//                             <View style={styles.summaryItem}>
//                               <Truck size={14} color={Colors.textSecondary} />
//                               <Text style={styles.summaryLabel}>Status</Text>
//                               <Text
//                                 style={[
//                                   styles.summaryValue,
//                                   { color: getStatusColor(order.status) },
//                                 ]}
//                               >
//                                 {order.statusLabel || order.status}
//                               </Text>
//                             </View>
//                           </View>
//                         </View>

//                         {/* Price Breakdown */}
//                         <View style={styles.detailsSection}>
//                           <Text style={styles.detailsSectionTitle}>Price Breakdown</Text>
//                           <View style={styles.priceBreakdown}>
//                             <View style={styles.priceRow}>
//                               <Text style={styles.priceLabel}>Subtotal</Text>
//                               <Text style={styles.priceValue}>
//                                 {formatPrice(order.subTotal || order.formattedPrice?.subTotal || 0)}
//                               </Text>
//                             </View>
//                             {(order.shippingAmount || order.formattedPrice?.shippingAmount) ? (
//                               <View style={styles.priceRow}>
//                                 <Text style={styles.priceLabel}>Shipping</Text>
//                                 <Text style={styles.priceValue}>
//                                   {formatPrice(order.shippingAmount || order.formattedPrice?.shippingAmount || 0)}
//                                 </Text>
//                               </View>
//                             ) : null}
//                             {(order.taxAmount || order.formattedPrice?.taxAmount) ? (
//                               <View style={styles.priceRow}>
//                                 <Text style={styles.priceLabel}>Tax</Text>
//                                 <Text style={styles.priceValue}>
//                                   {formatPrice(order.taxAmount || order.formattedPrice?.taxAmount || 0)}
//                                 </Text>
//                               </View>
//                             ) : null}
//                             {(order.discountAmount || order.formattedPrice?.discountAmount) ? (
//                               <View style={styles.priceRow}>
//                                 <Text style={styles.priceLabel}>Discount</Text>
//                                 <Text style={[styles.priceValue, { color: Colors.success }]}>
//                                   -{formatPrice(Math.abs(order.discountAmount || order.formattedPrice?.discountAmount || 0))}
//                                 </Text>
//                               </View>
//                             ) : null}
//                             <View style={[styles.priceRow, styles.priceTotalRow]}>
//                               <Text style={styles.priceTotalLabel}>Total</Text>
//                               <Text style={styles.priceTotalValue}>
//                                 {formatPrice(order.grandTotal || order.formattedPrice?.grandTotal || 0)}
//                               </Text>
//                             </View>
//                           </View>
//                         </View>

//                         {/* Items List */}
//                         {order.items && order.items.length > 0 && (
//                           <View style={styles.detailsSection}>
//                             <Text style={styles.detailsSectionTitle}>
//                               Items ({order.items.length})
//                             </Text>
//                             <View style={styles.itemsList}>
//                               {order.items.map((item: any, index: number) => (
//                                 <View
//                                   key={item.id || index}
//                                   style={[
//                                     styles.itemRow,
//                                     index < order.items.length - 1 && styles.itemRowBorder,
//                                   ]}
//                                 >
//                                   <View style={styles.itemInfo}>
//                                     <Text style={styles.itemName} numberOfLines={2}>
//                                       {item.name}
//                                     </Text>
//                                     <Text style={styles.itemSku}>SKU: {item.sku}</Text>
//                                   </View>
//                                   <View style={styles.itemMeta}>
//                                     <Text style={styles.itemQty}>x{item.qtyOrdered || 1}</Text>
//                                     <Text style={styles.itemPrice}>
//                                       {formatPrice(item.total || item.price || 0)}
//                                     </Text>
//                                   </View>
//                                 </View>
//                               ))}
//                             </View>
//                           </View>
//                         )}

//                         {/* Payment & Shipping Info */}
//                         {(order.payment || order.shippingAddress) && (
//                           <View style={styles.detailsSection}>
//                             <Text style={styles.detailsSectionTitle}>Payment & Shipping</Text>
//                             {order.payment && (
//                               <View style={styles.detailInfoRow}>
//                                 <CreditCard size={14} color={Colors.textSecondary} />
//                                 <Text style={styles.detailInfoLabel}>Payment:</Text>
//                                 <Text style={styles.detailInfoValue}>
//                                   {order.payment.methodTitle || order.payment.method || "N/A"}
//                                 </Text>
//                               </View>
//                             )}
//                             {order.shippingAddress && (
//                               <View style={styles.detailInfoRow}>
//                                 <MapPin size={14} color={Colors.textSecondary} />
//                                 <Text style={styles.detailInfoLabel}>Ships to:</Text>
//                                 <Text style={styles.detailInfoValue}>
//                                   {[
//                                     order.shippingAddress.city,
//                                     order.shippingAddress.postcode,
//                                     order.shippingAddress.country,
//                                   ]
//                                     .filter(Boolean)
//                                     .join(", ")}
//                                 </Text>
//                               </View>
//                             )}
//                           </View>
//                         )}
//                       </View>
//                     )}
//                   </View>
//                 );
//               })}
//             </View>

//             {hasMore && (
//               <Pressable
//                 style={styles.loadMoreButton}
//                 onPress={loadMore}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <ActivityIndicator size="small" color={Colors.primary} />
//                 ) : (
//                   <Text style={styles.loadMoreText}>Load More Orders</Text>
//                 )}
//               </Pressable>
//             )}

//             <View style={styles.footerSpacing} />
//           </>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 12,
//     backgroundColor: Colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.border,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: Colors.text,
//   },
//   content: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: Colors.textSecondary,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//     minHeight: 400,
//   },
//   emptyIcon: {
//     marginBottom: 24,
//   },
//   emptyTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: Colors.text,
//     marginBottom: 8,
//   },
//   emptySubtitle: {
//     fontSize: 16,
//     color: Colors.textSecondary,
//     textAlign: "center",
//     marginBottom: 32,
//     lineHeight: 24,
//   },
//   shopButton: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 32,
//     paddingVertical: 14,
//     borderRadius: 12,
//   },
//   shopButtonText: {
//     color: Colors.white,
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   ordersList: {
//     padding: 16,
//   },
//   orderCard: {
//     backgroundColor: Colors.white,
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: Colors.borderLight,
//     shadowColor: Colors.shadow,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   orderHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 16,
//   },
//   orderNumber: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: Colors.text,
//     marginBottom: 4,
//   },
//   orderDate: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "600",
//     textTransform: "uppercase",
//   },
//   orderInfo: {
//     marginBottom: 16,
//     gap: 8,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   infoText: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
//   orderFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: Colors.borderLight,
//   },
//   totalLabel: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
//   totalAmount: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: Colors.primary,
//   },
//   actionButtonRow: {
//     flexDirection: "row",
//     marginTop: 12,
//     gap: 10,
//   },
//   detailsButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: Colors.background,
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//     borderWidth: 1,
//     borderColor: Colors.primary,
//   },
//   detailsButtonPressed: {
//     opacity: 0.85,
//   },
//   detailsButtonActive: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   detailsButtonText: {
//     color: Colors.primary,
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   detailsButtonTextActive: {
//     color: Colors.white,
//   },
//   reorderButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: Colors.primary,
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 6,
//   },
//   reorderButtonPressed: {
//     opacity: 0.85,
//   },
//   reorderButtonDisabled: {
//     opacity: 0.6,
//   },
//   reorderButtonText: {
//     color: Colors.white,
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   orderDetails: {
//     marginTop: 16,
//     gap: 16,
//   },
//   detailsSection: {
//     gap: 10,
//   },
//   detailsSectionTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: Colors.text,
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//   },
//   summaryGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//   },
//   summaryItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: Colors.background,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     gap: 6,
//   },
//   summaryLabel: {
//     fontSize: 12,
//     color: Colors.textSecondary,
//   },
//   summaryValue: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: Colors.text,
//   },
//   priceBreakdown: {
//     backgroundColor: Colors.background,
//     borderRadius: 12,
//     padding: 14,
//     gap: 8,
//   },
//   priceRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   priceLabel: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
//   priceValue: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: Colors.text,
//   },
//   priceTotalRow: {
//     borderTopWidth: 1,
//     borderTopColor: Colors.borderLight,
//     paddingTop: 8,
//     marginTop: 4,
//   },
//   priceTotalLabel: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: Colors.text,
//   },
//   priceTotalValue: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: Colors.primary,
//   },
//   itemsList: {
//     backgroundColor: Colors.background,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   itemRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 12,
//   },
//   itemRowBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.borderLight,
//   },
//   itemInfo: {
//     flex: 1,
//     marginRight: 12,
//   },
//   itemName: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: Colors.text,
//     marginBottom: 2,
//   },
//   itemSku: {
//     fontSize: 12,
//     color: Colors.textSecondary,
//   },
//   itemMeta: {
//     alignItems: "flex-end",
//     gap: 2,
//   },
//   itemQty: {
//     fontSize: 12,
//     color: Colors.textSecondary,
//     fontWeight: "500",
//   },
//   itemPrice: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: Colors.text,
//   },
//   detailInfoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingVertical: 4,
//   },
//   detailInfoLabel: {
//     fontSize: 13,
//     color: Colors.textSecondary,
//   },
//   detailInfoValue: {
//     fontSize: 13,
//     fontWeight: "500",
//     color: Colors.text,
//     flex: 1,
//   },
//   loadMoreButton: {
//     backgroundColor: Colors.cardBackground,
//     marginHorizontal: 16,
//     marginBottom: 16,
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: Colors.border,
//   },
//   loadMoreText: {
//     color: Colors.primary,
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   footerSpacing: {
//     height: 32,
//   },
// });

// export default OrderHistoryScreen;

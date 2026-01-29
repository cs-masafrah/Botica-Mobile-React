// app/order-history.tsx - UPDATED WITH CURRENCY FORMATTING
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Package,
  Clock,
  CreditCard,
  MapPin,
} from "lucide-react-native";
import { orderService } from "@/services/OrderService";
import { authService } from "@/services/auth";
import Colors from "@/constants/colors";
import { formatPrice, parseFormattedPrice, APP_CURRENCY } from "@/utils/currency";

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Default currency - you might want to get this from user settings or app config
  const defaultCurrency = APP_CURRENCY; // Default to ILS based on your currency.ts

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const auth = await authService.getStoredAuth();
      setIsAuthenticated(!!auth);

      if (auth) {
        console.log("✅ User authenticated, loading orders...");
        await loadOrders();
      } else {
        console.log("⚠️ User not authenticated, redirecting to login...");
        router.replace("/login");
      }
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
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

      console.log("📋 Orders loaded:", {
        count: result.data.length,
        hasMore: result.paginatorInfo.hasMorePages,
        page: pageNum,
      });

      if (isRefresh || pageNum === 1) {
        setOrders(result.data);
      } else {
        setOrders((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.paginatorInfo.hasMorePages || false);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load orders:", error);
      // Check if it's an authentication error
      if (
        error.message?.includes("Authentication") ||
        error.message?.includes("401")
      ) {
        console.log("🔐 Authentication error, clearing auth state...");
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
    // First check authentication
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

  // Helper function to get order total with proper currency formatting
  const getOrderTotal = (order: any): string => {
    if (!order) return formatPrice(0, defaultCurrency);
    
    // Try to get the total from various possible locations
    let total = 0;
    let currency = defaultCurrency;
    
    // Try grandTotal first
    if (order.grandTotal !== undefined && order.grandTotal !== null) {
      total = parseFormattedPrice(order.grandTotal);
    }
    
    // Try formattedPrice.grandTotal as a fallback
    if ((total === 0 || isNaN(total)) && order.formattedPrice?.grandTotal) {
      total = parseFormattedPrice(order.formattedPrice.grandTotal);
    }
    
    // Try to detect currency from formatted price
    if (order.formattedPrice?.grandTotal) {
      const priceStr = order.formattedPrice.grandTotal.toString();
      if (priceStr.includes('₪')) currency = 'ILS';
      else if (priceStr.includes('$')) currency = 'USD';
      else if (priceStr.includes('€')) currency = 'EUR';
      else if (priceStr.includes('£')) currency = 'GBP';
      else if (priceStr.includes('¥')) currency = 'JPY';
    }
    
    // Use order currency code if available
    if (order.orderCurrencyCode) {
      currency = order.orderCurrencyCode;
    } else if (order.currencyCode) {
      currency = order.currencyCode;
    } else if (order.baseCurrencyCode) {
      currency = order.baseCurrencyCode;
    } else if (order.channelCurrencyCode) {
      currency = order.channelCurrencyCode;
    }
    
    return formatPrice(total, currency);
  };

  // Helper to get order subtotal
  const getOrderSubtotal = (order: any): string => {
    if (!order) return formatPrice(0, defaultCurrency);
    
    let subtotal = 0;
    let currency = defaultCurrency;
    
    if (order.subTotal !== undefined && order.subTotal !== null) {
      subtotal = parseFormattedPrice(order.subTotal);
    }
    
    if (order.orderCurrencyCode) {
      currency = order.orderCurrencyCode;
    }
    
    return formatPrice(subtotal, currency);
  };

  // Helper to get shipping cost
  const getShippingCost = (order: any): string => {
    if (!order) return formatPrice(0, defaultCurrency);
    
    let shipping = 0;
    let currency = defaultCurrency;
    
    if (order.shippingAmount !== undefined && order.shippingAmount !== null) {
      shipping = parseFormattedPrice(order.shippingAmount);
    }
    
    if (order.orderCurrencyCode) {
      currency = order.orderCurrencyCode;
    }
    
    return formatPrice(shipping, currency);
  };

  // Helper to get discount amount
  const getDiscountAmount = (order: any): string => {
    if (!order) return "";
    
    const discount = order.discountAmount || 0;
    if (discount <= 0) return "";
    
    const currency = order.orderCurrencyCode || defaultCurrency;
    return formatPrice(discount, currency);
  };

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
    } catch (error) {
      return dateString;
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  // Redirect if not authenticated (should have happened already, but as fallback)
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerRight} />
        </View>
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerRight} />
      </View>

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
              {orders.map((order) => (
                <Pressable
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() =>
                    router.push({
                      pathname: "/order-details",
                      params: { id: order.id },
                    })
                  }
                >
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNumber}>
                        Order #{order.incrementId}
                      </Text>
                      <Text style={styles.orderDate}>
                        <Clock size={14} color={Colors.textSecondary} />{" "}
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(order.status) + "20",
                        },
                      ]}
                    >
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
                        <CreditCard size={16} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>
                          {order.payment.methodTitle ||
                            order.payment.method ||
                            "N/A"}
                        </Text>
                      </View>
                    )}

                    {order.shippingAddress && (
                      <View style={styles.infoRow}>
                        <MapPin size={16} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.country}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      <Package size={16} color={Colors.textSecondary} />
                      <Text style={styles.infoText}>
                        {order.totalItemCount || order.totalQtyOrdered || 0}{" "}
                        items
                      </Text>
                    </View>
                    
                    {/* Order Summary Row - Optional: Show subtotal, shipping, total */}
                    <View style={styles.orderSummaryRow}>
                      <Text style={styles.summaryLabel}>Items:</Text>
                      <Text style={styles.summaryValue}>
                        {getOrderSubtotal(order)}
                      </Text>
                    </View>
                    
                    {order.shippingAmount > 0 && (
                      <View style={styles.orderSummaryRow}>
                        <Text style={styles.summaryLabel}>Shipping:</Text>
                        <Text style={styles.summaryValue}>
                          {getShippingCost(order)}
                        </Text>
                      </View>
                    )}
                    
                    {order.discountAmount > 0 && (
                      <View style={styles.orderSummaryRow}>
                        <Text style={styles.summaryLabel}>Discount:</Text>
                        <Text style={[styles.summaryValue, styles.discountValue]}>
                          -{getDiscountAmount(order)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                      {getOrderTotal(order)}
                    </Text>
                  </View>
                </Pressable>
              ))}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  headerRight: {
    width: 40,
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
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  orderInfo: {
    marginBottom: 16,
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
  orderSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500",
  },
  discountValue: {
    color: Colors.success,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  loadMoreButton: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 20,
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
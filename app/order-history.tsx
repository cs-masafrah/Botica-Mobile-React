"use client";

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
import { useLanguage } from "@/contexts/LanguageContext";
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
  const [reorderingOrderId, setReorderingOrderId] = useState<
    string | number | null
  >(null);
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { t, isRTL } = useLanguage();

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
            const orderDetail = await orderService.getOrderDetail(
              order.id.toString(),
            );
            items = orderDetail?.items;
          } catch (detailError: any) {
            // Fallback failed silently
          }
        }

        if (!items || items.length === 0) {
          Alert.alert(t("unableToReorder"), t("noItemsFound"));
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const failedItems: string[] = [];

        for (const item of items) {
          try {
            const productId =
              item.product?.id?.toString() || item.id.toString();
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
              product.selectedConfigurableOption = parseInt(
                item.product.id,
                10,
              );
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
            t("reorderSuccessful"),
            t("allItemsAdded", {
              count: successCount,
              orderNumber: order.incrementId,
            }),
            [
              { text: t("continueShopping"), style: "cancel" },
              {
                text: t("goToCart"),
                onPress: () => router.push("/(tabs)/cart"),
              },
            ],
          );
        } else if (successCount > 0) {
          Alert.alert(
            t("partiallyAdded"),
            t("partiallyAddedMessage", {
              successCount,
              failCount,
              failedItems: failedItems.join(", "),
            }),
            [
              { text: t("ok"), style: "cancel" },
              {
                text: t("goToCart"),
                onPress: () => router.push("/(tabs)/cart"),
              },
            ],
          );
        } else {
          Alert.alert(t("reorderFailed"), t("reorderFailedMessage"));
        }
      } catch (error: any) {
        Alert.alert(t("reorderFailed"), t("reorderErrorMessage"));
      } finally {
        setReorderingOrderId(null);
      }
    },
    [addToCart, t],
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
      return date.toLocaleDateString(isRTL ? "ar" : "en-US", {
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
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <StatusBar barStyle="dark-content" />
        <View
          style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t("checkingAuth")}
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <StatusBar barStyle="dark-content" />
        <View
          style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}
        >
          <View style={styles.emptyIcon}>
            <Package size={64} color={Colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
            {t("authRequired")}
          </Text>
          <Text
            style={[styles.emptySubtitle, isRTL && styles.emptySubtitleRTL]}
          >
            {t("loginToViewOrders")}
          </Text>
          <Pressable
            style={[styles.shopButton, isRTL && styles.shopButtonRTL]}
            onPress={() => router.push("/login")}
          >
            <Text
              style={[styles.shopButtonText, isRTL && styles.shopButtonTextRTL]}
            >
              {t("goToLogin")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <StatusBar barStyle="dark-content" />
        <View
          style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t("loadingOrders")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
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
          <View
            style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}
          >
            <View style={styles.emptyIcon}>
              <Package size={64} color={Colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
              {t("noOrdersYet")}
            </Text>
            <Text
              style={[styles.emptySubtitle, isRTL && styles.emptySubtitleRTL]}
            >
              {t("ordersWillAppearHere")}
            </Text>
            <Pressable
              style={[styles.shopButton, isRTL && styles.shopButtonRTL]}
              onPress={() => router.push("/(tabs)")}
            >
              <Text
                style={[
                  styles.shopButtonText,
                  isRTL && styles.shopButtonTextRTL,
                ]}
              >
                {t("startShopping")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.ordersList, isRTL && styles.ordersListRTL]}>
              {orders.map((order) => {
                const isReordering = reorderingOrderId === order.id;
                return (
                  <Pressable
                    key={order.id}
                    style={({ pressed }) => [
                      styles.orderCard,
                      pressed && styles.orderCardPressed,
                      isRTL && styles.orderCardRTL,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/order-details",
                        params: { orderData: JSON.stringify(order) },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.orderHeader,
                        isRTL && styles.orderHeaderRTL,
                      ]}
                    >
                      <View
                        style={[
                          styles.orderHeaderLeft,
                          isRTL && styles.orderHeaderLeftRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.orderNumber,
                            isRTL && styles.orderNumberRTL,
                          ]}
                        >
                          {t("orderNumber")} #{order.incrementId}
                        </Text>
                        <View
                          style={[styles.dateRow, isRTL && styles.dateRowRTL]}
                        >
                          <Clock size={13} color={Colors.textSecondary} />
                          <Text
                            style={[
                              styles.orderDate,
                              isRTL && styles.orderDateRTL,
                            ]}
                          >
                            {formatDate(order.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(order.status) + "15",
                          },
                          isRTL && styles.statusBadgeRTL,
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
                            isRTL && styles.statusTextRTL,
                          ]}
                        >
                          {order.statusLabel || order.status}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[styles.orderInfo, isRTL && styles.orderInfoRTL]}
                    >
                      {order.payment && (
                        <View
                          style={[styles.infoRow, isRTL && styles.infoRowRTL]}
                        >
                          <CreditCard size={15} color={Colors.textSecondary} />
                          <Text
                            style={[
                              styles.infoText,
                              isRTL && styles.infoTextRTL,
                            ]}
                          >
                            {order.payment.methodTitle ||
                              order.payment.method ||
                              t("na")}
                          </Text>
                        </View>
                      )}

                      {order.shippingAddress && (
                        <View
                          style={[styles.infoRow, isRTL && styles.infoRowRTL]}
                        >
                          <MapPin size={15} color={Colors.textSecondary} />
                          <Text
                            style={[
                              styles.infoText,
                              isRTL && styles.infoTextRTL,
                            ]}
                          >
                            {[
                              order.shippingAddress.city,
                              order.shippingAddress.country,
                            ]
                              .filter(Boolean)
                              .join(isRTL ? "، " : ", ")}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[styles.infoRow, isRTL && styles.infoRowRTL]}
                      >
                        <Package size={15} color={Colors.textSecondary} />
                        <Text
                          style={[styles.infoText, isRTL && styles.infoTextRTL]}
                        >
                          {order.totalItemCount || order.totalQtyOrdered || 0}{" "}
                          {(order.totalItemCount ||
                            order.totalQtyOrdered ||
                            0) !== 1
                            ? t("items")
                            : t("item")}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.orderFooter,
                        isRTL && styles.orderFooterRTL,
                      ]}
                    >
                      <View
                        style={[
                          styles.totalSection,
                          isRTL && styles.totalSectionRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.totalLabel,
                            isRTL && styles.totalLabelRTL,
                          ]}
                        >
                          {t("total")}
                        </Text>
                        <Text
                          style={[
                            styles.totalAmount,
                            isRTL && styles.totalAmountRTL,
                          ]}
                        >
                          {formatPrice(
                            order.grandTotal ||
                              order.formattedPrice?.grandTotal ||
                              0,
                          )}
                        </Text>
                      </View>
                      <ChevronRight
                        size={20}
                        color={Colors.textSecondary}
                        style={isRTL && { transform: [{ scaleX: -1 }] }}
                      />
                    </View>

                    {/* Action Buttons */}
                    <View
                      style={[
                        styles.actionButtonRow,
                        isRTL && styles.actionButtonRowRTL,
                      ]}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.detailsButton,
                          pressed && styles.buttonPressed,
                          isRTL && styles.detailsButtonRTL,
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/order-details",
                            params: { orderData: JSON.stringify(order) },
                          })
                        }
                      >
                        <Package size={15} color={Colors.primary} />
                        <Text
                          style={[
                            styles.detailsButtonText,
                            isRTL && styles.detailsButtonTextRTL,
                          ]}
                        >
                          {t("viewDetails")}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.reorderButton,
                          pressed && styles.buttonPressed,
                          isReordering && styles.reorderButtonDisabled,
                          isRTL && styles.reorderButtonRTL,
                        ]}
                        onPress={() => handleReorder(order)}
                        disabled={isReordering}
                      >
                        {isReordering ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.white}
                          />
                        ) : (
                          <RefreshCw size={15} color={Colors.white} />
                        )}
                        <Text
                          style={[
                            styles.reorderButtonText,
                            isRTL && styles.reorderButtonTextRTL,
                          ]}
                        >
                          {isReordering ? t("adding") : t("reorder")}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {hasMore && (
              <Pressable
                style={[
                  styles.loadMoreButton,
                  isRTL && styles.loadMoreButtonRTL,
                ]}
                onPress={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.loadMoreText,
                      isRTL && styles.loadMoreTextRTL,
                    ]}
                  >
                    {t("loadMoreOrders")}
                  </Text>
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
  containerRTL: {
    direction: "rtl",
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
  loadingContainerRTL: {},
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyContainerRTL: {},
  emptyIcon: {
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
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  emptySubtitleRTL: {
    textAlign: "right",
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonRTL: {},
  shopButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  shopButtonTextRTL: {
    textAlign: "right",
  },
  ordersList: {
    padding: 16,
    gap: 12,
  },
  ordersListRTL: {},
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
  orderCardRTL: {},
  orderCardPressed: {
    backgroundColor: Colors.cardBackground,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  orderHeaderRTL: {
    // flexDirection: "row-reverse",
    // flexDirection: "row",
  },
  orderHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderHeaderLeftRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  orderNumberRTL: {
    textAlign: "left",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateRowRTL: {
    // flexDirection: "row-reverse",
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderDateRTL: {
    textAlign: "left",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeRTL: {
    // flexDirection: "row-reverse",
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
  statusTextRTL: {
    textAlign: "right",
  },
  orderInfo: {
    marginBottom: 14,
    gap: 8,
  },
  orderInfoRTL: {},
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRowRTL: {
    // flexDirection: "row-reverse",
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoTextRTL: {
    textAlign: "left",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderFooterRTL: {
    // flexDirection: "row-reverse",
  },
  totalSection: {
    gap: 2,
  },
  totalSectionRTL: {
    alignItems: "flex-start",
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalLabelRTL: {
    textAlign: "left",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  totalAmountRTL: {
    textAlign: "center",
  },
  actionButtonRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  actionButtonRowRTL: {
    flexDirection: "row-reverse",
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
  detailsButtonRTL: {
    // flexDirection: "row-reverse",
  },
  detailsButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButtonTextRTL: {
    textAlign: "right",
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
  reorderButtonRTL: {
    flexDirection: "row-reverse",
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
  reorderButtonTextRTL: {
    textAlign: "right",
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
  loadMoreButtonRTL: {},
  loadMoreText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  loadMoreTextRTL: {
    textAlign: "right",
  },
  footerSpacing: {
    height: 32,
  },
});

export default OrderHistoryScreen;

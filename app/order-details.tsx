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
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { formatPrice } from "@/utils/currency";

const OrderDetailsScreen = () => {
  const { orderData } = useLocalSearchParams<{ orderData: string }>();
  const [reordering, setReordering] = useState(false);
  const { addToCart } = useCart();
  const { t, isRTL } = useLanguage();

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
      return date.toLocaleDateString(isRTL ? "ar" : "en-US", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleReorder = useCallback(async () => {
    if (!order?.items || order.items.length === 0) {
      Alert.alert(t("unableToReorder"), t("noItemsFound"));
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
          t("reorderSuccessful"),
          t("allItemsAddedDetails", { count: successCount }),
          [
            { text: t("continueShopping"), style: "cancel" },
            { text: t("goToCart"), onPress: () => router.push("/(tabs)/cart") },
          ],
        );
      } else if (successCount > 0) {
        Alert.alert(
          t("partiallyAdded"),
          t("partiallyAddedDetails", {
            successCount,
            failCount,
            failedItems: failedItems.join(", "),
          }),
          [
            { text: t("ok"), style: "cancel" },
            { text: t("goToCart"), onPress: () => router.push("/(tabs)/cart") },
          ],
        );
      } else {
        Alert.alert(t("reorderFailed"), t("reorderFailedDetails"));
      }
    } catch {
      Alert.alert(t("reorderFailed"), t("reorderErrorMessage"));
    } finally {
      setReordering(false);
    }
  }, [addToCart, order, t]);

  if (!order) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Pressable
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={22}
              color={Colors.text}
              style={isRTL && { transform: [{ scaleX: -1 }] }}
            />
          </Pressable>
          <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
            {t("orderDetails")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View
          style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}
        >
          <Package size={56} color={Colors.textSecondary} />
          <Text style={[styles.errorTitle, isRTL && styles.errorTitleRTL]}>
            {t("orderNotFound")}
          </Text>
          <Text
            style={[styles.errorSubtitle, isRTL && styles.errorSubtitleRTL]}
          >
            {t("orderNotFoundMessage")}
          </Text>
          <Pressable
            style={[styles.backToOrdersBtn, isRTL && styles.backToOrdersBtnRTL]}
            onPress={() => router.back()}
          >
            <Text
              style={[
                styles.backToOrdersBtnText,
                isRTL && styles.backToOrdersBtnTextRTL,
              ]}
            >
              {t("backToOrders")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusColor = getStatusColor(order.status);
  const itemCount =
    order.totalItemCount || order.totalQtyOrdered || order.items?.length || 0;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable
          style={[styles.backButton, isRTL && styles.backButtonRTL]}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={22}
            color={Colors.text}
            style={isRTL && { transform: [{ scaleX: -1 }] }}
          />
        </Pressable>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {t("orderNumber")} #{order.incrementId}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: statusColor + "0A" },
            isRTL && styles.statusBannerRTL,
          ]}
        >
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: statusColor + "18" },
            ]}
          >
            <StatusIcon size={24} color={statusColor} />
          </View>
          <View style={[styles.statusInfo, isRTL && styles.statusInfoRTL]}>
            <Text
              style={[
                styles.statusLabel,
                { color: statusColor },
                isRTL && styles.statusLabelRTL,
              ]}
            >
              {order.statusLabel || order.status}
            </Text>
            <Text style={[styles.statusDate, isRTL && styles.statusDateRTL]}>
              {t("placedOn")} {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={[styles.section, isRTL && styles.sectionRTL]}>
            <View
              style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
            >
              <ShoppingBag size={18} color={Colors.text} />
              <Text
                style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
              >
                {t("items")} ({order.items.length})
              </Text>
            </View>
            <View style={[styles.itemsCard, isRTL && styles.itemsCardRTL]}>
              {order.items.map((item: any, index: number) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.itemRow,
                    index < order.items.length - 1 && styles.itemDivider,
                    isRTL && styles.itemRowRTL,
                  ]}
                >
                  <View
                    style={[styles.itemIconBox, isRTL && styles.itemIconBoxRTL]}
                  >
                    <Layers size={18} color={Colors.textSecondary} />
                  </View>
                  <View
                    style={[styles.itemDetails, isRTL && styles.itemDetailsRTL]}
                  >
                    <Text
                      style={[styles.itemName, isRTL && styles.itemNameRTL]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.itemMetaRow,
                        isRTL && styles.itemMetaRowRTL,
                      ]}
                    >
                      <Text
                        style={[styles.itemSku, isRTL && styles.itemSkuRTL]}
                      >
                        {t("sku")}: {item.sku}
                      </Text>
                      <View
                        style={[
                          styles.itemQtyBadge,
                          isRTL && styles.itemQtyBadgeRTL,
                        ]}
                      >
                        <Text
                          style={[
                            styles.itemQtyText,
                            isRTL && styles.itemQtyTextRTL,
                          ]}
                        >
                          {t("qty")}: {item.qtyOrdered || 1}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.itemPriceCol,
                      isRTL && styles.itemPriceColRTL,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemUnitPrice,
                        isRTL && styles.itemUnitPriceRTL,
                      ]}
                    >
                      {formatPrice(item.price || 0)}
                    </Text>
                    {(item.qtyOrdered || 1) > 1 && (
                      <Text
                        style={[
                          styles.itemTotalPrice,
                          isRTL && styles.itemTotalPriceRTL,
                        ]}
                      >
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
        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <View
            style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
          >
            <Receipt size={18} color={Colors.text} />
            <Text
              style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
            >
              {t("priceSummary")}
            </Text>
          </View>
          <View style={[styles.priceCard, isRTL && styles.priceCardRTL]}>
            <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
              <Text style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}>
                {t("subtotal")} ({itemCount}{" "}
                {itemCount !== 1 ? t("items") : t("item")})
              </Text>
              <Text style={[styles.priceValue, isRTL && styles.priceValueRTL]}>
                {formatPrice(
                  order.subTotal || order.formattedPrice?.subTotal || 0,
                )}
              </Text>
            </View>

            {order.shippingAmount || order.formattedPrice?.shippingAmount ? (
              <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
                <Text
                  style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}
                >
                  {t("shipping")}
                </Text>
                <Text
                  style={[styles.priceValue, isRTL && styles.priceValueRTL]}
                >
                  {formatPrice(
                    order.shippingAmount ||
                      order.formattedPrice?.shippingAmount ||
                      0,
                  )}
                </Text>
              </View>
            ) : null}

            {order.taxAmount || order.formattedPrice?.taxAmount ? (
              <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
                <Text
                  style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}
                >
                  {t("tax")}
                </Text>
                <Text
                  style={[styles.priceValue, isRTL && styles.priceValueRTL]}
                >
                  {formatPrice(
                    order.taxAmount || order.formattedPrice?.taxAmount || 0,
                  )}
                </Text>
              </View>
            ) : null}

            {order.discountAmount || order.formattedPrice?.discountAmount ? (
              <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
                <Text
                  style={[styles.priceLabel, isRTL && styles.priceLabelRTL]}
                >
                  {t("discount")}
                </Text>
                <Text
                  style={[
                    styles.priceValue,
                    { color: Colors.success },
                    isRTL && styles.priceValueRTL,
                  ]}
                >
                  -
                  {formatPrice(
                    Math.abs(
                      order.discountAmount ||
                        order.formattedPrice?.discountAmount ||
                        0,
                    ),
                  )}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalDivider} />

            <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
              <Text style={[styles.totalLabel, isRTL && styles.totalLabelRTL]}>
                {t("total")}
              </Text>
              <Text style={[styles.totalValue, isRTL && styles.totalValueRTL]}>
                {formatPrice(
                  order.grandTotal || order.formattedPrice?.grandTotal || 0,
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment & Shipping */}
        {(order.payment || order.shippingAddress) && (
          <View style={[styles.section, isRTL && styles.sectionRTL]}>
            <View
              style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
            >
              <Truck size={18} color={Colors.text} />
              <Text
                style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
              >
                {t("paymentAndDelivery")}
              </Text>
            </View>
            <View style={[styles.infoCard, isRTL && styles.infoCardRTL]}>
              {order.payment && (
                <View style={[styles.infoItem, isRTL && styles.infoItemRTL]}>
                  <View
                    style={[
                      styles.infoIconCircle,
                      { backgroundColor: "#F0F0FF" },
                    ]}
                  >
                    <CreditCard size={16} color={Colors.text} />
                  </View>
                  <View
                    style={[styles.infoContent, isRTL && styles.infoContentRTL]}
                  >
                    <Text
                      style={[
                        styles.infoItemLabel,
                        isRTL && styles.infoItemLabelRTL,
                      ]}
                    >
                      {t("paymentMethod")}
                    </Text>
                    <Text
                      style={[
                        styles.infoItemValue,
                        isRTL && styles.infoItemValueRTL,
                      ]}
                    >
                      {order.payment.methodTitle ||
                        order.payment.method ||
                        t("na")}
                    </Text>
                  </View>
                </View>
              )}

              {order.payment && order.shippingAddress && (
                <View
                  style={[styles.infoDivider, isRTL && styles.infoDividerRTL]}
                />
              )}

              {order.shippingAddress && (
                <View style={[styles.infoItem, isRTL && styles.infoItemRTL]}>
                  <View
                    style={[
                      styles.infoIconCircle,
                      { backgroundColor: "#F0FFF4" },
                    ]}
                  >
                    <MapPin size={16} color={Colors.text} />
                  </View>
                  <View
                    style={[styles.infoContent, isRTL && styles.infoContentRTL]}
                  >
                    <Text
                      style={[
                        styles.infoItemLabel,
                        isRTL && styles.infoItemLabelRTL,
                      ]}
                    >
                      {t("shippingAddress")}
                    </Text>
                    <Text
                      style={[
                        styles.infoItemValue,
                        isRTL && styles.infoItemValueRTL,
                      ]}
                    >
                      {[
                        order.shippingAddress.city,
                        order.shippingAddress.postcode,
                        order.shippingAddress.country,
                      ]
                        .filter(Boolean)
                        .join(isRTL ? "، " : ", ")}
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
      <View style={[styles.bottomBar, isRTL && styles.bottomBarRTL]}>
        <View
          style={[styles.bottomBarTotal, isRTL && styles.bottomBarTotalRTL]}
        >
          <Text
            style={[
              styles.bottomBarTotalLabel,
              isRTL && styles.bottomBarTotalLabelRTL,
            ]}
          >
            {t("orderTotal")}
          </Text>
          <Text
            style={[
              styles.bottomBarTotalValue,
              isRTL && styles.bottomBarTotalValueRTL,
            ]}
          >
            {formatPrice(
              order.grandTotal || order.formattedPrice?.grandTotal || 0,
            )}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.reorderBtn,
            pressed && styles.reorderBtnPressed,
            reordering && styles.reorderBtnDisabled,
            isRTL && styles.reorderBtnRTL,
          ]}
          onPress={handleReorder}
          disabled={reordering || !order.items || order.items.length === 0}
        >
          {reordering ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <RefreshCw size={18} color={Colors.white} />
          )}
          <Text
            style={[styles.reorderBtnText, isRTL && styles.reorderBtnTextRTL]}
          >
            {reordering ? t("adding") : t("reorderAll")}
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
  containerRTL: {
    direction: "rtl",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRTL: {
    // flexDirection: "row-reverse",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonRTL: {},
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  headerTitleRTL: {
    textAlign: "right",
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
  errorContainerRTL: {},
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 8,
  },
  errorTitleRTL: {
    textAlign: "right",
  },
  errorSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  errorSubtitleRTL: {
    textAlign: "right",
  },
  backToOrdersBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backToOrdersBtnRTL: {},
  backToOrdersBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  backToOrdersBtnTextRTL: {
    textAlign: "right",
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
  statusBannerRTL: {
    // flexDirection: "row-reverse",
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
  statusInfoRTL: {
    alignItems: "flex-end",
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  statusLabelRTL: {
    textAlign: "right",
  },
  statusDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusDateRTL: {
    textAlign: "right",
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionRTL: {},
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionTitleRTL: {
    textAlign: "right",
  },

  // Items
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemsCardRTL: {},
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  itemRowRTL: {
    // flexDirection: "row-reverse",
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
  itemIconBoxRTL: {},
  itemDetails: {
    flex: 1,
  },
  itemDetailsRTL: {
    alignItems: "flex-end",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemNameRTL: {
    textAlign: "left",
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemMetaRowRTL: {
    flexDirection: "row-reverse",
  },
  itemSku: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemSkuRTL: {
    textAlign: "left",
  },
  itemQtyBadge: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemQtyBadgeRTL: {},
  itemQtyText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  itemQtyTextRTL: {
    textAlign: "left",
  },
  itemPriceCol: {
    alignItems: "flex-end",
  },
  itemPriceColRTL: {
    alignItems: "flex-start",
  },
  itemUnitPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  itemUnitPriceRTL: {
    textAlign: "left",
  },
  itemTotalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemTotalPriceRTL: {
    textAlign: "left",
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
  priceCardRTL: {},
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceRowRTL: {
    // flexDirection: "row-reverse",
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceLabelRTL: {
    textAlign: "right",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  priceValueRTL: {
    textAlign: "right",
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
  totalLabelRTL: {
    textAlign: "right",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValueRTL: {
    textAlign: "right",
  },

  // Info Card
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoCardRTL: {},
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoItemRTL: {
    // flexDirection: "row-reverse",
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
  infoContentRTL: {
    alignItems: "flex-end",
  },
  infoItemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoItemLabelRTL: {
    textAlign: "right",
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  infoItemValueRTL: {
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
    marginLeft: 48,
  },
  infoDividerRTL: {
    marginLeft: 0,
    marginRight: 48,
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
  bottomBarRTL: {
    // flexDirection: "row-reverse",
  },
  bottomBarTotal: {
    gap: 2,
  },
  bottomBarTotalRTL: {
    alignItems: "flex-end",
  },
  bottomBarTotalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bottomBarTotalLabelRTL: {
    textAlign: "right",
  },
  bottomBarTotalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  bottomBarTotalValueRTL: {
    textAlign: "right",
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
  reorderBtnRTL: {
    // flexDirection: "row-reverse",
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
  reorderBtnTextRTL: {
    textAlign: "right",
  },
});

export default OrderDetailsScreen;

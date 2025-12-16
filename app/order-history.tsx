import { Stack, useRouter } from 'expo-router';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, RotateCw } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { shopifyService, Order } from '@/services/shopify';
import { formatCurrency } from '@/utils/currency';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { addMultipleToCart } = useCart();
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['orders', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      return shopifyService.getCustomerOrders(accessToken);
    },
    enabled: !!accessToken,
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'FULFILLED':
        return Colors.success;
      case 'PENDING':
      case 'UNFULFILLED':
        return Colors.warning;
      case 'CANCELLED':
      case 'REFUNDED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'FULFILLED':
        return CheckCircle;
      case 'PENDING':
      case 'UNFULFILLED':
        return Clock;
      case 'CANCELLED':
      case 'REFUNDED':
        return XCircle;
      default:
        return Package;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const reorderMutation = useMutation({
    mutationFn: async (order: Order) => {
      console.log('[OrderHistory] Starting re-order for order:', order.name);
      console.log('[OrderHistory] Line items count:', order.lineItems.length);
      
      const productsToAdd: { product: Product; quantity: number }[] = [];
      
      for (const item of order.lineItems) {
        console.log('[OrderHistory] Processing line item:', item.title);
        console.log('[OrderHistory] Variant ID:', item.id);
        
        if (!item.id) {
          console.warn('[OrderHistory] Skipping item without variant ID:', item.title);
          continue;
        }
        
        let productId = item.id;
        if (item.id.includes('ProductVariant')) {
          productId = item.id.replace(/gid:\/\/shopify\/ProductVariant\/\d+/, 'gid://shopify/Product/0');
          const match = item.id.match(/ProductVariant\/(\d+)/);
          if (match) {
            productId = `gid://shopify/Product/${match[1]}`;
          }
        }
        
        const product: Product = {
          id: productId,
          name: item.title,
          brand: 'Unknown',
          price: item.price,
          currencyCode: order.currencyCode,
          image: item.image || 'https://via.placeholder.com/400x500',
          images: item.image ? [item.image] : [],
          category: 'Uncategorized',
          description: '',
          rating: 0,
          reviewCount: 0,
          inStock: true,
          variantId: item.id,
          tags: [],
        };
        
        productsToAdd.push({ product, quantity: item.quantity });
      }
      
      console.log('[OrderHistory] Products to add:', productsToAdd.length);
      
      if (productsToAdd.length === 0) {
        throw new Error('No valid items found in this order');
      }
      
      await addMultipleToCart(productsToAdd);
      console.log('[OrderHistory] Successfully added all items to cart');
    },
    onSuccess: () => {
      console.log('[OrderHistory] Re-order successful');
      setReorderingOrderId(null);
      setSuccessMessage('Items successfully added to cart');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error: any) => {
      console.error('[OrderHistory] Re-order failed:', error);
      setReorderingOrderId(null);
      setSuccessMessage(error.message || 'Failed to add items to cart');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  const handleReorder = (order: Order) => {
    console.log('[OrderHistory] Re-order button pressed for order:', order.name);
    setReorderingOrderId(order.id);
    reorderMutation.mutate(order);
  };

  const renderOrderCard = (order: Order) => {
    const StatusIcon = getStatusIcon(order.fulfillmentStatus);
    const statusColor = getStatusColor(order.fulfillmentStatus);

    return (
      <Pressable
        key={order.id}
        style={({ pressed }) => [
          styles.orderCard,
          pressed && styles.orderCardPressed,
        ]}
        onPress={() => {
          router.push(`/order-details?orderId=${encodeURIComponent(order.id)}` as any);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusIconContainer, { backgroundColor: `${statusColor}15` }]}>
              <StatusIcon size={18} color={statusColor} />
            </View>
            <View style={styles.orderHeaderText}>
              <Text style={styles.orderNumber}>{order.name}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </View>

        <View style={styles.orderItems}>
          {order.lineItems.slice(0, 2).map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.orderItem}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.orderItemImage} />
              )}
              <View style={styles.orderItemDetails}>
                <Text style={styles.orderItemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.variantTitle && (
                  <Text style={styles.orderItemVariant}>{item.variantTitle}</Text>
                )}
                <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatCurrency(item.price * item.quantity, order.currencyCode)}
              </Text>
            </View>
          ))}
          {order.lineItems.length > 2 && (
            <Text style={styles.moreItems}>
              +{order.lineItems.length - 2} more item{order.lineItems.length - 2 > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderFooterTop}>
            <View style={styles.orderStatus}>
              <Text style={styles.orderStatusLabel}>Status:</Text>
              <Text style={[styles.orderStatusText, { color: statusColor }]}>
                {order.fulfillmentStatus.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.orderTotal}>
              <Text style={styles.orderTotalLabel}>Total:</Text>
              <Text style={styles.orderTotalAmount}>
                {formatCurrency(order.totalPrice, order.currencyCode)}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.reorderButton,
              pressed && styles.reorderButtonPressed,
              reorderingOrderId === order.id && styles.reorderButtonLoading,
            ]}
            onPress={() => handleReorder(order)}
            disabled={reorderingOrderId === order.id}
          >
            {reorderingOrderId === order.id ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <RotateCw size={16} color={Colors.white} />
            )}
            <Text style={styles.reorderButtonText}>
              {reorderingOrderId === order.id ? 'Adding to Cart...' : 'Re-Order'}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Order History',
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        {successMessage && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{successMessage}</Text>
          </View>
        )}
        {ordersQuery.isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : ordersQuery.error ? (
          <View style={styles.centerContainer}>
            <Package size={64} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Error Loading Orders</Text>
            <Text style={styles.emptySubtitle}>
              Please try again later
            </Text>
          </View>
        ) : !ordersQuery.data || ordersQuery.data.length === 0 ? (
          <View style={styles.centerContainer}>
            <Package size={64} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your order history will appear here once you make your first purchase
            </Text>
            <Pressable
              style={styles.shopButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.orderCount}>
              {ordersQuery.data.length} Order{ordersQuery.data.length !== 1 ? 's' : ''}
            </Text>
            {ordersQuery.data.map(renderOrderCard)}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  orderCount: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardPressed: {
    opacity: 0.7,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderHeaderText: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderItems: {
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  orderItemVariant: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  moreItems: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  orderFooter: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
  },
  orderFooterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderStatusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  orderStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  reorderButtonPressed: {
    opacity: 0.7,
  },
  reorderButtonLoading: {
    opacity: 0.6,
  },
  reorderButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
    textAlign: 'center',
  },
});

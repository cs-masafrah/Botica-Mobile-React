// app/order-history.tsx
import { Stack, useRouter } from 'expo-router';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, RotateCw, AlertCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import Colors from '@/constants/colors';
import { orderService, Order } from '@/services/OrderService';
import { formatPrice } from '@/utils/currency';
import { useCart } from '@/contexts/CartContext';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { reorder } = useCart();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await orderService.getOrdersList({
        page: 1,
        limit: 20,
      });
      setOrders(result.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setErrorMessage('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'processing':
        return Colors.warning;
      case 'completed':
      case 'delivered':
        return Colors.success;
      case 'cancelled':
      case 'refunded':
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'processing':
        return Clock;
      case 'completed':
      case 'delivered':
        return CheckCircle;
      case 'cancelled':
      case 'refunded':
      case 'failed':
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

  const handleReorder = async (orderId: string) => {
    setReorderingOrderId(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const result = await reorder(orderId);
      if (result.success) {
        setSuccessMessage('Items successfully added to cart');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(result.message || 'Failed to add items to cart');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add items to cart');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setReorderingOrderId(null);
    }
  };

  const renderOrderCard = (order: Order) => {
    const StatusIcon = getStatusIcon(order.status);
    const statusColor = getStatusColor(order.status);
    const canReorder = order.status.toLowerCase() === 'completed' || 
                      order.status.toLowerCase() === 'delivered';

    return (
      <Pressable
        key={order.id}
        style={({ pressed }) => [
          styles.orderCard,
          pressed && styles.orderCardPressed,
        ]}
        onPress={() => {
          router.push(`/orders/${order.id}`);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusIconContainer, { backgroundColor: `${statusColor}15` }]}>
              <StatusIcon size={18} color={statusColor} />
            </View>
            <View style={styles.orderHeaderText}>
              <Text style={styles.orderNumber}>Order #{order.incrementId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <Text style={[styles.summaryValue, { color: statusColor }]}>
              {order.status}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Items:</Text>
            <Text style={styles.summaryValue}>{order.totalQtyOrdered}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={[styles.summaryValue, styles.orderTotal]}>
              {formatPrice(order.formattedPrice.grandTotal, 'USD')}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Pressable
            style={({ pressed }) => [
              styles.reorderButton,
              pressed && styles.reorderButtonPressed,
              (reorderingOrderId === order.id || !canReorder) && styles.reorderButtonDisabled,
            ]}
            onPress={() => handleReorder(order.id)}
            disabled={reorderingOrderId === order.id || !canReorder}
          >
            {reorderingOrderId === order.id ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <RotateCw size={16} color={Colors.white} />
            )}
            <Text style={styles.reorderButtonText}>
              {reorderingOrderId === order.id ? 'Adding to Cart...' : 'Reorder'}
            </Text>
          </Pressable>
          
          {!canReorder && (
            <Text style={styles.reorderNote}>
              Reorder available for completed orders only
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Order History', headerBackTitle: 'Back' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Order History',
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        {(successMessage || errorMessage) && (
          <View style={[
            styles.feedbackContainer,
            errorMessage ? styles.errorFeedback : styles.successFeedback
          ]}>
            {errorMessage ? (
              <AlertCircle size={18} color={Colors.white} />
            ) : (
              <CheckCircle size={18} color={Colors.white} />
            )}
            <Text style={styles.feedbackText}>
              {errorMessage || successMessage}
            </Text>
          </View>
        )}
        
        {orders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Package size={64} color={Colors.textSecondary} />
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
          >
            <View style={styles.headerSection}>
              <Text style={styles.orderCount}>
                {orders.length} Order{orders.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.headerNote}>
                Tap on an order for details
              </Text>
            </View>
            
            {orders.map(renderOrderCard)}
            
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Showing {orders.length} most recent orders
              </Text>
              {orders.length >= 20 && (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={() => {/* Load more implementation */}}
                >
                  <Text style={styles.loadMoreText}>Load More</Text>
                </Pressable>
              )}
            </View>
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
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  headerSection: {
    marginBottom: 16,
  },
  orderCount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerNote: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderSummary: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  orderFooter: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
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
    opacity: 0.8,
  },
  reorderButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textSecondary,
  },
  reorderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  reorderNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successFeedback: {
    backgroundColor: Colors.success,
  },
  errorFeedback: {
    backgroundColor: Colors.error,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadMoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
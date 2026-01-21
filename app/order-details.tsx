// app/order-details.tsx
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Clock, CheckCircle, XCircle, MapPin, CreditCard, Truck, AlertCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import Colors from '@/constants/colors';
import { orderService, OrderDetail } from '@/services/OrderService';
import { formatPrice } from '@/utils/currency';
import { useCart } from '@/contexts/CartContext';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { reorder } = useCart();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const orderData = await orderService.getOrderDetail(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const result = await orderService.cancelOrder(orderId);
              if (result.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                loadOrderDetail(); // Refresh order data
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleReorder = async () => {
    if (!orderId) return;
    
    setReordering(true);
    try {
      const result = await reorder(orderId);
      if (result.success) {
        Alert.alert('Success', 'Items added to cart. You can now proceed to checkout.');
        router.push('/cart');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Order Details', headerBackTitle: 'Back' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Order Details', headerBackTitle: 'Back' }} />
        <View style={styles.centerContainer}>
          <Package size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Order Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This order could not be found
          </Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const statusColor = getStatusColor(order.status);
  const canCancel = order.status.toLowerCase() === 'pending';
  const canReorder = order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered';

  return (
    <>
      <Stack.Screen
        options={{
          title: `Order #${order.incrementId}`,
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusCard}>
            <View style={[styles.statusIconContainer, { backgroundColor: `${statusColor}15` }]}>
              <StatusIcon size={32} color={statusColor} />
            </View>
            <Text style={styles.orderNumber}>Order #{order.incrementId}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          {order.shippingAddress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Truck size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Shipping Address</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.addressName}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </Text>
                <Text style={styles.addressLine}>{order.shippingAddress.address}</Text>
                <Text style={styles.addressLine}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postcode}
                </Text>
                <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
                <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
              </View>
            </View>
          )}

          {order.billingAddress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Billing Address</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.addressName}>
                  {order.billingAddress.firstName} {order.billingAddress.lastName}
                </Text>
                <Text style={styles.addressLine}>{order.billingAddress.address}</Text>
                <Text style={styles.addressLine}>
                  {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postcode}
                </Text>
                <Text style={styles.addressLine}>{order.billingAddress.country}</Text>
                <Text style={styles.addressPhone}>{order.billingAddress.phone}</Text>
              </View>
            </View>
          )}

          {order.payment && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CreditCard size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Payment Information</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Method:</Text>
                  <Text style={styles.paymentValue}>{order.payment.methodTitle}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Status:</Text>
                  <Text style={[styles.paymentValue, { color: statusColor }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Items ({order.items.length})
              </Text>
            </View>
            <View style={styles.card}>
              {order.items.map((item, index) => (
                <View key={`${item.id}-${index}`}>
                  <View style={styles.itemRow}>
                    {item.product?.images?.[0]?.url ? (
                      <Image 
                        source={{ uri: item.product.images[0].url }} 
                        style={styles.itemImage} 
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <Package size={24} color={Colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                      <Text style={styles.itemQuantity}>Quantity: {item.qtyOrdered}</Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.formattedPrice.price, 'USD')} each
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatPrice(item.formattedPrice.total, 'USD')}
                    </Text>
                  </View>
                  {index < order.items.length - 1 && (
                    <View style={styles.itemDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(order.formattedPrice.subTotal, 'USD')}
                </Text>
              </View>
              
              {order.formattedPrice.shippingAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(order.formattedPrice.shippingAmount, 'USD')}
                  </Text>
                </View>
              )}
              
              {order.formattedPrice.taxAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(order.formattedPrice.taxAmount, 'USD')}
                  </Text>
                </View>
              )}
              
              {order.formattedPrice.discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -{formatPrice(order.formattedPrice.discountAmount, 'USD')}
                  </Text>
                </View>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(order.formattedPrice.grandTotal, 'USD')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <View style={styles.actions}>
              {canCancel && (
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <XCircle size={20} color={Colors.error} />
                  )}
                  <Text style={styles.cancelButtonText}>
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </Text>
                </Pressable>
              )}
              
              {canReorder && (
                <Pressable
                  style={[styles.actionButton, styles.reorderButton]}
                  onPress={handleReorder}
                  disabled={reordering}
                >
                  {reordering ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Package size={20} color={Colors.white} />
                  )}
                  <Text style={styles.reorderButtonText}>
                    {reordering ? 'Adding to Cart...' : 'Reorder'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
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
  },
  backButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
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
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    width: 80,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 12,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  discountValue: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsSection: {
    marginBottom: 40,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  reorderButton: {
    backgroundColor: Colors.primary,
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
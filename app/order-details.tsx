import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Clock, CheckCircle, XCircle, MapPin } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { shopifyService, Order } from '@/services/shopify';
import { formatCurrency } from '@/utils/currency';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { accessToken } = useAuth();

  const orderQuery = useQuery<Order | null>({
    queryKey: ['order', orderId, accessToken],
    queryFn: async () => {
      if (!accessToken || !orderId) return null;
      const orders = await shopifyService.getCustomerOrders(accessToken);
      return orders.find(o => o.id === orderId) || null;
    },
    enabled: !!accessToken && !!orderId,
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const order = orderQuery.data;
  const StatusIcon = order ? getStatusIcon(order.fulfillmentStatus) : Package;
  const statusColor = order ? getStatusColor(order.fulfillmentStatus) : Colors.textSecondary;



  if (orderQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerBackTitle: 'Back',
          }}
        />
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
        <Stack.Screen
          options={{
            title: 'Order Details',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centerContainer}>
          <Package size={64} color={Colors.textSecondary} strokeWidth={1.5} />
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

  return (
    <>
      <Stack.Screen
        options={{
          title: order.name,
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
            <Text style={styles.orderNumber}>{order.name}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.fulfillmentStatus.replace('_', ' ')}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          {order.shippingAddress && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Shipping Address</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.addressName}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </Text>
                <Text style={styles.addressLine}>{order.shippingAddress.address1}</Text>
                <Text style={styles.addressLine}>
                  {order.shippingAddress.city}
                </Text>
                <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Items ({order.lineItems.length})
              </Text>
            </View>
            <View style={styles.card}>
              {order.lineItems.map((item, index) => (
                <View key={`${item.id}-${index}`}>
                  <View style={styles.itemRow}>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.variantTitle && (
                        <Text style={styles.itemVariant}>{item.variantTitle}</Text>
                      )}
                      <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(item.price, order.currencyCode)} each
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity, order.currencyCode)}
                    </Text>
                  </View>
                  {index < order.lineItems.length - 1 && (
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
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(order.totalPrice, order.currencyCode)}
                </Text>
              </View>
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
  backButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
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
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  addressPhone: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
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
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 14,
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
    fontWeight: '700' as const,
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
    fontWeight: '500' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});

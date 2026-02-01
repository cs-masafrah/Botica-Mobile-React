// app/(tabs)/brand/[id].tsx - UPDATED
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProductsByBrand } from '@/app/hooks/useProductsByBrand';
import ProductCard from '@/components/ProductCard';

const BrandProductsScreen = () => {
  const params = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    brandId: string;
  }>();
  
  const brandValue = params.id;
  const brandName = params.name || 'Brand Products';
  
  const { data: productsData, isLoading, error } = useProductsByBrand(brandValue) as {
    data: { data: any[] } | null;
    isLoading: boolean;
    error: Error | null;
  };
  
  const products = productsData?.data || [];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading {brandName} products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error loading products</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Minimal padding */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.brandName}>{brandName}</Text>
          <Text style={styles.productCount}>
            {products.length} products
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Products Grid - Only grid view */}
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard product={item} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found for "{brandName}"</Text>
            <Pressable style={styles.backButtonEmpty} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back to Brands</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  // Header - Minimal padding
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  productCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  headerRight: {
    width: 40,
  },
  // Products Grid
  productsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  productsRow: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonEmpty: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BrandProductsScreen;
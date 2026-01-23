// app/(tabs)/brand/[id].tsx - UPDATED
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Grid3x3, List } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useProductsByBrand } from '@/app/hooks/useProductsByBrand';
import ProductCard from '@/components/ProductCard';

const BrandProductsScreen = () => {
  const params = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    brandId: string;
    // The "id" param is actually the brandValue, and "brandId" is the option_id
  }>();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  // DEBUG: Log what we're receiving
  console.log('🔍 [BrandProductsScreen] Params received:', {
    id: params.id,
    name: params.name,
    brandId: params.brandId,
    allParams: params
  });
  
  // The "id" parameter from the URL should be the brandValue
  // The "brandId" parameter is the option_id (numeric ID)
  const brandValue = params.id; // This is what the hook expects
  const brandName = params.name || 'Brand Products';
  
  console.log('🔍 [BrandProductsScreen] Calling useProductsByBrand with:', {
    brandValue,
    type: typeof brandValue
  });
  
   const { data: productsData, isLoading, error } = useProductsByBrand(brandValue) as {
    data: { data: any[] } | null;
    isLoading: boolean;
    error: Error | null;
  };
  
  // DEBUG: Log the response
  console.log('🔍 [BrandProductsScreen] Hook response:', {
    isLoading,
    error: error?.message,
    dataCount: productsData?.data?.length || 0,
    hasData: !!productsData,
    hasProducts: !!productsData?.data
  });
  
  const products = productsData?.data || [];

  const renderProductItem = ({ item }: { item: any }) => {
    if (viewMode === 'grid') {
      return (
        <View style={styles.gridItem}>
          <ProductCard product={item} />
        </View>
      );
    }
    
    // List view
    return (
      <View style={styles.listItem}>
        <ProductCard product={item} />
      </View>
    );
  };

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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
        <View style={styles.viewModeContainer}>
          <Pressable 
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid3x3 size={20} color={viewMode === 'grid' ? Colors.primary : Colors.textSecondary} />
          </Pressable>
          <Pressable 
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={20} color={viewMode === 'list' ? Colors.primary : Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Products */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.productsRow : undefined}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found for &quot;{brandName}&quot;</Text>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
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
    marginTop: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary + '20',
  },
  productsContainer: {
    padding: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 16,
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
    padding: 40,
    alignItems: 'center',
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
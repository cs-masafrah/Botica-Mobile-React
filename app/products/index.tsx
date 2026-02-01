// app/products/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Search, Grid, ChevronLeft, X } from 'lucide-react-native';
import { useAllProducts } from '../hooks/useAllProducts';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 32) / 2;

export default function AllProductsScreen() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  
  const { data: productsData, isLoading, error } = useAllProducts([
    { key: "status", value: "1" }
  ]);
  
  const allProducts = productsData?.allProducts?.data || [];
  
  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.priceHtml?.finalPrice || 0) - (b.priceHtml?.finalPrice || 0);
      case 'price-high':
        return (b.priceHtml?.finalPrice || 0) - (a.priceHtml?.finalPrice || 0);
      case 'newest':
      default:
        return 0;
    }
  });
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{t('error')}</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Colors.background} 
        translucent={Platform.OS === 'android'}
      />
      
      {/* Header - No extra tab header above this */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('allProducts')}</Text>
          <View style={styles.headerRight} />
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchProducts')}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <X size={18} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
      
      {/* Results Count and Sort */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {sortedProducts.length} {t('products')}
        </Text>
        
        <View style={styles.sortContainer}>
          {(['newest', 'price-low', 'price-high'] as const).map((item) => (
            <Pressable
              key={item}
              style={[styles.sortButton, sortBy === item && styles.sortButtonActive]}
              onPress={() => setSortBy(item)}
            >
              <Text style={[styles.sortButtonText, sortBy === item && styles.sortButtonTextActive]}>
                {t(item)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? t('noProductsFoundForSearch') : t('noProductsAvailable')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try different keywords' : 'Check back later'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          numColumns={2}
          renderItem={({ item, index }) => (
            <View style={[
              styles.gridItemContainer,
              index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight
            ]}>
              <ProductCard 
                product={item}
                variant="vertical"
              />
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gridListContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.gridColumnWrapper}
          ListFooterComponent={<View style={styles.listFooterSpacer} />}
        />
      )}
    </View>
  );
}

const SPACING = 16;
const RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ================= HEADER ================= */
  header: {
    backgroundColor: Colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },

  /* ================= SEARCH ================= */
  searchContainer: {
    paddingHorizontal: SPACING,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: RADIUS,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  /* ================= RESULTS + SORT ================= */
  resultsHeader: {
    paddingHorizontal: SPACING,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sortButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  /* ================= GRID ================= */
  gridListContent: {
    paddingHorizontal: SPACING,
    paddingTop: 8,
    paddingBottom: 24,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItemContainer: {
    width: GRID_ITEM_WIDTH,
  },
  gridItemLeft: {
    marginRight: 8,
  },
  gridItemRight: {
    marginLeft: 8,
  },

  listFooterSpacer: {
    height: 24,
  },

  /* ================= STATES ================= */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

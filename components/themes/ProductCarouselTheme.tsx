// components/themes/ProductCarouselTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useFilteredProducts } from '../../app/hooks/useFilteredProducts';
import { Theme } from '@/types/theme';
import ProductCard from '../ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

interface ProductCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

const ProductCarouselTheme: React.FC<ProductCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  
  // Get filters from theme
  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];
  
  console.log(`🔍 [ProductCarouselTheme] Theme: ${theme.name}, Title: "${title}"`);
  console.log(`   Filters:`, filters);
  
  // Use filtered products hook with theme filters
  const { data: filteredProducts = [], isLoading } = useFilteredProducts(filters);
  
  console.log(`   Filtered products count: ${filteredProducts.length}`);
  console.log(`   Loading state: ${isLoading}`);

  if (isLoading) {
    console.log(`   ⏳ Loading products for "${title}"...`);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
            {title}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}...</Text>
        </View>
      </View>
    );
  }

  if (!filteredProducts.length) {
    console.log(`❌ [ProductCarouselTheme] No products found for "${title}". Filters:`, filters);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
            {title}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('noProductsFound')}</Text>
          <Text style={styles.emptySubText}>
            {filters.length > 0 
              ? `No products match the current filters`
              : `No products available in this category`
            }
          </Text>
        </View>
      </View>
    );
  }

  console.log(`✅ [ProductCarouselTheme] Rendering "${title}" with ${filteredProducts.length} products`);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/product/[id]')}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            <ProductCard product={item as any} />
          </View>
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={150} // Optional: for better scrolling
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    backgroundColor: Colors.background,
    minHeight: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingRight: 8, // Extra padding for last item
  },
  productContainer: {
    marginRight: 12,
    width: 150, // Fixed width for consistent layout
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProductCarouselTheme;
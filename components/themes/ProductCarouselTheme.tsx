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
}

const ProductCarouselTheme: React.FC<ProductCarouselThemeProps> = ({ theme }) => {
  const { t, isRTL, locale } = useLanguage();
  
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
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {title}
          </Text>
          {/* No "See All" in loading state */}
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t('loading')}...
          </Text>
        </View>
      </View>
    );
  }

  if (!filteredProducts.length) {
    console.log(`❌ [ProductCarouselTheme] No products found for "${title}". Filters:`, filters);
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {title}
          </Text>
          {/* No "See All" in empty state */}
        </View>
        <View style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}>
          <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
            {t('noProductsFound')}
          </Text>
          <Text style={[styles.emptySubText, isRTL && styles.emptySubTextRTL]}>
            {filters.length > 0 
              ? t('noProductsMatchFilters')
              : t('noProductsAvailable')
            }
          </Text>
        </View>
      </View>
    );
  }

  console.log(`✅ [ProductCarouselTheme] Rendering "${title}" with ${filteredProducts.length} products`);

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/products')}>
          <Text style={[styles.seeAllText, isRTL && styles.seeAllTextRTL]}>
            {t('seeAll')}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={[styles.productContainer, isRTL && styles.productContainerRTL]}>
            <ProductCard product={item as any} />
          </View>
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, isRTL && styles.listContentRTL]}
        snapToInterval={150}
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
  containerRTL: {
    direction: "rtl",
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerRTL: {
    flexDirection: 'row', // Keep as row, not row-reverse
  },
  
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1, // Allow title to take available space
  },
  titleRTL: {
    textAlign: 'left', // Title stays on left in RTL (since header is reversed by container)
  },
  
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 16, // Add spacing from title
  },
  seeAllTextRTL: {
    marginLeft: 0,
    marginRight: 16, // Add spacing from title in RTL
  },
  
  listContent: {
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  listContentRTL: {
    paddingHorizontal: 16,
    paddingLeft: 8,
    paddingRight: 16,
    flexDirection: 'row', // Keep as row, not row-reverse (container handles RTL)
  },
  
  productContainer: {
    marginRight: 12,
    width: 150,
  },
  productContainerRTL: {
    marginRight: 12, // Keep consistent margin
    marginLeft: 0,
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
  loadingTextRTL: {
    textAlign: 'center',
  },
  
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyContainerRTL: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyTextRTL: {
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptySubTextRTL: {
    textAlign: 'center',
  },
});

export default ProductCarouselTheme;
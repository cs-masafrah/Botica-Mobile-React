// components/themes/ProductCarouselTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useAllProducts } from '@/hooks/useAllProducts';
import { Theme, ThemeFilter } from '@/types/theme';
import ProductCard from '../ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

interface ProductCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

const ProductCarouselTheme: React.FC<ProductCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  const { data: productsData } = useAllProducts();
  const products = productsData?.allProducts.data || [];

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];
  
  // Apply filters from theme options
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    filters.forEach((filter: ThemeFilter) => {
      if (filter.key === 'new' && filter.value === '1') {
        // Show new products - in Bagisto, this might be by creation date
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      } else if (filter.key === 'featured' && filter.value === '1') {
        // Show featured products - you need to check your product structure
        filtered = filtered.filter(p => 
          p.additionalData?.some(data => 
            data.label === 'Is Featured' && data.value === '1'
          )
        );
      } else if (filter.key === 'sort') {
        // Apply sorting
        const [field, order] = filter.value.split('-');
        if (field === 'name') {
          filtered.sort((a, b) => 
            order === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          );
        } else if (field === 'price') {
          filtered.sort((a, b) => 
            order === 'asc'
              ? (a.priceHtml?.finalPrice || 0) - (b.priceHtml?.finalPrice || 0)
              : (b.priceHtml?.finalPrice || 0) - (a.priceHtml?.finalPrice || 0)
          );
        }
      }
    });
    
    // Apply limit if specified
    const limitFilter = filters.find(f => f.key === 'limit');
    const limit = limitFilter ? parseInt(limitFilter.value, 10) : 10;
    
    return filtered.slice(0, limit);
  }, [products, filters]);

  if (!filteredProducts.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/products')}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            <ProductCard product={item} />
          </View>
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
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
  },
  productContainer: {
    marginRight: 12,
    width: 150,
  },
});

export default ProductCarouselTheme;
// components/themes/ProductCarouselTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useAllProducts } from '../../app/hooks/useAllProducts';
import { Theme, ThemeFilter } from '@/types/theme';
import ProductCard from '../ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { Product } from '@/types/product';

interface ProductCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

const ProductCarouselTheme: React.FC<ProductCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  const { data: productsData } = useAllProducts();
  const products: Product[] = productsData?.allProducts.data || [];

  console.log(`🔍 [ProductCarouselTheme] Theme: ${theme.name}, Products: ${products.length}`);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];
  
  console.log(`   Title: "${title}", Filters:`, filters);

  // Apply filters from theme options
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    console.log(`   Initial products: ${filtered.length}`);

    filters.forEach((filter: ThemeFilter) => {

      console.log(`   Applying filter: ${filter.key} = ${filter.value}`);

      if (filter.key === 'new' && filter.value === '1') {
        // Show new products - you might need to adjust this based on your data
        // Assuming newer products have higher IDs or timestamps
        filtered = filtered.sort((a, b) => 
          parseInt(b.id) - parseInt(a.id)
        );
        console.log(`   Sorted by new (ID descending)`);
      } else if (filter.key === 'featured' && filter.value === '1') {
        // Show featured products
        filtered = filtered.filter(p => 
          p.additionalData?.some(data => 
            data.label === 'Is Featured' && data.value === '1'
          )
        );
        console.log(`   Filtered featured: ${filtered.length} products`);
      } else if (filter.key === 'sort') {
        // Apply sorting
        const [field, order] = filter.value.split('-');
        if (field === 'name') {
          filtered.sort((a, b) => 
            order === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          );
        } else if (filter.value === 'name-asc') {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (filter.value === 'name-desc') {
          filtered.sort((a, b) => b.name.localeCompare(a.name));
        }
      }
    });
    
    // Apply limit if specified
    const limitFilter = filters.find(f => f.key === 'limit');
    const limit = limitFilter ? parseInt(limitFilter.value, 10) : 10;
    
    return filtered.slice(0, limit);
  }, [products, filters]);

  if (!filteredProducts.length) {
    console.log(`❌ [ProductCarouselTheme] No filtered products for "${title}". Returning null.`);
    return null;
  }

  console.log(`✅ [ProductCarouselTheme] Rendering "${title}" with ${filteredProducts.length} products`);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/(tabs)')}>
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
  },
});

export default ProductCarouselTheme;
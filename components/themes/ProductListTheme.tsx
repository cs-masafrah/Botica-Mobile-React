// components/themes/ProductListTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useFilteredProducts } from '../../app/hooks/useFilteredProducts';
import { Theme } from '@/types/theme';
import ProductCard from '../ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

interface ProductListThemeProps {
  theme: Theme;
}

const ProductListTheme: React.FC<ProductListThemeProps> = ({ theme }) => {
  const { t, isRTL, locale } = useLanguage();
  
  // All hooks must be called at the top level, unconditionally
  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];
  
  console.log(`🔍 [ProductListTheme] Theme: ${theme.name}, Title: "${title}"`);
  console.log(`   Filters:`, filters);
  
  // Use filtered products hook with theme filters - always called
  const { data: filteredProducts = [], isLoading } = useFilteredProducts(filters);
  
  console.log(`   Filtered products count: ${filteredProducts.length}`);
  console.log(`   Loading state: ${isLoading}`);

  // Calculate number of columns based on screen width - always defined
  const numColumns = 2;
  
  // Format data for grid with empty items to fill the last row - always called
  const formattedData = useMemo(() => {
    if (!filteredProducts.length) return [];
    
    const itemsPerRow = numColumns;
    const numberOfFullRows = Math.floor(filteredProducts.length / itemsPerRow);
    
    let numberOfElementsInLastRow = filteredProducts.length - (numberOfFullRows * itemsPerRow);
    
    const data = [...filteredProducts];
    
    // Add empty items to complete the last row for proper alignment
    while (numberOfElementsInLastRow !== 0 && numberOfElementsInLastRow < itemsPerRow) {
      data.push({ id: `empty-${numberOfElementsInLastRow}`, isEmpty: true } as any);
      numberOfElementsInLastRow++;
    }
    
    return data;
  }, [filteredProducts, numColumns]);

  // Loading state
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

  // Empty state
  if (!filteredProducts.length) {
    console.log(`❌ [ProductListTheme] No products found for "${title}". Filters:`, filters);
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

  console.log(`✅ [ProductListTheme] Rendering "${title}" with ${filteredProducts.length} products`);

  const renderItem = ({ item }: { item: any }) => {
    if (item.isEmpty) {
      return <View style={[styles.gridItem, styles.emptyGridItem]} />;
    }
    
    return (
      <View style={styles.gridItem}>
        <ProductCard product={item as any} />
      </View>
    );
  };

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
        data={formattedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `empty-${index}`}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scrolling to allow parent FlatList to handle scrolling
        contentContainerStyle={styles.listContent}
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
    marginBottom: 16,
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
    paddingHorizontal: 12,
  },
  
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  
  gridItem: {
    width: '48%', // Slightly less than 50% to account for spacing
    marginBottom: 8,
  },
  
  emptyGridItem: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
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

export default ProductListTheme;
// components/themes/ProductListTheme.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useFilteredProducts } from '../../app/hooks/useFilteredProducts';
import { Theme } from '@/types/theme';
import ProductCard from '../ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

const INITIAL_DISPLAY_COUNT = 12;
const LOAD_MORE_COUNT = 12;

interface ProductListThemeProps {
  theme: Theme;
}

const ProductListTheme: React.FC<ProductListThemeProps> = ({ theme }) => {
  const { t, isRTL, locale } = useLanguage();
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  
  // Get translation and filters
  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];
  
  // Extract limit from filters
  const limitFilter = filters.find(f => f.key === 'limit');
  const themeLimit = limitFilter ? parseInt(limitFilter.value, 10) : Infinity;
  
  console.log(`🔍 [ProductListTheme] Theme: ${theme.name}, Title: "${title}"`);
  console.log(`   Filters:`, filters);
  console.log(`   Theme limit: ${themeLimit}`);
  
  // Use filtered products hook with theme filters
  const { data: allProducts = [], isLoading } = useFilteredProducts(filters);
  
  console.log(`   Total products from API: ${allProducts.length}`);
  
  // Respect the theme limit - only show up to themeLimit products total
  const availableProducts = useMemo(() => {
    const limited = allProducts.slice(0, themeLimit);
    console.log(`   Available products after limit (${themeLimit}): ${limited.length}`);
    return limited;
  }, [allProducts, themeLimit]);

  // Get displayed products based on current display count
  const displayedProducts = useMemo(() => {
    const displayed = availableProducts.slice(0, displayCount);
    console.log(`   Displayed products (${displayCount}): ${displayed.length}`);
    return displayed;
  }, [availableProducts, displayCount]);

  const hasMoreToShow = displayCount < availableProducts.length;
  const hasReachedLimit = displayCount >= themeLimit || displayCount >= availableProducts.length;
  
  console.log(`   State: displayCount=${displayCount}, availableProducts.length=${availableProducts.length}`);
  console.log(`   Has more to show: ${hasMoreToShow}`);
  console.log(`   Has reached limit: ${hasReachedLimit}`);

  // Reset display count when theme changes
  useEffect(() => {
    console.log(`   🔄 Resetting display count due to theme change`);
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [theme.id]);

  // Calculate number of columns
  const numColumns = 2;
  
  // Format data for grid with empty items to fill the last row
  const formattedData = useMemo(() => {
    if (!displayedProducts.length) return [];
    
    const itemsPerRow = numColumns;
    const numberOfFullRows = Math.floor(displayedProducts.length / itemsPerRow);
    let numberOfElementsInLastRow = displayedProducts.length - (numberOfFullRows * itemsPerRow);
    
    const data = [...displayedProducts];
    
    // Add empty items to complete the last row for proper alignment
    while (numberOfElementsInLastRow !== 0 && numberOfElementsInLastRow < itemsPerRow) {
      data.push({ id: `empty-${numberOfElementsInLastRow}`, isEmpty: true } as any);
      numberOfElementsInLastRow++;
    }
    
    return data;
  }, [displayedProducts, numColumns]);

  const handleButtonPress = useCallback(() => {
    console.log(`   👆 Button pressed, hasReachedLimit=${hasReachedLimit}`);
    if (hasReachedLimit) {
      console.log(`   ➡️ Navigating to /products`);
      router.push('/products');
    } else {
      // Show next chunk of products
      const nextCount = Math.min(
        displayCount + LOAD_MORE_COUNT,
        availableProducts.length
      );
      console.log(`   📊 Loading more products: ${displayCount} -> ${nextCount}`);
      setDisplayCount(nextCount);
    }
  }, [hasReachedLimit, displayCount, availableProducts.length]);

  const getButtonText = () => {
    if (hasReachedLimit) return t('seeAll');
    return t('seeMore');
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {title}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t('loading')}...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!availableProducts.length) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {title}
          </Text>
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

  // ALWAYS show button if we have more products than initially displayed
  // OR if we've reached the limit but haven't shown all products yet
  const shouldShowButton = availableProducts.length > INITIAL_DISPLAY_COUNT || 
                          (displayCount < availableProducts.length) ||
                          hasReachedLimit;
  
  console.log(`   🔘 Should show button: ${shouldShowButton} (available: ${availableProducts.length} > ${INITIAL_DISPLAY_COUNT} = ${availableProducts.length > INITIAL_DISPLAY_COUNT})`);

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {title}
        </Text>
        {/* Show progress indicator when we have a button */}
        {shouldShowButton && (
          <Text style={[styles.progress, isRTL && styles.progressRTL]}>
            {displayedProducts.length}/{availableProducts.length}
          </Text>
        )}
      </View>
      
      <FlatList
        data={formattedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `empty-${index}`}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          shouldShowButton ? (
            <View style={styles.footer}>
              <Pressable
                onPress={handleButtonPress}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  hasReachedLimit && styles.seeAllButton,
                ]}
              >
                <Text style={[
                  styles.buttonText,
                  hasReachedLimit && styles.seeAllButtonText,
                ]}>
                  {getButtonText()}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
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
    flexDirection: 'row',
  },
  
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  titleRTL: {
    textAlign: 'left',
  },
  
  progress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 16,
    fontWeight: '500',
  },
  progressRTL: {
    marginLeft: 0,
    marginRight: 16,
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
    width: '48%',
    marginBottom: 8,
  },
  
  emptyGridItem: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  
  seeAllButton: {
    backgroundColor: Colors.secondary || Colors.primary,
  },
  
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  
  seeAllButtonText: {
    color: Colors.background,
  },
  
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, Search, ShoppingBag, X, Plus, Check } from 'lucide-react-native';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useShopify, useShopifyProductsByCollectionId, useShopifyVendors } from '@/contexts/ShopifyContext';
import { useHomepageConfig, HomepageSection } from '@/contexts/HomepageConfigContext';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import type { Banner } from '@/services/shopify';
import { ShippingStrip } from '@/components/ShippingStrip';

interface FallbackBanner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

const BANNER_DATA: FallbackBanner[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    title: 'bannerTitle',
    subtitle: 'bannerSubtitle',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    title: 'luxuryScents',
    subtitle: 'discoverExclusive',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
    title: 'arabianEssence',
    subtitle: 'authenticFragrances',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_INTERVAL = 4000;

function CollectionSection({ 
  collectionId, 
  collectionName, 
  limit,
  sortOrder,
  renderProduct,
}: { 
  collectionId: string; 
  collectionName: string; 
  limit?: number;
  sortOrder?: 'alphabetical' | 'latest' | 'random';
  renderProduct: (item: Product, isHorizontal: boolean) => React.ReactElement | null;
}) {
  const { t, isRTL } = useLanguage();
  const { data: collectionProducts, isLoading } = useShopifyProductsByCollectionId(collectionId);
  
  const sortedProducts = useMemo(() => {
    if (!collectionProducts) return [];
    const sorted = [...collectionProducts];
    
    if (sortOrder === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'latest') {
      sorted.reverse();
    } else if (sortOrder === 'random') {
      sorted.sort(() => Math.random() - 0.5);
    }
    
    return sorted;
  }, [collectionProducts, sortOrder]);
  
  const displayProducts = limit ? sortedProducts.slice(0, limit) : sortedProducts;

  if (isLoading || !displayProducts.length) return null;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
          {collectionName}
        </Text>
        <Pressable onPress={() => router.push({ pathname: '/category/[id]', params: { id: collectionId } })}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={displayProducts}
        renderItem={({ item }) => renderProduct(item, true)}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );
}

function TagSection({
  tag,
  limit,
  sortOrder,
  products,
  renderProduct,
}: {
  tag: string;
  limit?: number;
  sortOrder?: 'alphabetical' | 'latest' | 'random';
  products: Product[];
  renderProduct: (item: Product, isHorizontal: boolean) => React.ReactElement | null;
}) {
  const { isRTL } = useLanguage();
  const tagProducts = useMemo(() => {
    let filtered = products.filter(p => p.tags.includes(tag));
    
    if (sortOrder === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'latest') {
      filtered.reverse();
    } else if (sortOrder === 'random') {
      filtered.sort(() => Math.random() - 0.5);
    }
    
    return limit ? filtered.slice(0, limit) : filtered;
  }, [products, tag, limit, sortOrder]);

  if (!tagProducts.length) return null;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
          {tag}
        </Text>
      </View>
      <FlatList
        data={tagProducts}
        renderItem={({ item }) => renderProduct(item, true)}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );
}

function VendorSection({
  vendorName,
  limit,
  sortOrder,
  products,
  renderProduct,
}: {
  vendorName: string;
  limit?: number;
  sortOrder?: 'alphabetical' | 'latest' | 'random';
  products: Product[];
  renderProduct: (item: Product, isHorizontal: boolean) => React.ReactElement | null;
}) {
  const { t, isRTL } = useLanguage();
  const vendorProducts = useMemo(() => {
    let filtered = products.filter(p => p.brand === vendorName);
    
    if (sortOrder === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'latest') {
      filtered.reverse();
    } else if (sortOrder === 'random') {
      filtered.sort(() => Math.random() - 0.5);
    }
    
    return limit ? filtered.slice(0, limit) : filtered;
  }, [products, vendorName, limit, sortOrder]);

  if (!vendorProducts.length) return null;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
          {vendorName}
        </Text>
        <Pressable onPress={() => router.push({ pathname: '/vendor/[name]', params: { name: vendorName } })}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={vendorProducts}
        renderItem={({ item }) => renderProduct(item, true)}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [displayedProductsCount, setDisplayedProductsCount] = useState(10);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const { itemCount, addToCart, successMessage } = useCart();
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, isRTL } = useLanguage();
  const { products, banners: shopifyBanners } = useShopify();
  const vendors = useShopifyVendors();
  const { sections } = useHomepageConfig();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (successMessage) {
      Animated.sequence([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [successMessage, feedbackOpacity]);

  const activeBanners = useMemo<(Banner | FallbackBanner)[]>(() => {
    if (shopifyBanners.length > 0) {
      console.log('Using Shopify banners:', shopifyBanners);
      return shopifyBanners;
    }
    console.log('Using fallback banner data');
    return BANNER_DATA;
  }, [shopifyBanners]);

  React.useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeBanners.length;
        bannerScrollViewRef.current?.scrollTo({
          x: nextIndex * (SCREEN_WIDTH - 16),
          animated: true,
        });
        return nextIndex;
      });
    }, BANNER_INTERVAL);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const onSaleProducts = useMemo(() => 
    products.filter(p => p.compareAtPrice && p.compareAtPrice > p.price),
    [products]
  );

  const newArrivals = useMemo(() => 
    products.slice(0, 10),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const displayedProducts = useMemo(() => 
    products.slice(0, displayedProductsCount),
    [products, displayedProductsCount]
  );

  const loadMoreProducts = useCallback(() => {
    if (displayedProductsCount < products.length) {
      setDisplayedProductsCount(prev => Math.min(prev + 10, products.length));
    }
  }, [displayedProductsCount, products.length]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 600);
  }, [addToCart]);

  const renderProduct = useCallback((item: Product, isHorizontal = false) => {
    const inWishlist = isInWishlist(item.id);
    const hasDiscount = item.compareAtPrice && item.compareAtPrice > item.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100)
      : 0;
    const isAdded = addedProductId === item.id;
    
    return (
      <Pressable
        style={isHorizontal ? styles.horizontalProductCard : styles.productCard}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
      >
        <View style={isHorizontal ? styles.horizontalImageContainer : styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
            </View>
          )}
          <Pressable 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleWishlist(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart 
              size={18} 
              color={inWishlist ? Colors.error : Colors.text}
              fill={inWishlist ? Colors.error : 'transparent'}
            />
          </Pressable>
          <Pressable 
            style={[styles.addToCartButton, isAdded && styles.addToCartButtonSuccess]}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isAdded ? (
              <Check 
                size={13} 
                color={Colors.white}
                strokeWidth={3}
              />
            ) : (
              <Plus 
                size={13} 
                color={Colors.white}
                strokeWidth={3}
              />
            )}
          </Pressable>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {item.rating}</Text>
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={styles.compareAtPriceText}>{formatPrice(item.compareAtPrice!, item.currencyCode)}</Text>
            )}
            <Text style={styles.priceText}>{formatPrice(item.price, item.currencyCode)}</Text>
          </View>
        </View>
      </Pressable>
    );
  }, [isInWishlist, toggleWishlist, handleAddToCart, addedProductId]);

  const renderBannerSection = useCallback(() => (
    <View style={styles.bannerContainer}>
      <ScrollView
        ref={bannerScrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 16)
          );
          setCurrentBannerIndex(newIndex);
        }}
        style={styles.bannerScrollView}
      >
        {activeBanners.map((banner) => {
          const isShopifyBanner = 'buttonText' in banner;
          const title = isShopifyBanner ? banner.title : t(banner.title);
          const subtitle = isShopifyBanner ? banner.subtitle : t(banner.subtitle);
          const buttonText = isShopifyBanner && banner.buttonText ? banner.buttonText : t('shopNow');
          const cta = isShopifyBanner ? banner.cta : undefined;
          
          return (
            <ImageBackground
              key={banner.id}
              source={{ uri: banner.image }}
              style={styles.banner}
              imageStyle={styles.bannerImage}
            >
              <View style={styles.bannerOverlay}>
                <Text style={[styles.bannerTitle, isRTL && { textAlign: 'right' }]}>
                  {title}
                </Text>
                <Text style={[styles.bannerSubtitle, isRTL && { textAlign: 'right' }]}>
                  {subtitle}
                </Text>
                <Pressable 
                  style={styles.shopButton}
                  onPress={() => {
                    if (cta) {
                      console.log('Navigating to collection:', cta);
                      router.push({ pathname: '/category/[id]', params: { id: cta } });
                    }
                  }}
                >
                  <Text style={styles.shopButtonText}>{buttonText}</Text>
                </Pressable>
              </View>
            </ImageBackground>
          );
        })}
      </ScrollView>
      <View style={styles.paginationContainer}>
        {activeBanners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentBannerIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  ), [activeBanners, currentBannerIndex, isRTL, scrollX, t]);

  const renderSection = useCallback((section: HomepageSection) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'banner':
        return <View key={section.id}>{renderBannerSection()}</View>;
      
      case 'on-sale':
        if (!onSaleProducts.length) return null;
        return (
          <View style={styles.categorySection} key={section.id}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
                {section.title}
              </Text>
            </View>
            <FlatList
              data={section.config?.limit ? onSaleProducts.slice(0, section.config.limit) : onSaleProducts}
              renderItem={({ item }) => renderProduct(item, true)}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        );

      case 'new-arrivals':
        if (!newArrivals.length) return null;
        return (
          <View style={styles.categorySection} key={section.id}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
                {section.title}
              </Text>
            </View>
            <FlatList
              data={section.config?.limit ? newArrivals.slice(0, section.config.limit) : newArrivals}
              renderItem={({ item }) => renderProduct(item, true)}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        );

      case 'collection':
        if (!section.config?.collectionId || !section.config?.collectionName) return null;
        return (
          <CollectionSection
            key={section.id}
            collectionId={section.config.collectionId}
            collectionName={section.config.collectionName}
            limit={section.config.limit}
            sortOrder={section.config.sortOrder}
            renderProduct={renderProduct}
          />
        );

      case 'tag':
        if (!section.config?.tag) return null;
        return (
          <TagSection
            key={section.id}
            tag={section.config.tag}
            limit={section.config.limit}
            sortOrder={section.config.sortOrder}
            products={products}
            renderProduct={renderProduct}
          />
        );

      case 'vendor':
        if (!section.config?.vendorName) return null;
        return (
          <VendorSection
            key={section.id}
            vendorName={section.config.vendorName}
            limit={section.config.limit}
            sortOrder={section.config.sortOrder}
            products={products}
            renderProduct={renderProduct}
          />
        );

      case 'vendors-row':
        if (!vendors.length) return null;
        return (
          <View style={styles.categorySection} key={section.id}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
                {section.title}
              </Text>
            </View>
            <FlatList
              data={vendors}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.vendorRowCard}
                  onPress={() => router.push({ pathname: '/vendor/[name]', params: { name: item.name } })}
                >
                  <View style={styles.vendorRowImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.vendorRowImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <Text style={styles.vendorRowName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.vendorRowCount}>{item.count} items</Text>
                </Pressable>
              )}
              keyExtractor={item => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        );

      case 'brands':
        return (
          <View style={styles.brandsSection} key={section.id}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
                {section.title}
              </Text>
            </View>
            <View style={styles.brandsGrid}>
              {vendors.map((vendor) => (
                <Pressable
                  key={vendor.name}
                  style={styles.brandCard}
                  onPress={() => router.push({ pathname: '/vendor/[name]', params: { name: vendor.name } })}
                >
                  <Image
                    source={{ uri: vendor.image }}
                    style={styles.brandImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  <Text style={styles.brandName} numberOfLines={1}>{vendor.name}</Text>
                  <Text style={styles.brandCount}>{vendor.count} {t('products')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'featured':
        return null;

      default:
        return null;
    }
  }, [isRTL, newArrivals, onSaleProducts, products, vendors, renderBannerSection, renderProduct, t]);

  const enabledSections = useMemo(() => 
    sections.filter(s => s.enabled),
    [sections]
  );

  const showAllProducts = useMemo(() => 
    enabledSections.some(s => s.type === 'featured'),
    [enabledSections]
  );

  return (
    <View style={styles.container}>
      {successMessage && (
        <Animated.View style={[styles.feedbackContainer, { top: insets.top + 16, opacity: feedbackOpacity }]}>
          <Text style={styles.feedbackText}>{successMessage}</Text>
        </Animated.View>
      )}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h4vg1h5whdk3dy6ic3l29' }}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
            />
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => setIsSearchExpanded(!isSearchExpanded)}>
              <Search size={22} color={Colors.text} />
            </Pressable>
            <Pressable style={styles.bagButton} onPress={() => router.push('/(tabs)/cart')}>
              <ShoppingBag size={22} color={Colors.text} />
              {itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {isSearchExpanded && (
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <Pressable onPress={() => {
              setIsSearchExpanded(false);
              setSearchQuery('');
            }}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        )}
      </View>

      <ShippingStrip />

      <FlatList
        style={styles.content}
        showsVerticalScrollIndicator={false}
        data={searchQuery ? [] : (showAllProducts ? displayedProducts : [])}
        renderItem={({ item }) => renderProduct(item, false)}
        keyExtractor={item => item.id}
        numColumns={showAllProducts ? 3 : 1}
        key={showAllProducts ? 'grid' : 'list'}
        columnWrapperStyle={showAllProducts ? [styles.row, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }] : undefined}
        onEndReached={showAllProducts ? loadMoreProducts : undefined}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<>
          {enabledSections.map((section) => renderSection(section))}

          {showAllProducts && (
            <View style={styles.allProductsHeader}>
              <Text style={[styles.categoryTitle, isRTL && { textAlign: 'right' }]}>
                {t('allProducts')}
              </Text>
            </View>
          )}

          {searchQuery ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
                  {t('searchResults')}
                </Text>
                <Pressable onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>{t('clearFilter')}</Text>
                </Pressable>
              </View>
              <FlatList
                data={filteredProducts}
                renderItem={({ item }) => renderProduct(item, false)}
                keyExtractor={item => item.id}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={[styles.row, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}
                contentContainerStyle={styles.listContent}
              />
            </View>
          ) : null}
        </>}
        ListFooterComponent={searchQuery ? null : (
          <View style={styles.footerPadding} />
        )}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 44,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  bagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 8,
    height: 230,
  },
  bannerScrollView: {
    flex: 1,
  },
  banner: {
    width: SCREEN_WIDTH - 16,
    height: 230,
    borderRadius: 0,
    overflow: 'hidden',
  },
  bannerImage: {
    borderRadius: 0,
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 24,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 20,
    opacity: 0.95,
  },
  shopButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  shopButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: Colors.primary,
    opacity: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  footerPadding: {
    height: 20,
  },
  row: {
    gap: 8,
    marginBottom: 0,
    paddingHorizontal: 8,
  },
  productCard: {
    width: '32%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalProductCard: {
    width: 130,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 140,
    backgroundColor: Colors.cardBackground,
  },
  horizontalImageContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 140,
    backgroundColor: Colors.cardBackground,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartButton: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonSuccess: {
    backgroundColor: '#10B981',
  },
  productInfo: {
    padding: 8,
  },
  brandText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  compareAtPriceText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  clearButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  categorySection: {
    marginTop: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  allProductsHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  brandsSection: {
    marginTop: 24,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  brandCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 2,
  },
  brandCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  vendorRowCard: {
    alignItems: 'center',
    width: 90,
    marginRight: 12,
  },
  vendorRowImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vendorRowImage: {
    width: '100%',
    height: '100%',
  },
  vendorRowName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 2,
    lineHeight: 14,
    width: '100%',
    height: 28,
  },
  vendorRowCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  feedbackContainer: {
    position: 'absolute' as const,
    left: 20,
    right: 20,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
});

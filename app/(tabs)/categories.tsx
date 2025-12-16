import { router } from 'expo-router';
import { Sparkles, User, Globe, Star, Gem } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShippingStrip } from '@/components/ShippingStrip';
import { useShopify, useShopifyProductsByCollectionId, useShopifyVendors } from '@/contexts/ShopifyContext';

const CategoryCard = ({ category }: { category: { id: string; name: string; icon: string; image: string } }) => {
  const { t, isRTL } = useLanguage();
  const { data: products, isLoading } = useShopifyProductsByCollectionId(category.id);

  if (isLoading || !products || products.length === 0) {
    return null;
  }

  const iconName = category.icon;
  let IconComponent = Sparkles;
  
  if (iconName === 'User') IconComponent = User;
  else if (iconName === 'Globe') IconComponent = Globe;
  else if (iconName === 'Star') IconComponent = Star;
  else if (iconName === 'Gem') IconComponent = Gem;

  const handleCategoryPress = () => {
    router.push({
      pathname: '/category/[id]',
      params: { id: category.id, name: category.name },
    });
  };

  return (
    <Pressable 
      style={styles.categoryCard}
      onPress={handleCategoryPress}
    >
      <Image
        source={{ uri: category.image }}
        style={styles.categoryImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
      />
      <View style={styles.overlay} />
      <View style={styles.categoryContent}>
        <View style={styles.iconContainer}>
          <IconComponent size={24} color={Colors.white} />
        </View>
        <Text style={styles.categoryName}>{isRTL && t(category.name) ? t(category.name) : category.name}</Text>
      </View>
    </Pressable>
  );
};

const VendorCard = ({ vendor }: { vendor: { name: string; count: number; image: string } }) => {
  const handleVendorPress = () => {
    router.push({
      pathname: '/vendor/[name]',
      params: { name: vendor.name },
    });
  };

  return (
    <Pressable 
      style={styles.vendorCard}
      onPress={handleVendorPress}
    >
      <View style={styles.vendorImageContainer}>
        <Image
          source={{ uri: vendor.image }}
          style={styles.vendorImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
      <Text style={styles.vendorName} numberOfLines={2}>{vendor.name}</Text>
      <Text style={styles.vendorCount}>{vendor.count} items</Text>
    </Pressable>
  );
};

export default function CategoriesScreen() {
  const { isRTL, t } = useLanguage();
  const { categories, isLoading, refetch } = useShopify();
  const vendors = useShopifyVendors();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <ShippingStrip />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {vendors.length > 0 && (
          <View style={styles.vendorsSection}>
            <Text style={[styles.vendorsTitle, isRTL && { textAlign: 'right' }]}>Shop by Brand</Text>
            <FlatList
              data={vendors}
              renderItem={({ item }) => <VendorCard vendor={item} />}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorsList}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('shopByCategory')}</Text>
          <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>{t('discoverFragrance')}</Text>

          {isLoading && categories.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading collections...</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (Dimensions.get('window').width - 40 - 24) / 3,
    aspectRatio: 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    textAlign: 'center' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  vendorsSection: {
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  vendorsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  vendorsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  vendorCard: {
    alignItems: 'center',
    width: 90,
  },
  vendorImageContainer: {
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
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  vendorName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 2,
    lineHeight: 14,
    width: '100%',
    height: 28,
  },
  vendorCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
});

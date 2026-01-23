import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { Theme } from '@/types/theme';
import { useBrands } from '@/app/hooks/useBrands';

interface ProductByBrandThemeProps {
  theme: Theme;
  locale: string;
}

const BRAND_SIZE = 100;

const ProductByBrandTheme: React.FC<ProductByBrandThemeProps> = ({
  theme,
  locale,
}) => {
  const translation = useMemo(() => {
    return (
      theme.translations?.find(t => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const title = translation?.options?.title || 'Shop By Brand';

  const { data: brands, isLoading } = useBrands();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!brands?.length) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Discover luxury brands</Text>
      </View>

      {/* Circular Brands Carousel */}
      <FlatList
        data={brands}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.option_id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.brandItem}
            onPress={() =>
              router.push({
                pathname: '/brand/[id]',
                params: {
                  id: item.value,
                  name: item.name,
                  brandId: item.option_id.toString(),
                },
              })
            }
          >
            <View style={styles.circle}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.brandImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>

            <Text style={styles.brandName} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    backgroundColor: Colors.background,
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  listContent: {
    paddingHorizontal: 16,
  },

  brandItem: {
    alignItems: 'center',
    marginRight: 20,
    width: BRAND_SIZE + 20,
  },

  circle: {
    width: BRAND_SIZE,
    height: BRAND_SIZE,
    borderRadius: BRAND_SIZE / 2,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  brandImage: {
    width: '60%',
    height: '60%',
  },

  placeholder: {
    width: '60%',
    height: '60%',
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
  },

  brandName: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },

  loading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});

export default ProductByBrandTheme;
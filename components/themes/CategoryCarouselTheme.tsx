// components/themes/CategoryCarouselTheme.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { Theme, ThemeFilter } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

interface CategoryCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
  slug?: string;
}

const CategoryCarouselTheme: React.FC<CategoryCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  const { data: allCategories } = useCategories();
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];

  useEffect(() => {
    if (!allCategories) return;

    let categories = [...allCategories];
    const filtersObj: Record<string, string> = {};
    
    filters.forEach((filter: ThemeFilter) => {
      filtersObj[filter.key] = filter.value;
    });

    // Apply parent_id filter if present
    if (filtersObj.parent_id) {
      categories = categories.filter(cat => {
        // You'll need to check your category structure for parent relationship
        return true; // Implement based on your data structure
      });
    }

    // Apply limit if present
    if (filtersObj.limit) {
      const limit = parseInt(filtersObj.limit, 10);
      categories = categories.slice(0, limit);
    }

    // Apply sort if present
    if (filtersObj.sort === 'asc') {
      categories.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filtersObj.sort === 'desc') {
      categories.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredCategories(categories);
  }, [allCategories, filters]);

  if (!filteredCategories.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.push('/categories')}>
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredCategories}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryCard}
            onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
          >
            <View style={styles.imageContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.categoryImage, { backgroundColor: Colors.cardBackground }]} />
              )}
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
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
  categoryCard: {
    alignItems: 'center',
    width: 100,
    marginRight: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});

export default CategoryCarouselTheme;
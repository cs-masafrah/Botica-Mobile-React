// components/themes/CategoryCarouselTheme.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCategories } from '../../app/hooks/useCategories';
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
  parentId?: string;
}

const CategoryCarouselTheme: React.FC<CategoryCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  const { data: allCategories } = useCategories();
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Extract static values ONCE on component mount
  const { title, filters, themeName } = useMemo(() => {
    const translation = theme.translations?.find(t => t.localeCode === locale) || 
                       theme.translations?.[0];
    return {
      title: translation?.options?.title || theme.name,
      filters: translation?.options?.filters || [],
      themeName: theme.name
    };
  }, [theme.translations, theme.name, locale]); // These should be stable

  // Filter categories - only run when allCategories changes
  useEffect(() => {
    if (!allCategories || allCategories.length === 0) {
      setFilteredCategories([]);
      return;
    }

    let result = [...allCategories];
    
    // Parse filters
    const filtersObj: Record<string, string> = {};
    filters.forEach((filter: ThemeFilter) => {
      filtersObj[filter.key] = filter.value;
    });

    // Apply parent_id filter
    if (filtersObj.parent_id && filtersObj.parent_id !== '1') {
      result = result.filter((cat: Category) => {
        return cat.parentId === filtersObj.parent_id;
      });
    }

    // Apply limit
    if (filtersObj.limit) {
      const limit = parseInt(filtersObj.limit, 10);
      result = result.slice(0, limit);
    }

    // Apply sort
    if (filtersObj.sort === 'asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filtersObj.sort === 'desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    // Use a simple comparison instead of JSON.stringify for better performance
    const shouldUpdate = filteredCategories.length !== result.length || 
                         filteredCategories.some((cat, idx) => cat.id !== result[idx]?.id);
    
    if (shouldUpdate) {
      setFilteredCategories(result);
    }
  }, [allCategories]); // Only depend on allCategories, not filters

  if (!filteredCategories.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
            {title}
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No categories to display
          </Text>
        </View>
      </View>
    );
  }

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
    backgroundColor: Colors.background,
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default CategoryCarouselTheme;
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

const CategoryCarouselTheme: React.FC<CategoryCarouselThemeProps> = ({
  theme,
  locale = 'en',
}) => {
  const { t, isRTL } = useLanguage();
  const { data: allCategories } = useCategories();
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Extract static values
  const { title, filters } = useMemo(() => {
    const translation =
      theme.translations?.find(t => t.localeCode === locale) ||
      theme.translations?.[0];

    return {
      title: translation?.options?.title || theme.name,
      filters: translation?.options?.filters || [],
    };
  }, [theme.translations, theme.name, locale]);

  // Filter categories
  useEffect(() => {
    if (!allCategories?.length) {
      setFilteredCategories([]);
      return;
    }

    let result = [...allCategories];

    const filtersObj: Record<string, string> = {};
    filters.forEach((filter: ThemeFilter) => {
      filtersObj[filter.key] = filter.value;
    });

    if (filtersObj.parent_id && filtersObj.parent_id !== '1') {
      result = result.filter(cat => cat.parentId === filtersObj.parent_id);
    }

    if (filtersObj.limit) {
      result = result.slice(0, parseInt(filtersObj.limit, 10));
    }

    if (filtersObj.sort === 'asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filtersObj.sort === 'desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredCategories(result);
  }, [allCategories]);

  if (!filteredCategories.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
        <Text style={styles.subtitle}>
          Discover your perfect fragrance
        </Text>
      </View>

      {/* Categories Carousel */}
      <FlatList
        data={filteredCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/category/[id]',
                params: { id: item.id },
              })
            }
          >
            {/* Background Image */}
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: Colors.cardBackground },
                ]}
              />
            )}

            {/* Dark Overlay */}
            <View style={styles.overlay} />

            {/* Centered Category Name */}
            <Text style={styles.cardText}>{item.name}</Text>
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
    marginBottom: 20,
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

  card: {
    width: 180,
    height: 180,
    marginRight: 16,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  cardText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    zIndex: 2,
  },
});

export default CategoryCarouselTheme;
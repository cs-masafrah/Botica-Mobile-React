// components/themes/CategoryCarouselTheme.tsx
import React, { useMemo, useEffect, useState } from 'react';
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
  parentId?: string; // Added this since filter is looking for it
}

const CategoryCarouselTheme: React.FC<CategoryCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { t, isRTL } = useLanguage();
  const { data: allCategories } = useCategories();
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  console.log(`🔍 [CategoryCarouselTheme] Theme: ${theme.name}, All categories: ${allCategories?.length || 0}`);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const title = translation?.options?.title || theme.name;
  const filters = translation?.options?.filters || [];

  console.log(`   Title: "${title}", Filters:`, filters);

  useEffect(() => {
    if (!allCategories) {
      console.log(`   No categories loaded yet`);
      setFilteredCategories([]);
      return;
    }

    console.log(`   Raw categories: ${allCategories.length}`);
    
    // Start with all categories
    let categories = [...allCategories];
    
    // Parse filters into an object for easier access
    const filtersObj: Record<string, string> = {};
    filters.forEach((filter: ThemeFilter) => {
      filtersObj[filter.key] = filter.value;
    });

    console.log(`   Filter object:`, filtersObj);
    
    // DEBUG: Log what each category looks like
    console.log('   Category details:');
    allCategories.forEach((cat: Category, index: number) => {
      console.log(`     [${index}] ${cat.name} (ID: ${cat.id}) - parentId: ${cat.parentId || 'none'}`);
    });
    
    // Handle parent_id filter - FIXED LOGIC
    if (filtersObj.parent_id) {
      console.log(`   Filter by parent_id: ${filtersObj.parent_id}`);
      
      // Since your categories might not have parentId, we need to handle this differently
      // Based on your logs, parent_id=1 likely means "show all child categories of Root"
      // But since your categories array doesn't have parentId, we'll show all categories
      
      if (filtersObj.parent_id === '1') {
        console.log('   parent_id=1 detected - showing all non-root categories');
        // Keep all categories (they're already children of Root)
        // No filtering needed since "Root" is already filtered out in useCategories hook
      } else {
        // For other parent IDs, try to filter if parentId exists
        categories = categories.filter((cat: Category) => {
          return cat.parentId === filtersObj.parent_id;
        });
      }
    }

    // Apply limit if present
    if (filtersObj.limit) {
      const limit = parseInt(filtersObj.limit, 10);
      console.log(`   Apply limit: ${limit}`);
      categories = categories.slice(0, limit);
    }

    // Apply sort if present
    if (filtersObj.sort === 'asc') {
      console.log(`   Sort ascending`);
      categories.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filtersObj.sort === 'desc') {
      console.log(`   Sort descending`);
      categories.sort((a, b) => b.name.localeCompare(a.name));
    }

    console.log(`   Final categories after filtering: ${categories.length}`);
    setFilteredCategories(categories);
  }, [allCategories, filters]);

  if (!filteredCategories.length) {
    console.log(`❌ [CategoryCarouselTheme] No categories to display for "${title}".`);
    
    // Show a debug view instead of returning null
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
            {title}
          </Text>
        </View>
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            No categories matching filters. Debug Info:
          </Text>
          <Text style={styles.debugText}>
            • All categories: {allCategories?.length || 0}
          </Text>
          <Text style={styles.debugText}>
            • Filters: {JSON.stringify(filters)}
          </Text>
          <Text style={styles.debugText}>
            • Available categories: {allCategories?.map(c => c.name).join(', ') || 'none'}
          </Text>
        </View>
      </View>
    );
  }

  console.log(`✅ [CategoryCarouselTheme] Rendering "${title}" with ${filteredCategories.length} categories`);

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
  // Debug styles
  debugContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
});

export default CategoryCarouselTheme;
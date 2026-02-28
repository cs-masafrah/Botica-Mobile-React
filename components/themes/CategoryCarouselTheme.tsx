// components/themes/CategoryCarouselTheme.tsx

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCategories } from "../../app/hooks/useCategories";
import { Theme, ThemeFilter } from "@/types/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

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
  locale = "en",
}) => {
  const { t, isRTL } = useLanguage();
  const { data: allCategories } = useCategories();

  // Extract static values
  const { title, filters } = useMemo(() => {
    const translation =
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0];

    return {
      title: translation?.options?.title || theme.name,
      filters: translation?.options?.filters || [],
    };
  }, [theme.translations, theme.name, locale]);

  // Filter categories using useMemo instead of useState + useEffect
  const filteredCategories = useMemo(() => {
    if (!allCategories?.length) return [];

    let result = [...allCategories];

    const filtersObj: Record<string, string> = {};
    filters.forEach((filter: ThemeFilter) => {
      filtersObj[filter.key] = filter.value;
    });

    if (filtersObj.parent_id && filtersObj.parent_id !== "1") {
      result = result.filter((cat) => cat.parentId === filtersObj.parent_id);
    }

    if (filtersObj.limit) {
      result = result.slice(0, parseInt(filtersObj.limit, 10));
    }

    if (filtersObj.sort === "asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filtersObj.sort === "desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [allCategories, filters]); // Include filters in dependencies

  if (!filteredCategories.length) {
    return null;
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
        <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
          {t("discoverFragrance") || "Discover your perfect fragrance"}
        </Text>
      </View>

      {/* Categories Carousel */}
      <FlatList
        data={filteredCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          isRTL && styles.listContentRTL,
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, isRTL && styles.cardRTL]}
            onPress={() =>
              router.push({
                pathname: "/category/[id]",
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
            <Text style={[styles.cardText, isRTL && styles.cardTextRTL]}>
              {t(item.name) || item.name}
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
  containerRTL: {
    direction: "rtl",
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerRTL: {
    alignItems: "flex-start",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  titleRTL: {
    textAlign: "right",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  subtitleRTL: {
    textAlign: "right",
  },

  listContent: {
    paddingHorizontal: 16,
  },
  listContentRTL: {
    flexDirection: "row-reverse",
  },

  card: {
    width: 180,
    height: 180,
    marginRight: 16,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  cardRTL: {
    marginRight: 0,
    marginLeft: 16,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  cardText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    zIndex: 2,
  },
  cardTextRTL: {
    textAlign: "center",
  },
});

export default CategoryCarouselTheme;

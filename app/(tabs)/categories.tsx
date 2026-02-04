'use client';

// app/(tabs)/categories.tsx - UPDATED WITH ProductByBrandTheme
import { router } from "expo-router";
import { Sparkles, User, Globe, Star, Gem } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useCategories } from "@/app/hooks/useCategories";
import ProductByBrandTheme from "@/components/themes/ProductByBrandTheme";

// Helper function to get icon component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "User":
      return User;
    case "Globe":
      return Globe;
    case "Star":
      return Star;
    case "Gem":
      return Gem;
    default:
      return Sparkles;
  }
};

// Responsive breakpoints and helpers
const getResponsiveValues = (width: number) => {
  const isSmallPhone = width < 360;
  const isMediumPhone = width >= 360 && width < 400;
  const isLargePhone = width >= 400;

  const horizontalPadding = isSmallPhone ? 16 : isMediumPhone ? 18 : 20;
  const gap = isSmallPhone ? 8 : 20;
  const cardWidth = (width - horizontalPadding * 2 - gap) / 2;

  return {
    horizontalPadding,
    gap,
    cardWidth,
    titleSize: isSmallPhone ? 20 : isMediumPhone ? 22 : 24,
    subtitleSize: isSmallPhone ? 12 : 14,
    categoryNameSize: isSmallPhone ? 14 : 16,
    iconContainerSize: isSmallPhone ? 44 : isMediumPhone ? 48 : 52,
    iconSize: isSmallPhone ? 20 : isMediumPhone ? 22 : 24,
    borderRadius: isSmallPhone ? 16 : 20,
  };
};

const CategoryCard = ({
  category,
  cardWidth,
  responsive,
}: {
  category: { id: string; name: string; icon: string; image: string };
  cardWidth: number;
  responsive: ReturnType<typeof getResponsiveValues>;
}) => {
  const { t, isRTL } = useLanguage();

  const IconComponent = getIconComponent(category.icon);

  const handleCategoryPress = () => {
    router.push({
      pathname: "/category/[id]",
      params: {
        id: category.id,
        name: category.name,
        image: category.image || "",
      },
    });
  };

  if (!category.image) {
    return null;
  }

  return (
    <Pressable
      style={[
        styles.categoryCard,
        {
          width: cardWidth,
          borderRadius: responsive.borderRadius,
        },
      ]}
      onPress={handleCategoryPress}
    >
      <Image
        source={{ uri: category.image }}
        style={styles.categoryImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.overlay} />
      <View style={styles.categoryContent}>
        <View
          style={[
            styles.iconContainer,
            {
              width: responsive.iconContainerSize,
              height: responsive.iconContainerSize,
              borderRadius: responsive.iconContainerSize / 2,
            },
          ]}
        >
          <IconComponent size={responsive.iconSize} color={Colors.white} />
        </View>
        <Text
          style={[
            styles.categoryName,
            { fontSize: responsive.categoryNameSize },
          ]}
        >
          {isRTL && t(category.name) ? t(category.name) : category.name}
        </Text>
      </View>
    </Pressable>
  );
};

export default function CategoriesScreen() {
  const { width } = useWindowDimensions();
  const responsive = getResponsiveValues(width);

  const { isRTL, t, locale } = useLanguage();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCategories();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchCategories]);

  // Filter categories that have images
  const categoriesWithImages = categories.filter((cat) => cat.image);

  // Define a theme object for the ProductByBrandTheme
  const brandTheme = {
    translations: [
      {
        localeCode: locale,
        options: {
          title: t("shopByBrand") || "Shop By Brand",
        },
      },
    ],
  };

  return (
    <View style={styles.container}>
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
        {/* ProductByBrandTheme Component - Replaces Vendor Section */}
        <ProductByBrandTheme theme={brandTheme} locale={locale} />

        {/* Categories Section */}
        <View
          style={[
            styles.section,
            { paddingHorizontal: responsive.horizontalPadding },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.title,
                { fontSize: responsive.titleSize },
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("shopByCategory") || "Shop by Category"}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: responsive.subtitleSize },
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("discoverFragrance") || "Discover your perfect fragrance"}
            </Text>
          </View>

          {categoriesLoading && categoriesWithImages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : categoriesWithImages.length > 0 ? (
            <View style={[styles.grid, { gap: responsive.gap }]}>
              {categoriesWithImages.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  cardWidth={responsive.cardWidth}
                  responsive={responsive}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories available</Text>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 19,
  },
  categoryCard: {
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative" as const,
    backgroundColor: Colors.textSecondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  categoryContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
    textAlign: "center" as const,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

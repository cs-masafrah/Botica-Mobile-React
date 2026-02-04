// app/(tabs)/categories.tsx - UPDATED WITH ProductByBrandTheme
import { router } from "expo-router";
import { Sparkles, User, Globe, Star, Gem } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

const CategoryCard = ({
  category,
}: {
  category: { id: string; name: string; icon: string; image: string };
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
    <Pressable style={styles.categoryCard} onPress={handleCategoryPress}>
      <Image
        source={{ uri: category.image }}
        style={styles.categoryImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.overlay} />
      <View style={styles.categoryContent}>
        <View style={styles.iconContainer}>
          <IconComponent size={24} color={Colors.white} />
        </View>
        <Text style={styles.categoryName}>
          {isRTL && t(category.name) ? t(category.name) : category.name}
        </Text>
      </View>
    </Pressable>
  );
};

export default function CategoriesScreen() {
  const { isRTL, t, currentLocale } = useLanguage();
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
        localeCode: currentLocale,
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
        <ProductByBrandTheme theme={brandTheme} locale={currentLocale} />

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={[styles.title, isRTL && { textAlign: "right" }]}>
            {t("shopByCategory") || "Shop by Category"}
          </Text>
          <Text style={[styles.subtitle, isRTL && { textAlign: "right" }]}>
            {t("discoverFragrance") || "Discover your perfect fragrance"}
          </Text>

          {categoriesLoading && categoriesWithImages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : categoriesWithImages.length > 0 ? (
            <View style={styles.grid}>
              {categoriesWithImages.map((category) => (
                <CategoryCard key={category.id} category={category} />
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: (Dimensions.get("window").width - 40 - 24) / 2,
    aspectRatio: 0.9,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative" as const,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  categoryContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center" as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

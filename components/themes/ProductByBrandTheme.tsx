import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { Theme } from "@/types/theme";
import { useBrands } from "@/app/hooks/useBrands";

interface ProductByBrandThemeProps {
  theme: Theme;
  locale: string;
}

const BRAND_SIZE = 100;
const MAX_WORDS_PER_LINE = 2; // Max words per line

const splitTwoLinesByWords = (text: string) => {
  if (!text) return { line1: "", line2: "" };

  const words = text.trim().split(/\s+/);

  if (words.length <= MAX_WORDS_PER_LINE) {
    return {
      line1: words.join(" "),
      line2: "",
    };
  }

  const line1Words = words.slice(0, MAX_WORDS_PER_LINE);
  const line2Words = words.slice(MAX_WORDS_PER_LINE, MAX_WORDS_PER_LINE * 2);
  const hasMore = words.length > MAX_WORDS_PER_LINE * 2;

  let line1 = line1Words.join(" ");
  let line2 = line2Words.join(" ");

  if (hasMore) {
    line2 = line2 + "...";
  }

  return { line1, line2 };
};

const ProductByBrandTheme: React.FC<ProductByBrandThemeProps> = ({
  theme,
  locale,
}) => {
  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const title = translation?.options?.title || "Shop By Brand";

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
        keyExtractor={(item) => item.option_id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          // Split the name by words
          const { line1, line2 } = splitTwoLinesByWords(item.name || "");
          return (
            <Pressable
              style={styles.brandItem}
              onPress={() =>
                router.push({
                  pathname: "/brand/[id]",
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

              {/* Brand name with word-based splitting */}
              <View style={styles.brandNameContainer}>
                <Text style={styles.brandNameLine}>{line1}</Text>
                {line2 ? (
                  <Text style={styles.brandNameLine}>{line2}</Text>
                ) : null}
              </View>

              <Text style={styles.brandCount}>{item.count} items</Text>
            </Pressable>
          );
        }}
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
    fontWeight: "700",
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
    alignItems: "center",
    marginRight: 0,
    width: BRAND_SIZE + 30,
  },

  /* ===== CIRCLE IMAGE ===== */
  circle: {
    width: BRAND_SIZE,
    height: BRAND_SIZE,
    borderRadius: BRAND_SIZE / 2,
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.7)",

    padding: 14,
    justifyContent: "center",
    alignItems: "center",

    elevation: 0,
    shadowColor: "transparent",
  },

  brandImage: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.cardBackground,
  },

  /* ===== BRAND NAME CONTAINER ===== */
  brandNameContainer: {
    marginTop: 12,
    height: 36, // Fixed height for 2 lines
    justifyContent: "center",
    alignItems: "center",
  },

  brandNameLine: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    lineHeight: 18,
  },

  /* ===== COUNT ===== */
  brandCount: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    height: 16, // keeps layout stable
  },

  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
});

export default ProductByBrandTheme;

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
import { useLanguage } from "@/contexts/LanguageContext";


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
  const { t, isRTL } = useLanguage();

  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const title =
    translation?.options?.title || t("shopByBrand") || "Shop By Brand";
  const subtitle = t("discoverLuxuryBrands") || "Discover luxury brands";

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
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
        <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
          {subtitle}
        </Text>
      </View>

      {/* Circular Brands Carousel */}
      <FlatList
        data={brands}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.option_id.toString()}
        contentContainerStyle={[
          styles.listContent,
          isRTL && styles.listContentRTL,
        ]}
        renderItem={({ item }) => {
          // Split the name by words
          const { line1, line2 } = splitTwoLinesByWords(item.name || "");
          return (
            <Pressable
              style={[styles.brandItem, isRTL && styles.brandItemRTL]}
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
              <View
                style={[
                  styles.brandNameContainer,
                  isRTL && styles.brandNameContainerRTL,
                ]}
              >
                <Text
                  style={[
                    styles.brandNameLine,
                    isRTL && styles.brandNameLineRTL,
                  ]}
                >
                  {line1}
                </Text>
                {line2 ? (
                  <Text
                    style={[
                      styles.brandNameLine,
                      isRTL && styles.brandNameLineRTL,
                    ]}
                  >
                    {line2}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.brandCount, isRTL && styles.brandCountRTL]}>
                {item.count} {t("items")}
              </Text>
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
  containerRTL: {
    direction: "rtl",
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
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

  brandItem: {
    alignItems: "center",
    marginRight: 0,
    width: BRAND_SIZE + 30,
  },

  brandItemRTL: {
    // Add any RTL specific styles if needed
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

  brandNameContainerRTL: {
    alignItems: "center",
  },

  brandNameLine: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    lineHeight: 18,
  },
  brandNameLineRTL: {
    textAlign: "center",
  },

  /* ===== COUNT ===== */
  brandCount: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    height: 16, // keeps layout stable
  },
  brandCountRTL: {
    textAlign: "center",
  },

  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
});

export default ProductByBrandTheme;

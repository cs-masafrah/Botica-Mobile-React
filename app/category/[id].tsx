// app/category/[id].tsx
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useBagistoProductsByCategory } from "../hooks/useBagistoProductsByCategory";
import ProductCard from "@/components/ProductCard";

// Helper functions to extract data from BagistoProduct
const getProductTags = (product: any): string[] => {
  const tagsData = product.additionalData?.find(
    (data: any) => data.label.toLowerCase() === "tags" || data.type === "tags",
  );
  if (tagsData?.value) {
    return tagsData.value.split(",").map((tag: string) => tag.trim());
  }
  return product.tags || [];
};

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { data, isLoading } = useBagistoProductsByCategory(id);
  const products = data?.allProducts?.data || [];

  const { t, isRTL } = useLanguage();
  const [selectedTag, setSelectedTag] = useState<string>("All");

  // Extract tags from Bagisto product data
  const allTags = useMemo(() => {
    if (!products || products.length === 0) return ["All"];
    const tags = new Set<string>();
    products.forEach((product: any) => {
      // Get tags using helper function
      const productTags = getProductTags(product);
      productTags.forEach((tag: string) => {
        if (tag) tags.add(tag);
      });
    });
    return ["All", ...Array.from(tags).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products || selectedTag === "All") return products;

    return products.filter((product: any) => {
      const productTags = getProductTags(product);
      return productTags.includes(selectedTag);
    });
  }, [products, selectedTag]);

  const { width: screenWidth } = Dimensions.get("window");
  const PADDING = 20;
  const GAP = 12;
  const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <Stack.Screen
        options={{
          title: name || t("category"),
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View
          style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t("loadingProducts")}
          </Text>
        </View>
      ) : (
        <View
          style={[styles.contentContainer, isRTL && styles.contentContainerRTL]}
        >
          {allTags.length > 1 && (
            <View
              style={[
                styles.filterContainer,
                isRTL && styles.filterContainerRTL,
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.tagsScroll,
                  isRTL && styles.tagsScrollRTL,
                ]}
              >
                {allTags.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTag === tag && styles.tagButtonActive,
                      isRTL && styles.tagButtonRTL,
                    ]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTag === tag && styles.tagTextActive,
                        isRTL && styles.tagTextRTL,
                      ]}
                    >
                      {tag === "All" ? t("all") : tag}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          <FlatList
            data={filteredProducts}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.productCardContainer,
                  { width: CARD_WIDTH },
                  isRTL && styles.productCardContainerRTL,
                ]}
              >
                <ProductCard product={item} variant="vertical" />
              </View>
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={[styles.row, isRTL && styles.rowRTL]}
            contentContainerStyle={[
              styles.listContent,
              isRTL && styles.listContentRTL,
            ]}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            key={selectedTag}
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyContainer,
                  isRTL && styles.emptyContainerRTL,
                ]}
              >
                <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
                  {t("noProductsInCategory")}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const { width: screenWidth } = Dimensions.get("window");
const PADDING = 20;
const GAP = 12;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainerRTL: {},
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "left",
  },
  listContent: {
    padding: PADDING,
    paddingTop: 8,
  },
  listContentRTL: {},
  row: {
    gap: GAP,
    marginBottom: GAP,
    justifyContent: "flex-start",
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  productCardContainer: {
    // Width is set dynamically
  },
  productCardContainerRTL: {},
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainerRTL: {},
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyTextRTL: {
    textAlign: "left",
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerRTL: {},
  filterContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "#E5E5E5",
  },
  filterContainerRTL: {},
  tagsScroll: {
    paddingHorizontal: PADDING,
    gap: 8,
  },
  tagsScrollRTL: {
    flexDirection: "row",
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border || "#E5E5E5",
  },
  tagButtonRTL: {},
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  tagTextRTL: {
    textAlign: "left",
  },
  tagTextActive: {
    color: Colors.white,
  },
});
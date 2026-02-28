import { router, useLocalSearchParams } from "expo-router";
import {
  Heart,
  Search,
  ShoppingBag,
  X,
  Plus,
  Check,
} from "lucide-react-native";
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/types/product";
import { formatPrice } from "@/utils/currency";
import { ShippingStrip } from "@/components/ShippingStrip";
import { useThemes } from "../hooks/useThemes";
import ThemeFactory from "@/components/themes/ThemeFactory";
import {
  useAllProducts,
  Product as BagistoProduct,
} from "../hooks/useAllProducts";
import { configService } from "@/services/ConfigService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { itemCount, addToCart, successMessage } = useCart();
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, isRTL, locale } = useLanguage();
  const {
    data: themes,
    isLoading: themesLoading,
    refetch: refetchThemes,
  } = useThemes();
  const { data: productsData } = useAllProducts([], {
    enabled: !themesLoading,
  });
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // State for logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  const products = productsData?.allProducts.data || [];

  useEffect(() => {
    if (successMessage) {
      Animated.sequence([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [successMessage, feedbackOpacity]);

  // Load logo from config
  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      setLoadingLogo(true);

      // First fetch configs
      await configService.fetchCoreConfigs();

      // Then get logo URL
      const logo = configService.getAdminLogoUrl();

      console.log("logo url:logo", logo);
      if (logo) {
        console.log("✅ Logo loaded:", logo);
        setLogoUrl(logo);
      } else {
        console.log("⚠️ No logo found in config, using fallback");
        setLogoUrl(
          "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h4vg1h5whdk3dy6ic3l29",
        );
      }
    } catch (error) {
      console.error("❌ Failed to load logo:", error);
      setLogoUrl(
        "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h4vg1h5whdk3dy6ic3l29",
      );
    } finally {
      setLoadingLogo(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchThemes()]);
    setRefreshing(false);
  }, [refetchThemes]);

  // Fixed filteredProducts with null checks
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter((product) => {
      // Safe check for product name
      const nameMatch = product.name
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
        : false;

      // Safe check for additionalData with null/undefined values
      const additionalDataMatch =
        product.additionalData?.some(
          (data) =>
            data.value &&
            data.value.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || false;

      return nameMatch || additionalDataMatch;
    });
  }, [searchQuery, products]);

  const handleAddToCart = useCallback(
    (product: BagistoProduct) => {
      const cartProduct: any = {
        id: product.id,
        name: product.name,
        description: product.shortDescription || product.description || "",
        price: product.priceHtml?.finalPrice || 0,
        compareAtPrice: product.priceHtml?.regularPrice || 0,
        currencyCode: "USD",
        image: product.images?.[0]?.url || "",
        images: product.images?.map((img) => img.url) || [],
        brand:
          product.additionalData?.find((data) => data.label === "Brand")
            ?.value || "",
        rating: product.averageRating || 0,
        reviewCount: product.reviews?.length || 0,
        inStock: product.isSaleable,
        category:
          product.additionalData?.find((data) => data.label === "Category")
            ?.value || "",
        options:
          product.configutableData?.attributes?.map((attr: any) => ({
            id: attr.id,
            name: attr.label,
            values: attr.options.map((opt: any) => opt.label),
          })) || [],
        variants: product.variants || [],
        variantId: product.variants?.[0]?.id,
        originalProduct: product,
      };

      addToCart(cartProduct, 1);
      setAddedProductId(product.id);
      setTimeout(() => setAddedProductId(null), 600);
    },
    [addToCart],
  );

  const renderProduct = useCallback(
    (item: BagistoProduct, isHorizontal = false) => {
      const inWishlist = isInWishlist(item.id);
      const hasDiscount =
        item.priceHtml?.regularPrice > item.priceHtml?.finalPrice;
      const discountPercentage = hasDiscount
        ? Math.round(
            ((item.priceHtml.regularPrice - item.priceHtml.finalPrice) /
              item.priceHtml.regularPrice) *
              100,
          )
        : 0;
      const isAdded = addedProductId === item.id;
      const imageUrl = item.images?.[0]?.url || "";
      const brand =
        item.additionalData?.find((data) => data.label === "Brand")?.value ||
        "";

      return (
        <Pressable
          style={[
            isHorizontal ? styles.horizontalProductCard : styles.productCard,
            isRTL && { direction: "rtl" },
          ]}
          onPress={() =>
            router.push({ pathname: "/product/[id]", params: { id: item.id } })
          }
        >
          <View
            style={
              isHorizontal
                ? styles.horizontalImageContainer
                : styles.imageContainer
            }
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.productImage,
                  { backgroundColor: Colors.cardBackground },
                ]}
              />
            )}

            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>
                  -{discountPercentage}%
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.favoriteButton,
                isRTL && { right: undefined, left: 8 },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleWishlist(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={18}
                color={inWishlist ? Colors.error : Colors.text}
                fill={inWishlist ? Colors.error : "transparent"}
              />
            </Pressable>

            <Pressable
              style={[
                styles.addToCartButton,
                isRTL && { right: undefined, left: 8 },
                isAdded && styles.addToCartButtonSuccess,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isAdded ? (
                <Check size={13} color={Colors.white} strokeWidth={3} />
              ) : (
                <Plus size={13} color={Colors.white} strokeWidth={3} />
              )}
            </Pressable>
          </View>

          <View
            style={[styles.productInfo, isRTL && { alignItems: "flex-end" }]}
          >
            {brand && (
              <Text style={styles.brandText} numberOfLines={1}>
                {brand}
              </Text>
            )}
            <Text
              style={[styles.productName, isRTL && { textAlign: "right" }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View
              style={[
                styles.ratingContainer,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <Text style={styles.ratingText}>
                ★ {item.averageRating || "0.0"}
              </Text>
              {item.reviews && item.reviews.length > 0 && (
                <Text style={styles.reviewText}>({item.reviews.length})</Text>
              )}
            </View>

            <View
              style={[
                styles.priceRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              {hasDiscount && (
                <Text style={styles.compareAtPriceText}>
                  {item.priceHtml?.formattedRegularPrice || ""}
                </Text>
              )}
              <Text style={styles.priceText}>
                {item.priceHtml?.formattedFinalPrice || "N/A"}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [isInWishlist, toggleWishlist, handleAddToCart, addedProductId, isRTL],
  );

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={[styles.headerTop, isRTL && styles.headerTopRTL]}>
        <View style={styles.logoContainer}>
          {loadingLogo ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              onError={() => {
                console.log("❌ Failed to load logo, using fallback");
                setLogoUrl(
                  "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h4vg1h5whdk3dy6ic3l29",
                );
              }}
            />
          ) : (
            <Image
              source={{
                uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h4vg1h5whdk3dy6ic3l29",
              }}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
            />
          )}
        </View>

        <View style={[styles.headerActions, isRTL && styles.headerActionsRTL]}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setIsSearchExpanded(!isSearchExpanded)}
          >
            <Search size={22} color={Colors.text} />
          </Pressable>
          <Pressable
            style={styles.bagButton}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <ShoppingBag size={22} color={Colors.text} />
            {itemCount > 0 && (
              <View style={[styles.badge, isRTL && styles.badgeRTL]}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {isSearchExpanded && (
        <View
          style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}
        >
          <Search
            size={20}
            color={Colors.textSecondary}
            style={[styles.searchIcon, isRTL && styles.searchIconRTL]}
          />
          <TextInput
            style={[styles.searchInput, isRTL && styles.searchInputRTL]}
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
            autoFocus
          />
          <Pressable
            style={[styles.clearButton, isRTL && styles.clearButtonRTL]}
            onPress={() => {
              setIsSearchExpanded(false);
              setSearchQuery("");
            }}
          >
            <X size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderThemes = () => {
    if (themesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("loading")}...</Text>
        </View>
      );
    }

    console.log("📊 Available themes:", themes?.length || 0);
    console.log(
      "📊 Theme details with sortOrder:",
      themes?.map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        sortOrder: t.sortOrder,
      })),
    );

    if (!themes || themes.length === 0) {
      return (
        <View style={styles.noThemesContainer}>
          <Text style={styles.noThemesText}>{t("noThemesConfigured")}</Text>
          <Text style={[styles.noThemesText, { fontSize: 14, marginTop: 10 }]}>
            {t("checkAdminPanel")}
          </Text>
        </View>
      );
    }

    // The themes are already sorted by sortOrder in the hook
    // Just map over them in the order they come
    return themes.map((theme) => {
      console.log(
        `🎨 Rendering theme (sortOrder: ${theme.sortOrder}): ${theme.id} - ${theme.type} - ${theme.name}`,
      );
      return <ThemeFactory key={theme.id} theme={theme} />;
    });
  };

  return (
    <View style={styles.container}>
      {successMessage && (
        <Animated.View
          style={[
            styles.feedbackContainer,
            { top: insets.top + 16, opacity: feedbackOpacity },
          ]}
        >
          <Text style={styles.feedbackText}>{t("addedToCart")}</Text>
        </Animated.View>
      )}

      <FlatList
        style={styles.content}
        showsVerticalScrollIndicator={false}
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <ShippingStrip />

            {/* Search Results */}
            {searchQuery ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {t("searchResults")} ({filteredProducts.length})
                  </Text>
                  <Pressable
                    onPress={() => setSearchQuery("")}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>
                      {t("clearFilter")}
                    </Text>
                  </Pressable>
                </View>
                <View
                  style={[styles.productsGrid, isRTL && { direction: "rtl" }]}
                >
                  {filteredProducts.map((product) => (
                    <View key={product.id} style={styles.gridItem}>
                      {renderProduct(product, false)}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* Dynamic Themes from API */
              renderThemes()
            )}
          </>
        }
        ListFooterComponent={<View style={styles.footerPadding} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 44,
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  bagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  clearButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    // backgroundColor: Colors.lightGray,
    fontWeight: "600",
    borderRadius: 12,
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "32%",
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalProductCard: {
    width: 130,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    backgroundColor: Colors.cardBackground,
  },
  horizontalImageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
    backgroundColor: Colors.cardBackground,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonSuccess: {
    backgroundColor: "#10B981",
  },
  productInfo: {
    padding: 8,
  },
  brandText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 14,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text,
  },
  reviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  compareAtPriceText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  noThemesContainer: {
    padding: 40,
    alignItems: "center",
  },
  noThemesText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  footerPadding: {
    height: 100,
  },
  feedbackContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
  },

  // RTL specific styles - added at the end
  headerTopRTL: {
    flexDirection: "row-reverse",
  },
  headerActionsRTL: {
    flexDirection: "row-reverse",
  },
  badgeRTL: {
    right: undefined,
    left: -4,
  },
  searchContainerRTL: {
    flexDirection: "row-reverse",
  },
  searchIconRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  searchInputRTL: {
    textAlign: "right",
  },
  clearButtonRTL: {
    // Add any RTL specific styles if needed
  },
});

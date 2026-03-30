import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions, Text, Animated } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Theme, ThemeImage } from "@/types/theme";
import Colors from "@/constants/colors";
import { router } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/app/hooks/useCategories";
import { useBrands } from "@/app/hooks/useBrands";
import { useProductBySku } from "@/app/hooks/useProductBySku";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 220;

interface ImageCarouselThemeProps {
  theme: Theme;
}

const ImageCarouselTheme: React.FC<ImageCarouselThemeProps> = ({
  theme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'sku' | 'category' | 'brand';
    value: string;
    imageIndex: number;
  } | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { isRTL, locale, t } = useLanguage();

  // Fetch data for navigation
  const { data: categoriesData } = useCategories(locale);
  const { data: brandsData } = useBrands({ locale });
  
  // Fetch product by SKU when needed
  const { data: productData } = useProductBySku(
    pendingNavigation?.type === 'sku' ? pendingNavigation.value : null
  );

  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const images = translation?.options?.images || [];

  // Subtle pulse animation for the button to draw the eye
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [scaleAnim]);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        // Animate out button, change slide, animate in
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        const nextIndex = (currentIndex + 1) % images.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 4500);

      return () => clearInterval(interval);
    }
  }, [currentIndex, images.length]);

  // Handle navigation after product is fetched
  useEffect(() => {
    if (pendingNavigation?.type === 'sku' && productData) {
      router.push(`/product/${productData.id}`);
      setPendingNavigation(null);
    }
  }, [productData, pendingNavigation]);

  // Helper function to find category by ID
  const findCategoryById = (categoryId: string) => {
    if (!categoriesData) return null;
    
    const searchCategory = (categories: any[]): any => {
      for (const category of categories) {
        if (category.id === categoryId) return category;
        if (category.children && category.children.length > 0) {
          const found = searchCategory(category.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchCategory(categoriesData);
  };

  // Helper function to find brand by name
  const findBrandByName = (brandName: string) => {
    if (!brandsData) return null;
    return brandsData.find((brand: any) => brand.name === brandName);
  };

  // Check if image has any valid navigation target
  const hasValidNavigation = (image: ThemeImage): boolean => {
    return !!(
      (image.sku && image.sku.trim() !== "") ||
      (image.category && image.category.trim() !== "") ||
      (image.brand && image.brand.trim() !== "")
    );
  };

  // Get button text based on navigation type
  const getButtonText = (image: ThemeImage): string => {
    if (image.sku && image.sku.trim() !== "") {
      return t("viewProduct") || "View Product";
    }
    if (image.category && image.category.trim() !== "") {
      return t("viewCategory") || "Shop Now";
    }
    if (image.brand && image.brand.trim() !== "") {
      return t("viewBrand") || "Explore Brand";
    }
    return t("viewCollections") || "View Collection";
  };

  // Main navigation function (used by both image and button)
  const navigateFromImage = async (image: ThemeImage, index: number) => {
    // Priority: SKU -> Category -> Brand
    if (image.sku && image.sku.trim() !== "") {
      setPendingNavigation({
        type: 'sku',
        value: image.sku,
        imageIndex: index
      });
      return;
    }

    if (image.category && image.category.trim() !== "") {
      const category = findCategoryById(image.category);
      if (category) {
        router.push({
          pathname: `/category/${category.id}` as any,
          params: { name: category.name }
        });
        return;
      }
    }

    if (image.brand && image.brand.trim() !== "") {
      const brand = findBrandByName(image.brand);
      if (brand) {
        router.push({
          pathname: `/brand/${encodeURIComponent(brand.name)}` as any,
          params: { brandName: brand.name }
        });
        return;
      }
    }

    // If no valid navigation target, fallback to image viewer
    router.push({
      pathname: "/image-viewer",
      params: {
        images: JSON.stringify(images.map((i) => i.imageUrl)),
        index,
      },
    });
  };

  if (!images.length) return null;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      >
        {images.map((image: ThemeImage, index: number) => {
          const showButton = hasValidNavigation(image);
          
          return (
            <Pressable
              key={index}
              style={styles.slide}
              onPress={() => navigateFromImage(image, index)}
            >
              <Image
                source={{ uri: image.imageUrl }}
                style={styles.image}
                contentFit="fill"
                cachePolicy="memory-disk"
              />
              
              {/* Gradient overlay for better button visibility */}
              {showButton && (
                <View style={styles.gradientOverlay} />
              )}
              
              {/* Floating Pill Button */}
              {showButton && (
                <Animated.View 
                  style={[
                    styles.overlay, 
                    { 
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.buttonContainer,
                      pressed && styles.buttonPressed
                    ]}
                    onPress={() => navigateFromImage(image, index)}
                  >
                    <Text style={[styles.buttonText, isRTL && styles.buttonTextRTL]}>
                      {getButtonText(image)}
                    </Text>
                    <View style={[styles.arrowContainer, isRTL && styles.arrowContainerRTL]}>
                      <Text style={styles.arrowIcon}>{isRTL ? '\u2190' : '\u2192'}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View style={[styles.pagination, isRTL && styles.paginationRTL]}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
                isRTL && styles.indicatorRTL,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    marginVertical: 0,
  },
  containerRTL: {
    direction: "rtl",
  },

  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  // Subtle gradient at bottom for button contrast
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
    // Simulated gradient with opacity
    borderTopWidth: 0,
  },

  overlay: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // Floating Pill Button Style
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 10,
    // Elevated shadow for floating effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  buttonPressed: {
    backgroundColor: "#F5F5F5",
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  buttonTextRTL: {
    textAlign: "right",
  },

  arrowContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowContainerRTL: {
    transform: [{ scaleX: -1 }],
  },

  arrowIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  pagination: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  paginationRTL: {
    flexDirection: "row-reverse",
  },

  indicator: {
    width: 8,
    height: 8,
    backgroundColor: Colors.textSecondary,
    opacity: 0.25,
    borderRadius: 4,
  },

  indicatorRTL: {
    marginHorizontal: 0,
  },

  indicatorActive: {
    backgroundColor: Colors.primary,
    opacity: 1,
    width: 24,
    height: 8,
    borderRadius: 4,
  },
});

export default ImageCarouselTheme;

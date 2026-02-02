import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Theme, ThemeImage } from "@/types/theme";
import Colors from "@/constants/colors";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 220;

interface ImageCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

const ImageCarouselTheme: React.FC<ImageCarouselThemeProps> = ({
  theme,
  locale = "en",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const images = translation?.options?.images || [];

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
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

  if (!images.length) return null;

  return (
    <View style={styles.container}>
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
        {images.map((image: ThemeImage, index: number) => (
          <Pressable
            key={index}
            style={styles.slide}
            onPress={() =>
              router.push({
                pathname: "/image-viewer",
                params: {
                  images: JSON.stringify(images.map((i) => i.imageUrl)),
                  index,
                },
              })
            }
          >
            <Image
              source={{ uri: image.imageUrl }}
              style={styles.image}
              contentFit="fill"
              cachePolicy="memory-disk"
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Pagination */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
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

  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  pagination: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  indicator: {
    width: 18,
    height: 3,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
    marginHorizontal: 4,
  },

  indicatorActive: {
    backgroundColor: Colors.primary,
    opacity: 1,
  },
});

export default ImageCarouselTheme;

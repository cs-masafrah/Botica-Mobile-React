// app/image-viewer.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type SearchParams = {
  images?: string;
  index?: string;
};

export default function ImageViewerScreen() {
  const { images: imagesParam, index: indexParam } =
    useLocalSearchParams<SearchParams>();
  const { t, isRTL } = useLanguage();

  const parsedImages = useMemo(() => {
    if (!imagesParam) return [] as string[];
    try {
      const list = JSON.parse(imagesParam);
      return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch (error) {
      console.warn("Failed to parse images param", error);
      return [] as string[];
    }
  }, [imagesParam]);

  const initialIndex = useMemo(() => {
    const parsedIndex = Number(indexParam);
    if (Number.isNaN(parsedIndex) || parsedIndex < 0) return 0;
    return Math.min(parsedImages.length - 1, parsedIndex);
  }, [indexParam, parsedImages.length]);

  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialIndex));
  const flatListRef = useRef<FlatList<string>>(null);

  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: item }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(nextIndex);
  };

  if (parsedImages.length === 0) {
    return (
      <SafeAreaView
        style={[styles.fallbackContainer, isRTL && styles.fallbackContainerRTL]}
      >
        <Text style={[styles.fallbackText, isRTL && styles.fallbackTextRTL]}>
          {t("noImagesToDisplay")}
        </Text>
        <Pressable
          style={[styles.closeButton, isRTL && styles.closeButtonRTL]}
          onPress={() => router.back()}
        >
          <Text
            style={[styles.closeButtonText, isRTL && styles.closeButtonTextRTL]}
          >
            {t("goBack")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.closeText, isRTL && styles.closeTextRTL]}>
            {t("close")}
          </Text>
        </Pressable>
        <Text style={[styles.counterText, isRTL && styles.counterTextRTL]}>
          {activeIndex + 1} / {parsedImages.length}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={flatListRef}
        data={parsedImages}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.max(0, initialIndex)}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRTL: {
    // flexDirection: 'row-reverse',
  },
  closeText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  closeTextRTL: {
    textAlign: "left",
  },
  counterText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  counterTextRTL: {
    textAlign: "left",
  },
  headerSpacer: {
    width: 52,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  fallbackContainerRTL: {
    direction: "rtl",
  },
  fallbackText: {
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  fallbackTextRTL: {
    textAlign: "left",
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonRTL: {},
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  closeButtonTextRTL: {
    textAlign: "left",
  },
});

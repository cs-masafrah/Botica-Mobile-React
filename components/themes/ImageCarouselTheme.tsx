// components/themes/ImageCarouselTheme.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Theme, ThemeImage } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselThemeProps {
  theme: Theme;
  locale?: string;
}

const ImageCarouselTheme: React.FC<ImageCarouselThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const images = translation?.options?.images || [];
  const title = translation?.options?.title || theme.name;

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
      ) : null}
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
      >
        {images.map((image: ThemeImage, index: number) => (
          <Pressable
            key={index}
            style={styles.imageContainer}
            onPress={() => {
              router.push({ 
                pathname: '/image-viewer', 
                params: { 
                  images: JSON.stringify(images.map(img => img.imageUrl)),
                  index 
                } 
              });
            }}
          >
            <Image
              source={{ uri: image.imageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Pressable>
        ))}
      </ScrollView>
      
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
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
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
    opacity: 1,
  },
});

export default ImageCarouselTheme;
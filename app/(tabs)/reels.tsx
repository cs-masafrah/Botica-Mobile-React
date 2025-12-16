import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Volume2, VolumeX, Play } from 'lucide-react-native';
import { useShopify } from '@/contexts/ShopifyContext';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const getProductRouteId = (productReference?: string): string | null => {
  if (!productReference) {
    return null;
  }
  const trimmed = productReference.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('gid://')) {
    const segments = trimmed.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment && lastSegment.length > 0 ? lastSegment : null;
  }
  return trimmed;
};

export default function ReelsScreen() {
  const { reels } = useShopify();
  const router = useRouter();
  const [playingStates, setPlayingStates] = useState<Record<string, boolean>>(() => {
    if (reels.length > 0) {
      console.log('Setting initial playing state for reel:', reels[0]);
      return { [reels[0].id]: true };
    }
    return {};
  });
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, Video | null>>({});
  const flatListRef = useRef<FlatList>(null);
  const [isTabFocused, setIsTabFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsTabFocused(true);
      return () => {
        setIsTabFocused(false);
        Object.values(videoRefs.current).forEach(video => {
          video?.pauseAsync();
        });
      };
    }, [])
  );



  const togglePlayPause = useCallback((reelId: string) => {
    setPlayingStates(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  }, []);

  const toggleMute = useCallback((reelId: string) => {
    setMutedStates(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      
      reels.forEach((reel, index) => {
        if (index === visibleIndex) {
          setPlayingStates(prev => ({ ...prev, [reel.id]: true }));
        } else {
          setPlayingStates(prev => ({ ...prev, [reel.id]: false }));
        }
      });
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const handleProductPress = useCallback((productRouteId: string | null) => {
    if (!productRouteId) {
      console.log('No product reference found for reel CTA');
      return;
    }
    router.push(`/product/${encodeURIComponent(productRouteId)}`);
  }, [router]);

  const renderReel = ({ item, index }: { item: typeof reels[0]; index: number }) => {
    const isPlaying = isTabFocused && (playingStates[item.id] ?? (index === 0));
    const isMuted = mutedStates[item.id] ?? false;
    const productRouteId = getProductRouteId(item.productId);
    
    console.log('🎬 Rendering reel:', { 
      id: item.id, 
      title: item.title, 
      productId: item,
      productRouteId,
      hasProductReference: !!item.productId,
      hasProductRouteId: !!productRouteId,
      willShowCTA: !!productRouteId
    });

    return (
      <View style={styles.reelContainer}>
        <TouchableOpacity 
          style={styles.videoTouchable}
          activeOpacity={1}
          onPress={() => togglePlayPause(item.id)}
        >
          {item.videoUrl ? (
            <Video
              ref={(ref: Video | null) => {
                videoRefs.current[item.id] = ref;
              }}
              source={{ uri: item.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isLooping
              isMuted={isMuted}
              volume={1.0}
              onError={(error: string) => {
                console.log('Video error:', error, 'URL:', item.videoUrl);
              }}
              onLoad={() => {
                console.log('Video loaded successfully:', item.videoUrl);
              }}
            />
          ) : (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.video}
              contentFit="cover"
            />
          )}
          {!isPlaying && (
            <View style={styles.pauseOverlay} pointerEvents="none">
              <View style={styles.playIconContainer}>
                <Play size={60} color={Colors.white} fill={Colors.white} />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topSection} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => toggleMute(item.id)}
            >
              {isMuted ? (
                <VolumeX size={24} color={Colors.white} />
              ) : (
                <Volume2 size={24} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID={`reel-cta-${item.id}`}
            style={[styles.ctaButton, !productRouteId && styles.ctaButtonDisabled]}
            onPress={() => {
              if (!productRouteId) {
                console.log('⚠️ No product reference - CTA disabled');
                return;
              }
              console.log('✅ CTA button pressed for product:', productRouteId);
              handleProductPress(productRouteId);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get product"
            disabled={!productRouteId}
          >
            <Text style={styles.ctaButtonText}>
              {/* {productRouteId ? 'Get Product' : 'No Product Linked'} */}
              {item ? 'Get Product' : 'No Product Linked'}

            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSection}>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reels available</Text>
        <Text style={styles.emptySubtext}>
          Add reels in your Shopify metaobjects to see them here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative' as const,
  },
  videoTouchable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.black,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  topSection: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    paddingTop: 60,
    paddingRight: 20,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ctaButton: {
    position: 'absolute' as const,
    bottom: 140,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  ctaButtonDisabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  bottomSection: {
    gap: 8,
    padding: 20,
  },
  textContainer: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});

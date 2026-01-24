import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Volume2, VolumeX, Play, Heart } from 'lucide-react-native';
import { useReels } from '../hooks/useReels';
import { useLikeReel, useViewReel } from '../hooks/useReelInteractions';
import { useAuth } from '@/contexts/AuthContext'; // Import your AuthContext
import LoginPrompt from '../../components/LoginPrompt'; // Import login prompt
import { Reel } from '../types/reels';
import Colors from '@/constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to check if URL is valid
const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function ReelsScreen() {
  const { data: reels = [], isLoading, error } = useReels();
  const router = useRouter();
  const { isAuthenticated } = useAuth(); // Get auth status
  
  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isCurrentVideoPlaying, setIsCurrentVideoPlaying] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Refs
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const flatListRef = useRef<FlatList>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks for interactions
  const { mutate: likeReel, isPending: isLiking } = useLikeReel();
  const { mutate: viewReel } = useViewReel();

  // Debug: Log current reel and URLs
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      const currentReel = reels[currentIndex];
      console.log('🎬 Current Reel Debug:', {
        title: currentReel.title,
        video_url: currentReel.video_url,
        video_valid: isValidUrl(currentReel.video_url),
        thumbnail_url: currentReel.thumbnail_url,
        thumbnail_valid: isValidUrl(currentReel.thumbnail_url),
        isPlaying: isCurrentVideoPlaying,
        is_liked: currentReel.is_liked,
        isAuthenticated,
      });
    }
  }, [reels, currentIndex, isCurrentVideoPlaying, isAuthenticated]);

  // Toggle play/pause for current video
  const togglePlayPause = useCallback(async () => {
    const currentReel = reels[currentIndex];
    if (!currentReel || !videoRefs.current[currentReel.id]) return;
    
    try {
      const video = videoRefs.current[currentReel.id];
      if (!video) return;
      
      const status = await video.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await video.pauseAsync();
          setIsCurrentVideoPlaying(false);
          console.log('⏸️ Video paused');
        } else {
          await video.playAsync();
          setIsCurrentVideoPlaying(true);
          console.log('▶️ Video playing');
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [reels, currentIndex]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    console.log(`🔇 Mute: ${!isMuted}`);
  }, [isMuted]);

  // Handle product press
  const handleProductPress = useCallback((product: Reel['product']) => {
    if (!product) {
      console.log('No product linked to this reel');
      return;
    }
    console.log(`🛒 Navigating to product: ${product.id} - ${product.name}`);
    router.push(`/product/${encodeURIComponent(product.id)}`);
  }, [router]);

  // Handle like button press with auth check
  const handleLikePress = useCallback((reel: Reel) => {
    if (isLiking) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    likeReel(reel.id);
  }, [isLiking, isAuthenticated, likeReel]);

  // Handle double tap for like with auth check
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      const currentReel = reels[currentIndex];
      if (currentReel) {
        // Check if user is authenticated
        if (!isAuthenticated) {
          setShowLoginPrompt(true);
          return;
        }
        
        handleLikePress(currentReel);
        console.log(`💖 Double tap like for reel: ${currentReel.id}`);
      }
    }
    
    setLastTap(now);
  }, [lastTap, currentIndex, reels, isAuthenticated, handleLikePress]);

  // Handle view tracking
  const trackView = useCallback((reelId: string) => {
    // Clear any existing timer
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
    }
    
    // Set new timer to track view after 2 seconds
    viewTimerRef.current = setTimeout(() => {
      viewReel(reelId);
      console.log(`👀 Tracked view for reel: ${reelId}`);
    }, 2000);
  }, [viewReel]);

  // When reel changes, track view
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      const currentReel = reels[currentIndex];
      trackView(currentReel.id);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [currentIndex, reels, trackView]);

  // Handle viewable items changed
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        console.log(`📱 Switching from reel ${currentIndex} to ${newIndex}`);
        
        // Pause current video
        const currentReel = reels[currentIndex];
        if (currentReel && videoRefs.current[currentReel.id]) {
          videoRefs.current[currentReel.id]?.pauseAsync();
        }
        
        // Update index and reset states
        setCurrentIndex(newIndex);
        setIsCurrentVideoPlaying(true); // Auto-play new video
        setVideoError(null);
        
        // Play new video after a short delay
        const newReel = reels[newIndex];
        if (newReel && videoRefs.current[newReel.id]) {
          setTimeout(() => {
            videoRefs.current[newReel.id]?.playAsync().catch(err => {
              console.error('Error playing new video:', err);
            });
          }, 50);
        }
        
        // Track view for new reel
        if (newReel) {
          trackView(newReel.id);
        }
      }
    }
  }, [reels, currentIndex, trackView]);

  // Configure viewability
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  };

  // Get current reel
  const currentReel = reels[currentIndex];

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading reels</Text>
        <Text style={styles.errorSubtext}>{error.message || 'Please try again later'}</Text>
      </View>
    );
  }

  // Render empty state
  if (!reels || reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reels available</Text>
        <Text style={styles.emptySubtext}>Check back later for new content</Text>
      </View>
    );
  }

  // Filter to only show reels with valid media
  const validReels = reels.filter(reel => 
    reel && 
    reel.is_active && 
    (isValidUrl(reel.video_url) || isValidUrl(reel.thumbnail_url))
  );

  if (validReels.length === 0 && reels.length > 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No playable reels</Text>
        <Text style={styles.emptySubtext}>
          All reels have invalid media URLs. Please check your server configuration.
        </Text>
        <View style={styles.urlDebugContainer}>
          <Text style={styles.urlDebugTitle}>Debug URLs:</Text>
          {reels.slice(0, 3).map((reel, index) => (
            <View key={reel.id} style={styles.urlDebugItem}>
              <Text style={styles.urlDebugText}>
                {index + 1}. {reel.title}: {reel.video_url || 'No video URL'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Render individual reel
  const renderReel = ({ item, index }: { item: Reel; index: number }) => {
    const isCurrent = index === currentIndex;
    const hasVideo = isValidUrl(item.video_url);
    const hasThumbnail = isValidUrl(item.thumbnail_url);
    
    return (
      <View style={styles.reelContainer}>
        {/* Touchable for video with double tap support */}
        <TouchableOpacity 
          style={styles.videoTouchable}
          activeOpacity={0.9}
          onPress={togglePlayPause}
          onLongPress={() => handleDoubleTap()}
          delayPressIn={0}
        >
          {/* Video for current reel */}
          {hasVideo ? (
            <Video
              ref={(ref) => {
                if (ref) {
                  videoRefs.current[item.id] = ref;
                  // Only auto-play if it's the current reel and should be playing
                  if (isCurrent && isCurrentVideoPlaying) {
                    setTimeout(() => {
                      ref.playAsync().catch(err => {
                        console.error('Failed to auto-play:', err);
                        setVideoError('Failed to play video');
                      });
                    }, 100);
                  }
                } else {
                  // Clean up ref when component unmounts
                  delete videoRefs.current[item.id];
                }
              }}
              source={{ uri: item.video_url! }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false} // We control playback manually
              isLooping
              isMuted={isMuted}
              volume={1.0}
              useNativeControls={false}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded) {
                  // Update playing state based on actual video status
                  if (isCurrent && status.isPlaying !== isCurrentVideoPlaying) {
                    setIsCurrentVideoPlaying(status.isPlaying);
                  }
                  
                  if (status) {
                    console.error(`❌ Playback error for ${item.id}:`, status);
                    setVideoError(`Video error: ${status}`);
                  }
                }
              }}
              onError={(error: any) => {
                console.error(`❌ Video error for ${item.id}:`, error);
                setVideoError(`Video error: ${error?.message || 'Unknown error'}`);
              }}
              onLoad={() => {
                console.log(`✅ Video loaded: ${item.title}`);
              }}
            />
          ) : hasThumbnail ? (
            <Image
              source={{ uri: item.thumbnail_url! }}
              style={styles.video}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.video, styles.noMediaContainer]}>
              <Text style={styles.noMediaText}>No media available</Text>
            </View>
          )}

          {/* Play/Pause overlay - Show when video is NOT playing */}
          {isCurrent && hasVideo && !isCurrentVideoPlaying && !videoError && (
            <View style={styles.pauseOverlay} pointerEvents="none">
              <View style={styles.playIconContainer}>
                <Play size={60} color={Colors.white} fill={Colors.white} />
              </View>
            </View>
          )}
          
          {/* Error overlay */}
          {isCurrent && videoError && (
            <View style={styles.errorOverlay} pointerEvents="none">
              <Text style={styles.errorOverlayText}>⚠️ Video Error</Text>
              <Text style={styles.errorOverlaySubtext}>{videoError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  if (videoRefs.current[item.id]) {
                    videoRefs.current[item.id]?.playAsync();
                    setIsCurrentVideoPlaying(true);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Overlay UI - only for current item */}
        {isCurrent && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Top section - Audio button and Like button */}
            <View style={styles.topSection} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.audioButton}
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                {isMuted ? (
                  <VolumeX size={24} color={Colors.white} />
                ) : (
                  <Volume2 size={24} color={Colors.white} />
                )}
              </TouchableOpacity>
              
              {/* Like button */}
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleLikePress(item)}
                disabled={isLiking}
                activeOpacity={0.7}
              >
            
                <Heart 
                  size={28} 
                  color={item.is_liked ? Colors.error : Colors.white}
                  fill={item.is_liked ? Colors.error : 'transparent'}
                />
                {!isAuthenticated && (
                  <View style={styles.authBadge}>
                    <Text style={styles.authBadgeText}>!</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* CTA Button */}
            {item.product && (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => handleProductPress(item.product)}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaButtonText}>Shop Now</Text>
              </TouchableOpacity>
            )}

            {/* Bottom section */}
            <View style={styles.bottomSection}>
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                
                {/* Product name */}
                {item.product?.name && (
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                )}

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <Text style={styles.statsText}>
                    {item.views_count?.toLocaleString() || 0} views
                  </Text>
                  <Text style={styles.statsText}>
                    {item.likes_count?.toLocaleString() || 0} likes
                    {item.is_liked && ' ❤️'}
                  </Text>
                  {item.duration && (
                    <Text style={styles.statsText}>
                      {Math.floor(item.duration / 60)}:
                      {(item.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
                
                {/* Auth status */}
                {!isAuthenticated && (
                  <View style={styles.authHint}>
                    <Text style={styles.authHintText}>
                      👆 Login to like reels
                    </Text>
                  </View>
                )}
                
                {/* Debug info */}
                {__DEV__ && (
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugText} numberOfLines={1}>
                      State: {isCurrentVideoPlaying ? 'Playing' : 'Paused'} | 
                      Mute: {isMuted ? 'On' : 'Off'} |
                      Liked: {item.is_liked ? 'Yes' : 'No'} |
                      Auth: {isAuthenticated ? 'Yes' : 'No'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={validReels.length > 0 ? validReels : reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        initialScrollIndex={0}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
          flatListRef.current?.scrollToIndex({
            index: Math.min(info.index, reels.length - 1),
            animated: true,
          });
        }}
        contentContainerStyle={styles.flatListContent}
      />
      
      {/* Login Prompt Modal */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Login to like reels and personalize your experience"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  flatListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  urlDebugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    width: '100%',
  },
  urlDebugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  urlDebugItem: {
    marginBottom: 6,
  },
  urlDebugText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black,
  },
  noMediaContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray,
  },
  noMediaText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    gap: 16,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  authBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ctaButton: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomSection: {
    gap: 12,
  },
  textContainer: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  statsText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authHint: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  authHintText: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorOverlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorOverlaySubtext: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
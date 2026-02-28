import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Volume2, VolumeX, Play, Heart } from "lucide-react-native";
import { useReels } from "../hooks/useReels";
import { useLikeReel, useViewReel } from "../hooks/useReelInteractions";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoginPrompt from "../../components/LoginPrompt";
import { Reel } from "../types/reels";
import Colors from "@/constants/colors";

// Get initial screen dimensions
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper function to check if URL is valid
const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== "string" || url.trim() === "") {
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
  const { isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();

  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isCurrentVideoPlaying, setIsCurrentVideoPlaying] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  const [videoAspectRatios, setVideoAspectRatios] = useState<{
    [key: string]: number;
  }>({});

  // Refs
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const flatListRef = useRef<FlatList>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks for interactions
  const { mutate: likeReel, isPending: isLiking } = useLikeReel();
  const { mutate: viewReel } = useViewReel();

  // Handle screen rotation and dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get("window");
      setDimensions({ width, height });
      console.log(`🔄 Screen changed: ${width}x${height}`);
    };

    // Initial update
    updateDimensions();

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // Calculate video dimensions based on its aspect ratio
  const getVideoDimensions = (videoId: string) => {
    const screenWidth = dimensions.width;
    const screenHeight = dimensions.height;
    const aspectRatio = videoAspectRatios[videoId] || 9 / 16; // Default to 9:16

    let videoWidth, videoHeight;

    if (aspectRatio > screenWidth / screenHeight) {
      // Video is wider than screen (landscape)
      videoWidth = screenWidth;
      videoHeight = screenWidth / aspectRatio;
    } else {
      // Video is taller than screen (portrait)
      videoHeight = screenHeight;
      videoWidth = screenHeight * aspectRatio;
    }

    // If video is smaller than screen in both dimensions, scale it up
    if (videoWidth < screenWidth && videoHeight < screenHeight) {
      if (screenWidth / videoWidth < screenHeight / videoHeight) {
        videoWidth = screenWidth;
        videoHeight = screenWidth / aspectRatio;
      } else {
        videoHeight = screenHeight;
        videoWidth = screenHeight * aspectRatio;
      }
    }

    const videoLeft = (screenWidth - videoWidth) / 2;
    const videoTop = (screenHeight - videoHeight) / 2;

    return {
      width: videoWidth,
      height: videoHeight,
      left: videoLeft,
      top: videoTop,
    };
  };

  // Handle video load to get aspect ratio
  const handleVideoLoad = (videoId: string, status: AVPlaybackStatus) => {
    if (status.isLoaded && status.videoWidth && status.videoHeight) {
      const aspectRatio = status.videoWidth / status.videoHeight;
      setVideoAspectRatios((prev) => ({
        ...prev,
        [videoId]: aspectRatio,
      }));
      console.log(
        `📐 Video ${videoId} aspect ratio: ${aspectRatio.toFixed(2)} (${status.videoWidth}x${status.videoHeight})`,
      );
    }
  };

  // Show login prompt on authentication error
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("LOGIN_REQUIRED") ||
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("Please login")
      ) {
        setShowLoginPrompt(true);
      }
    }
  }, [error]);

  // Debug: Log current reel
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      const currentReel = reels[currentIndex];
      console.log("🎬 Current Reel:", {
        title: currentReel.title,
        screenSize: `${dimensions.width}x${dimensions.height}`,
        aspectRatio: videoAspectRatios[currentReel.id],
      });
    }
  }, [reels, currentIndex, dimensions, videoAspectRatios]);

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
          console.log("⏸️ Video paused");
        } else {
          await video.playAsync();
          setIsCurrentVideoPlaying(true);
          console.log("▶️ Video playing");
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  }, [reels, currentIndex]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    console.log(`🔇 Mute: ${!isMuted}`);
  }, [isMuted]);

  // Handle product press
  const handleProductPress = useCallback(
    (product: Reel["product"]) => {
      if (!product) {
        console.log("No product linked to this reel");
        return;
      }
      console.log(`🛒 Navigating to product: ${product.id} - ${product.name}`);
      router.push(`/product/${encodeURIComponent(product.id)}`);
    },
    [router],
  );

  // Handle like button press
  const handleLikePress = useCallback(
    (reel: Reel) => {
      if (isLiking) return;

      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      likeReel(reel.id, {
        onError: (error: Error) => {
          if (error.message.includes("LOGIN_REQUIRED")) {
            setShowLoginPrompt(true);
          }
        },
      });
    },
    [isLiking, isAuthenticated, likeReel],
  );

  // Handle double tap for like
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      const currentReel = reels[currentIndex];
      if (currentReel) {
        if (!isAuthenticated) {
          setShowLoginPrompt(true);
          return;
        }

        likeReel(currentReel.id, {
          onError: (error: Error) => {
            if (error.message.includes("LOGIN_REQUIRED")) {
              setShowLoginPrompt(true);
            }
          },
        });

        console.log(`💖 Double tap like for reel: ${currentReel.id}`);
      }
    }

    setLastTap(now);
  }, [lastTap, currentIndex, reels, isAuthenticated, likeReel]);

  // Handle view tracking
  const trackView = useCallback(
    (reelId: string) => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }

      viewTimerRef.current = setTimeout(() => {
        viewReel(reelId);
        console.log(`👀 Tracked view for reel: ${reelId}`);
      }, 2000);
    },
    [viewReel],
  );

  // When reel changes, track view
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      const currentReel = reels[currentIndex];
      trackView(currentReel.id);
    }

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [currentIndex, reels, trackView]);

  // Handle viewable items changed
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
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
          setIsCurrentVideoPlaying(true);
          setVideoError(null);

          // Play new video after a short delay
          const newReel = reels[newIndex];
          if (newReel && videoRefs.current[newReel.id]) {
            setTimeout(() => {
              videoRefs.current[newReel.id]?.playAsync().catch((err) => {
                console.error("Error playing new video:", err);
              });
            }, 50);
          }

          // Track view for new reel
          if (newReel) {
            trackView(newReel.id);
          }
        }
      }
    },
    [reels, currentIndex, trackView],
  );

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
      <View
        style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
          {t("loadingReels")}
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    const errorMessage = error.message || "";
    if (
      errorMessage.includes("LOGIN_REQUIRED") ||
      errorMessage.includes("Authentication required") ||
      errorMessage.includes("Please login")
    ) {
      return (
        <View
          style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}
        >
          <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
            {t("loadingPersonalizedContent")}
          </Text>
          <Text style={[styles.emptySubtext, isRTL && styles.emptySubtextRTL]}>
            {t("pleaseWait")}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
        <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
          {t("errorLoadingReels")}
        </Text>
        <Text style={[styles.errorSubtext, isRTL && styles.errorSubtextRTL]}>
          {error.message || t("pleaseTryAgain")}
        </Text>
      </View>
    );
  }

  // Render empty state
  if (!reels || reels.length === 0) {
    return (
      <View style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}>
        <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
          {t("noReelsAvailable")}
        </Text>
        <Text style={[styles.emptySubtext, isRTL && styles.emptySubtextRTL]}>
          {t("checkBackLater")}
        </Text>
      </View>
    );
  }

  // Filter to only show reels with valid media
  const validReels = reels.filter(
    (reel) =>
      reel &&
      reel.is_active &&
      (isValidUrl(reel.video_url) || isValidUrl(reel.thumbnail_url)),
  );

  if (validReels.length === 0 && reels.length > 0) {
    return (
      <View style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}>
        <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
          {t("noPlayableReels")}
        </Text>
        <Text style={[styles.emptySubtext, isRTL && styles.emptySubtextRTL]}>
          {t("invalidMediaUrls")}
        </Text>
      </View>
    );
  }

  // Render individual reel
  const renderReel = ({ item, index }: { item: Reel; index: number }) => {
    const isCurrent = index === currentIndex;
    const hasVideo = isValidUrl(item.video_url);
    const hasThumbnail = isValidUrl(item.thumbnail_url);
    const isLiked = item.is_liked || false;
    const likesCount = item.likes_count || 0;

    const videoDims = getVideoDimensions(item.id);

    return (
      <View style={[styles.reelContainer, isRTL && styles.reelContainerRTL]}>
        {/* Touchable for video with double tap support */}
        <TouchableOpacity
          style={styles.videoTouchable}
          activeOpacity={0.9}
          onPress={togglePlayPause}
          onLongPress={() => handleDoubleTap()}
          delayPressIn={0}
        >
          {/* Video Container */}
          <View
            style={[
              styles.videoContainer,
              {
                width: videoDims.width,
                height: videoDims.height,
                left: videoDims.left,
                top: videoDims.top,
              },
            ]}
          >
            {hasVideo ? (
              <Video
                ref={(ref) => {
                  if (ref) {
                    videoRefs.current[item.id] = ref;
                    if (isCurrent && isCurrentVideoPlaying) {
                      setTimeout(() => {
                        ref.playAsync().catch((err) => {
                          console.error("Failed to auto-play:", err);
                          setVideoError(t("failedToPlayVideo"));
                        });
                      }, 100);
                    }
                  } else {
                    delete videoRefs.current[item.id];
                  }
                }}
                source={{ uri: item.video_url! }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping
                isMuted={isMuted}
                volume={1.0}
                useNativeControls={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) {
                    // Get video dimensions on load
                    handleVideoLoad(item.id, status);

                    if (
                      isCurrent &&
                      status.isPlaying !== isCurrentVideoPlaying
                    ) {
                      setIsCurrentVideoPlaying(status.isPlaying);
                    }

                    if (status.error) {
                      console.error(
                        `❌ Playback error for ${item.id}:`,
                        status.error,
                      );
                      setVideoError(`${t("videoError")}: ${status.error}`);
                    }
                  }
                }}
                onError={(error: any) => {
                  console.error(`❌ Video error for ${item.id}:`, error);
                  setVideoError(
                    `${t("videoError")}: ${error?.message || t("unknownError")}`,
                  );
                }}
                onLoad={() => {
                  console.log(`✅ Video loaded: ${item.title}`);
                }}
              />
            ) : hasThumbnail ? (
              <Image
                source={{ uri: item.thumbnail_url! }}
                style={styles.video}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <View style={[styles.video, styles.noMediaContainer]}>
                <Text
                  style={[styles.noMediaText, isRTL && styles.noMediaTextRTL]}
                >
                  {t("noMediaAvailable")}
                </Text>
              </View>
            )}
          </View>

          {/* Play/Pause overlay */}
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
              <Text
                style={[
                  styles.errorOverlayText,
                  isRTL && styles.errorOverlayTextRTL,
                ]}
              >
                ⚠️ {t("videoError")}
              </Text>
              <Text
                style={[
                  styles.errorOverlaySubtext,
                  isRTL && styles.errorOverlaySubtextRTL,
                ]}
              >
                {videoError}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (videoRefs.current[item.id]) {
                    videoRefs.current[item.id]?.playAsync();
                    setIsCurrentVideoPlaying(true);
                  }
                }}
              >
                <Text
                  style={[
                    styles.retryButtonText,
                    isRTL && styles.retryButtonTextRTL,
                  ]}
                >
                  {t("retry")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Overlay UI - only for current item */}
        {isCurrent && (
          <View
            style={[styles.overlay, isRTL && styles.overlayRTL]}
            pointerEvents="box-none"
          >
            {/* Top section */}
            <View
              style={[styles.topSection, isRTL && styles.topSectionRTL]}
              pointerEvents="box-none"
            >
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
                style={[styles.likeButton, isLiked && styles.likeButtonActive]}
                onPress={() => handleLikePress(item)}
                disabled={isLiking}
                activeOpacity={0.7}
              >
                <Heart
                  size={28}
                  color={isLiked ? Colors.error : Colors.white}
                  fill={isLiked ? Colors.error : "transparent"}
                />
                {!isAuthenticated && (
                  <View
                    style={[styles.authBadge, isRTL && styles.authBadgeRTL]}
                  >
                    <Text style={styles.authBadgeText}>!</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom section */}
            <View
              style={[styles.bottomSection, isRTL && styles.bottomSectionRTL]}
            >
              <View
                style={[styles.textContainer, isRTL && styles.textContainerRTL]}
              >
                <Text
                  style={[styles.title, isRTL && styles.titleRTL]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                {/* Product name */}
                {item.product?.name && (
                  <Text
                    style={[styles.productName, isRTL && styles.productNameRTL]}
                    numberOfLines={1}
                  >
                    {item.product.name}
                  </Text>
                )}

                {/* CTA Button */}
                {item.product && (
                  <TouchableOpacity
                    style={[styles.ctaButton, isRTL && styles.ctaButtonRTL]}
                    onPress={() => handleProductPress(item.product)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.ctaButtonText,
                        isRTL && styles.ctaButtonTextRTL,
                      ]}
                    >
                      {t("shopNow")}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Stats */}
                <View
                  style={[
                    styles.statsContainer,
                    isRTL && styles.statsContainerRTL,
                  ]}
                >
                  <Text
                    style={[styles.statsText, isRTL && styles.statsTextRTL]}
                  >
                    {item.views_count?.toLocaleString() || 0} {t("views")}
                  </Text>
                  <Text
                    style={[styles.statsText, isRTL && styles.statsTextRTL]}
                  >
                    {likesCount.toLocaleString()} {t("likes")}
                    {isLiked && " ❤️"}
                  </Text>
                  {item.duration && (
                    <Text
                      style={[styles.statsText, isRTL && styles.statsTextRTL]}
                    >
                      {Math.floor(item.duration / 60)}:
                      {(item.duration % 60).toString().padStart(2, "0")}
                    </Text>
                  )}
                </View>

                {/* Auth status */}
                {!isAuthenticated && (
                  <View style={[styles.authHint, isRTL && styles.authHintRTL]}>
                    <Text
                      style={[
                        styles.authHintText,
                        isRTL && styles.authHintTextRTL,
                      ]}
                    >
                      👆 {t("loginToLikeReels")}
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
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <FlatList
        ref={flatListRef}
        data={validReels.length > 0 ? validReels : reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={dimensions.height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: dimensions.height,
          offset: dimensions.height * index,
          index,
        })}
        initialScrollIndex={0}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        onScrollToIndexFailed={(info) => {
          console.warn("Scroll to index failed:", info);
          flatListRef.current?.scrollToIndex({
            index: Math.min(info.index, reels.length - 1),
            animated: true,
          });
        }}
        contentContainerStyle={[
          styles.flatListContent,
          isRTL && styles.flatListContentRTL,
        ]}
      />

      {/* Login Prompt Modal */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={t("loginToLikeReelsMessage")}
      />
    </View>
  );
}

// Add RTL styles at the end
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.black,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  videoTouchable: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoContainer: {
    position: "absolute",
    backgroundColor: Colors.black,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  noMediaContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray,
  },
  noMediaText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 60,
    gap: 16,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  likeButtonActive: {
    backgroundColor: "rgba(220, 38, 38, 0.3)",
  },
  authBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  authBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  ctaButton: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 2,
    borderRadius: 25,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
    textTransform: "uppercase",
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
    fontWeight: "700",
    color: Colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
    marginRight: 12,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  statsText: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authHint: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
  },
  authHintText: {
    fontSize: 12,
    color: "#FFC107",
    fontWeight: "600",
  },
  debugContainer: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "monospace",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
  },
  errorOverlayText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.error,
    marginBottom: 8,
    textAlign: "center",
  },
  errorOverlaySubtext: {
    fontSize: 14,
    color: Colors.white,
    textAlign: "center",
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
    fontWeight: "600",
    fontSize: 14,
  },

  // RTL specific styles - added at the end
  containerRTL: {
    direction: "rtl",
  },
  flatListContentRTL: {},
  loadingContainerRTL: {},
  loadingTextRTL: {
    textAlign: "right",
  },
  errorContainerRTL: {},
  errorTextRTL: {
    textAlign: "right",
  },
  errorSubtextRTL: {
    textAlign: "right",
  },
  emptyContainerRTL: {},
  emptyTextRTL: {
    textAlign: "right",
  },
  emptySubtextRTL: {
    textAlign: "right",
  },
  reelContainerRTL: {},
  overlayRTL: {},
  topSectionRTL: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  authBadgeRTL: {
    right: undefined,
    left: -4,
  },
  ctaButtonRTL: {
    alignSelf: "flex-end",
  },
  ctaButtonTextRTL: {
  },
  bottomSectionRTL: {},
  textContainerRTL: {
    alignItems: "flex-start",
  },
  titleRTL: {
    textAlign: "right",
  },
  productNameRTL: {
    marginRight: 0,
    marginLeft: 12,
    textAlign: "right",
  },
  statsContainerRTL: {
    flexDirection: "row",
  },
  statsTextRTL: {
    textAlign: "right",
  },
  authHintRTL: {},
  authHintTextRTL: {
    textAlign: "right",
  },
  noMediaTextRTL: {
    textAlign: "right",
  },
  errorOverlayTextRTL: {
    textAlign: "right",
  },
  errorOverlaySubtextRTL: {
    textAlign: "right",
  },
  retryButtonTextRTL: {
    textAlign: "right",
  },
});

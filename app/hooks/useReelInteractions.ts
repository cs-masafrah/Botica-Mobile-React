// app/hooks/useReelInteractions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Reel, ReelLikeResponse, ReelViewResponse } from "../types/reels";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

// GraphQL mutations
const LIKE_REEL = gql`
  mutation LikeReel($id: ID!) {
    likeReel(id: $id) {
      success
      message
      liked
      reel {
        id
        title
        likes_count
        views_count
        is_liked
      }
    }
  }
`;

const VIEW_REEL = gql`
  mutation ViewReel($id: ID!) {
    viewReel(id: $id) {
      success
      message
      views_count
      reel {
        id
        title
        views_count
        likes_count
      }
    }
  }
`;

// Alternative: If viewReel doesn't exist, check what mutations are available
const CHECK_MUTATIONS = gql`
  {
    __schema {
      mutationType {
        fields {
          name
          description
        }
      }
    }
  }
`;

// First, let's check what mutations are available
export const checkAvailableMutations = async (locale: string = "en") => {
  try {
    const headers: Record<string, string> = {
      "X-Locale": locale,
    };

    const data = await request(GRAPHQL_ENDPOINT, CHECK_MUTATIONS, {}, headers);
    console.log("📋 Available mutations:", data.__schema.mutationType.fields);
    return data.__schema.mutationType.fields;
  } catch (error) {
    console.error("❌ Error checking mutations:", error);
    return [];
  }
};

// app/hooks/useReelInteractions.ts - Updated useLikeReel

export const useLikeReel = () => {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuth();
  const { locale } = useLanguage();

  return useMutation({
    mutationFn: async (reelId: string): Promise<ReelLikeResponse> => {
      try {
        console.log(`❤️ Liking reel: ${reelId} with locale: ${locale}`);

        if (!isAuthenticated || !accessToken) {
          throw new Error("LOGIN_REQUIRED");
        }

        const variables = { id: reelId };
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Locale": locale,
          Authorization: `Bearer ${accessToken}`,
        };

        const data = await request<{ likeReel: ReelLikeResponse }>({
          url: GRAPHQL_ENDPOINT,
          document: LIKE_REEL,
          variables,
          requestHeaders: headers,
        });

        console.log("✅ Like response:", data.likeReel);

        if (!data?.likeReel) {
          throw new Error("Invalid response from server");
        }

        if (!data.likeReel.success) {
          if (
            data.likeReel.message?.includes("Authentication required") ||
            data.likeReel.message?.includes("Please login")
          ) {
            throw new Error("LOGIN_REQUIRED");
          }
          throw new Error(data.likeReel.message || "Failed to like reel");
        }

        return data.likeReel;
      } catch (error: any) {
        console.error("❌ Error liking reel:", error);
        throw error;
      }
    },
    onMutate: async (reelId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["reels"] });

      // Snapshot the previous value
      const previousReels = queryClient.getQueryData<Reel[]>(["reels"]);

      // Optimistically update the cache
      if (previousReels) {
        const updatedReels = previousReels.map((reel) => {
          if (reel.id === reelId) {
            const currentlyLiked = reel.is_liked || false;
            return {
              ...reel,
              is_liked: !currentlyLiked,
              likes_count: currentlyLiked
                ? Math.max(0, (reel.likes_count || 0) - 1)
                : (reel.likes_count || 0) + 1,
            };
          }
          return reel;
        });

        queryClient.setQueryData<Reel[]>(["reels"], updatedReels);
      }

      return { previousReels };
    },
    onError: (err: Error, reelId: string, context: any) => {
      console.error("Mutation error:", err.message || err);

      // Rollback on error
      if (context?.previousReels) {
        queryClient.setQueryData<Reel[]>(["reels"], context.previousReels);
      }
    },
    onSuccess: (data: ReelLikeResponse, reelId: string) => {
      // Update with server data immediately
      if (data.success && data.reel) {
        queryClient.setQueryData<Reel[]>(["reels"], (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          return oldData.map((reel) => {
            if (reel.id === reelId) {
              return {
                ...reel,
                // Use the server data directly
                is_liked: data.liked === true,
                likes_count: data.reel?.likes_count ?? reel.likes_count,
                views_count: data.reel?.views_count ?? reel.views_count,
              };
            }
            return reel;
          });
        });
      }
    },
    onSettled: () => {
      // DON'T invalidate immediately - this causes flashing
      // Instead, update the cache with the mutation response
      // and only refetch after a longer delay or not at all

      // Option 1: Don't refetch at all - trust the mutation response
      // Option 2: Refetch after a long delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["reels"] });
      }, 5000); // 5 seconds
    },
  });
};

// View a reel - With better error handling
export const useViewReel = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const { locale } = useLanguage(); // Get locale from language context

  return useMutation({
    mutationFn: async (reelId: string): Promise<ReelViewResponse> => {
      try {
        console.log(
          `👀 Tracking view for reel: ${reelId} with locale: ${locale}`,
        );

        const variables = { id: reelId };
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Locale": locale, // Add locale header
        };

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const data = await request<{ viewReel: ReelViewResponse }>({
          url: GRAPHQL_ENDPOINT,
          document: VIEW_REEL,
          variables,
          requestHeaders: headers,
        });

        console.log("✅ View response:", data.viewReel);

        if (!data?.viewReel) {
          throw new Error("Invalid response from server");
        }

        return data.viewReel;
      } catch (error: any) {
        console.error("❌ Error tracking view:", error);

        // Return a fallback response
        return {
          success: false,
          message: error.message || "Failed to track view",
          views_count: 0,
          reel: {} as Reel,
        };
      }
    },
    onSuccess: (data: ReelViewResponse, reelId: string) => {
      if (data.success && data.reel) {
        console.log(`✅ View tracked successfully for reel ${reelId}`);

        // Update reels cache with new views count
        queryClient.setQueryData<Reel[]>(["reels"], (oldData) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          return oldData.map((reel) => {
            if (reel.id === reelId && data.views_count !== undefined) {
              return {
                ...reel,
                views_count: data.views_count,
                likes_count: data.reel?.likes_count || reel.likes_count,
                is_liked: reel.is_liked,
              };
            }
            return reel;
          });
        });
      }
    },
  });
};

// Alternative: Simple view tracking that increments locally
export const useTrackView = () => {
  const queryClient = useQueryClient();
  const { locale } = useLanguage(); // Get locale from language context

  return useMutation({
    mutationFn: async (reelId: string) => {
      // Just increment locally without API call
      console.log(
        `👀 Incrementing view count for reel: ${reelId} with locale: ${locale}`,
      );
      return { success: true, reelId };
    },
    onMutate: async (reelId: string) => {
      // Optimistically update the view count
      queryClient.setQueryData<Reel[]>(["reels"], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        return oldData.map((reel) => {
          if (reel.id === reelId) {
            return {
              ...reel,
              views_count: (reel.views_count || 0) + 1,
            };
          }
          return reel;
        });
      });
    },
  });
};

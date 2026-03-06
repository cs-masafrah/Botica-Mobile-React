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
export const checkAvailableMutations = async () => {
  const { locale } = useLanguage(); // This won't work in regular function, need to handle differently
  try {
    const headers: Record<string, string> = {
      "X-Locale": locale, // Add locale header
    };

    const data = await request(GRAPHQL_ENDPOINT, CHECK_MUTATIONS, {}, headers);
    console.log("📋 Available mutations:", data.__schema.mutationType.fields);
    return data.__schema.mutationType.fields;
  } catch (error) {
    console.error("❌ Error checking mutations:", error);
    return [];
  }
};

// Like/Unlike a reel
export const useLikeReel = () => {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuth();
  const { locale } = useLanguage(); // Get locale from language context

  return useMutation({
    mutationFn: async (reelId: string): Promise<ReelLikeResponse> => {
      try {
        console.log(`❤️ Liking reel: ${reelId} with locale: ${locale}`);

        // Check authentication
        if (!isAuthenticated || !accessToken) {
          throw new Error("LOGIN_REQUIRED");
        }

        const variables = { id: reelId };
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Locale": locale, // Add locale header
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

        // Check if the mutation was successful
        if (!data.likeReel.success) {
          // If not successful and it's an auth error
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

        // Extract error message
        let errorMessage = "Failed to like reel";
        if (error.response?.errors?.[0]?.message) {
          errorMessage = error.response.errors[0].message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check if it's an auth error
        if (
          errorMessage.includes("Authentication required") ||
          errorMessage.includes("Please login") ||
          errorMessage.includes("LOGIN_REQUIRED") ||
          errorMessage.includes("Unauthorized")
        ) {
          throw new Error("LOGIN_REQUIRED");
        }

        throw new Error(errorMessage);
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
                ? reel.likes_count - 1
                : reel.likes_count + 1,
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

      // Rollback to previous state on error
      if (context?.previousReels) {
        queryClient.setQueryData<Reel[]>(["reels"], context.previousReels);
      }
    },
    onSettled: () => {
      // Refetch reels to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: ["reels"] });
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

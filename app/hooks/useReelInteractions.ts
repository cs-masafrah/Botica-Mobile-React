import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Reel, ReelLikeResponse, ReelViewResponse } from "../types/reels";
import { useAuth } from "@/contexts/AuthContext"; // Import your AuthContext

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

// Like/Unlike a reel
export const useLikeReel = () => {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (reelId: string): Promise<ReelLikeResponse> => {
      try {
        console.log(`❤️ Liking reel: ${reelId}`);

        const variables = { id: reelId };
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Add auth token if user is authenticated
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const data = await request<{ likeReel: ReelLikeResponse }>({
          url: GRAPHQL_ENDPOINT,
          document: LIKE_REEL,
          variables,
          requestHeaders: headers,
        });

        console.log("✅ Like response:", data);
        console.log("✅ Like response is liked:", data.likeReel.reel.is_liked);
        if (!data?.likeReel) {
          throw new Error("Invalid response from server");
        }

        return data.likeReel;
      } catch (error: any) {
        console.error("❌ Error liking reel:", error);

        // Check if it's an auth error
        if (
          error.message?.includes("Unauthenticated") ||
          error.message?.includes("Authentication") ||
          error.message?.includes("Unauthorized")
        ) {
          throw new Error("Please login to like reels");
        }

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
      console.error("Mutation error:", err);

      // Show alert for auth errors
      if (err.message.includes("Please login")) {
        // You can show a login prompt here
        console.log("⚠️ User needs to login to like reels");
      }

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

// View a reel
export const useViewReel = () => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (reelId: string): Promise<ReelViewResponse> => {
      try {
        console.log(`👀 Viewing reel: ${reelId}`);

        const variables = { id: reelId };
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Add auth token if user is authenticated
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const data = await request<{ viewReel: ReelViewResponse }>({
          url: GRAPHQL_ENDPOINT,
          document: VIEW_REEL,
          variables,
          requestHeaders: headers,
        });

        console.log("✅ View response:", data);

        if (!data?.viewReel) {
          throw new Error("Invalid response from server");
        }

        return data.viewReel;
      } catch (error: any) {
        console.error("❌ Error viewing reel:", error);
        // Don't throw for view errors - it shouldn't break UX
        return {
          success: false,
          message: error.message,
          views_count: 0,
          reel: {} as Reel,
        };
      }
    },
    onSuccess: (data: ReelViewResponse, reelId: string) => {
      // Update reels cache with new views count
      queryClient.setQueryData<Reel[]>(["reels"], (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        return oldData.map((reel) => {
          if (reel.id === reelId && data.views_count !== undefined) {
            return { ...reel, views_count: data.views_count };
          }
          return reel;
        });
      });
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Reel } from "../types/reels";
import { useAuth } from "@/contexts/AuthContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

// Define the public query (without is_liked)
const GET_REELS_PUBLIC = gql`
  query GetReels($page: Int, $first: Int) {
    reels(first: $first, page: $page) {
      data {
        id
        title
        video_url
        thumbnail_url
        is_active
        duration
        sort_order
        likes_count
        views_count
        caption
        product {
          id
          name
          sku
        }
      }
      paginatorInfo {
        currentPage
        lastPage
      }
    }
  }
`;

// Define the individual reel query (includes is_liked)
const GET_REEL = gql`
  query GetReel($id: ID!) {
    reel(id: $id) {
      id
      title
      video_url
      thumbnail_url
      views_count
      likes_count
      is_liked
      product {
        id
        name
        sku
      }
    }
  }
`;

const fetchReels = async (
  page = 1,
  first = 10,
  accessToken?: string | null,
): Promise<Reel[]> => {
  try {
    console.log("📡 Fetching reels from:", GRAPHQL_ENDPOINT);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Always use public query for initial fetch
    const data = await request<{ reels: { data: Reel[] } }>({
      url: GRAPHQL_ENDPOINT,
      document: GET_REELS_PUBLIC,
      variables: { page, first },
      requestHeaders: headers,
    });

    console.log("✅ Reels API response received");

    if (!data?.reels?.data) {
      console.error("❌ Invalid API response structure:", data);
      return getMockReels();
    }

    // Filter active reels and sort by sort_order
    const activeReels = data.reels.data
      .filter((reel) => reel.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    console.log(`📊 Loaded ${activeReels.length} active reels`);

    // If user is authenticated, fetch is_liked status for each reel
    if (accessToken) {
      console.log("🔐 User is authenticated, fetching like status...");
      try {
        const authHeaders = {
          ...headers,
          Authorization: `Bearer ${accessToken}`,
        };

        // Fetch like status for each reel
        const reelsWithLikes = await Promise.all(
          activeReels.map(async (reel) => {
            try {
              const reelData = await request<{ reel: Reel }>({
                url: GRAPHQL_ENDPOINT,
                document: GET_REEL,
                variables: { id: reel.id },
                requestHeaders: authHeaders,
              });

              if (reelData?.reel) {
                return {
                  ...reel,
                  is_liked: reelData.reel.is_liked || false,
                  likes_count: reelData.reel.likes_count || reel.likes_count,
                  views_count: reelData.reel.views_count || reel.views_count,
                };
              }
            } catch (error) {
              console.warn(`⚠️ Failed to fetch like status for reel ${reel.id}:`, error);
              // If fails, return reel without is_liked
              return {
                ...reel,
                is_liked: false,
              };
            }
            return {
              ...reel,
              is_liked: false,
            };
          })
        );

        return reelsWithLikes;
      } catch (error) {
        console.warn("⚠️ Failed to fetch like status, using public data:", error);
        // If fetching like status fails, return reels with is_liked = false
        return activeReels.map(reel => ({
          ...reel,
          is_liked: false,
        }));
      }
    }

    // For non-authenticated users, set is_liked = false
    return activeReels.map(reel => ({
      ...reel,
      is_liked: false,
    }));
  } catch (error: any) {
    console.error("❌ Error fetching reels:", error.message || error);
    
    // Try mock data if everything fails
    console.log("🔄 Falling back to mock data...");
    return getMockReels();
  }
};

// Mock data for testing
const getMockReels = (): Reel[] => {
  console.log("📱 Using mock reels data");
  return [
    {
      id: "1",
      title: "Summer Collection 2024",
      caption: "Check out our new summer collection!",
      video_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail_url:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
      is_active: true,
      duration: 30,
      sort_order: 1,
      likes_count: 1500,
      views_count: 25000,
      is_liked: false,
      product: {
        id: "101",
        name: "Summer Dress",
        sku: "SUMMER-001",
      },
    },
    {
      id: "2",
      title: "Winter Jackets Collection",
      caption: "Stay warm with our winter collection",
      video_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnail_url:
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
      is_active: true,
      duration: 25,
      sort_order: 2,
      likes_count: 890,
      views_count: 15000,
      is_liked: false,
      product: {
        id: "102",
        name: "Winter Jacket",
        sku: "WINTER-001",
      },
    },
  ];
};

export const useReels = (page = 1, first = 10) => {
  const { accessToken } = useAuth();

  return useQuery<Reel[], Error>({
    queryKey: ["reels", page, first, accessToken],
    queryFn: () => fetchReels(page, first, accessToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// New hook to fetch individual reel with like status
export const useReel = (reelId: string) => {
  const { accessToken } = useAuth();

  return useQuery<Reel, Error>({
    queryKey: ["reel", reelId, accessToken],
    queryFn: async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const data = await request<{ reel: Reel }>({
        url: GRAPHQL_ENDPOINT,
        document: GET_REEL,
        variables: { id: reelId },
        requestHeaders: headers,
      });

      if (!data?.reel) {
        throw new Error("Invalid response from server");
      }

      return data.reel;
    },
    enabled: !!reelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
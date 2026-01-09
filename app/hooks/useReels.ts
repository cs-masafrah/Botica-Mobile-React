import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Reel } from "../types/reels";
import { useAuth } from "@/contexts/AuthContext"; // Import your AuthContext

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_REELS = gql`
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
        is_liked # Add this field for like status
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

const fetchReels = async (
  page = 1,
  first = 10,
  accessToken?: string | null
): Promise<Reel[]> => {
  try {
    console.log("📡 Fetching reels from:", GRAPHQL_ENDPOINT);
    const variables = { page, first };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Add auth token if available
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const data = await request<{ reels: { data: Reel[] } }>({
      url: GRAPHQL_ENDPOINT,
      document: GET_REELS,
      variables,
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
    return activeReels;
  } catch (error: any) {
    console.error("❌ Error fetching reels:", error.message || error);

    // Try without auth headers if auth fails
    try {
      const variables = { page, first };
      const data = await request<{ reels: { data: Reel[] } }>(
        GRAPHQL_ENDPOINT,
        GET_REELS,
        variables
      );

      if (data?.reels?.data) {
        const activeReels = data.reels.data
          .filter((reel) => reel.is_active)
          .sort((a, b) => a.sort_order - b.sort_order);
        return activeReels;
      }
    } catch (noAuthError: any) {
      console.error("❌ Error fetching without auth:", noAuthError);
    }

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
    queryKey: ["reels", page, first, accessToken], // Include token in query key
    queryFn: () => fetchReels(page, first, accessToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Reel } from "../types/reels";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

// FIXED: Moved first and page inside the input parameter
const GET_REELS_PUBLIC = gql`
  query GetReels($page: Int, $first: Int, $locale: String) {
    reels(
      input: { page: $page, per_page: $first, locale: $locale, is_active: true }
    ) {
      data {
        id
        title
        caption
        video_url
        thumbnail_url
        is_active
        duration
        sort_order
        likes_count
        views_count
        is_liked
        product {
          id
          name
          sku
        }
      }
      paginatorInfo {
        total
        currentPage
        lastPage
        perPage
      }
    }
  }
`;

// Individual reel query
const GET_REEL = gql`
  query GetReel($id: ID!, $locale: String) {
    reel(id: $id, input: { locale: $locale }) {
      id
      title
      caption
      video_url
      thumbnail_url
      views_count
      likes_count
      is_liked
      duration
      sort_order
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
  locale: string = "en",
): Promise<Reel[]> => {
  try {
    console.log(
      `📡 Fetching reels from: ${GRAPHQL_ENDPOINT} with locale: ${locale}`,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Locale": locale,
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const data = await request<{ reels: { data: Reel[] } }>({
      url: GRAPHQL_ENDPOINT,
      document: GET_REELS_PUBLIC,
      variables: {
        page,
        first,
        locale,
      },
      requestHeaders: headers,
    });

    console.log(`✅ Reels API response received for locale: ${locale}`);

    if (!data?.reels?.data) {
      console.error("❌ Invalid API response structure:", data);
      return getMockReels(locale);
    }

    // Log the first reel's title to verify translation
    if (data.reels.data.length > 0) {
      console.log(
        `First reel title for locale ${locale}:`,
        data.reels.data[0].title,
      );
    }

    // Filter active reels and sort by sort_order
    const activeReels = data.reels.data
      .filter((reel) => reel.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return activeReels;
  } catch (error: any) {
    console.error("❌ Error fetching reels:", error.message || error);

    // Log the full error for debugging
    if (error.response) {
      console.error(
        "GraphQL Error Response:",
        JSON.stringify(error.response, null, 2),
      );
    }

    console.log(`🔄 Falling back to mock data for locale: ${locale}`);
    return getMockReels(locale);
  }
};

// Mock data with proper translations
const getMockReels = (locale: string = "en"): Reel[] => {
  console.log(`📱 Using mock reels data for locale: ${locale}`);

  const mockReels: Record<string, Reel[]> = {
    en: [
      {
        id: "11",
        title: "Test",
        caption: "Test caption",
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
        id: "16",
        title: "test 2",
        caption: "Test caption 2",
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
    ],
    ar: [
      {
        id: "11",
        title: "اختبار",
        caption: "وصف الاختبار",
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
          name: "فستان صيفي",
          sku: "SUMMER-001",
        },
      },
      {
        id: "16",
        title: "مجموعة السترات الشتوية",
        caption: "ابق دافئاً مع مجموعتنا الشتوية",
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
          name: "سترة شتوية",
          sku: "WINTER-001",
        },
      },
    ],
  };

  return mockReels[locale] || mockReels.en;
};

export const useReels = (page = 1, first = 10) => {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery<Reel[], Error>({
    queryKey: ["reels", page, first, locale, accessToken ? "auth" : "public"],
    queryFn: () => fetchReels(page, first, accessToken, locale),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Individual reel hook
export const useReel = (reelId: string) => {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery<Reel, Error>({
    queryKey: ["reel", reelId, locale, accessToken ? "auth" : "public"],
    queryFn: async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Locale": locale,
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      try {
        const data = await request<{ reel: Reel }>({
          url: GRAPHQL_ENDPOINT,
          document: GET_REEL,
          variables: {
            id: reelId,
            locale,
          },
          requestHeaders: headers,
        });

        if (!data?.reel) {
          throw new Error("Invalid response from server");
        }

        return data.reel;
      } catch (error) {
        console.error(`Error fetching reel ${reelId}:`, error);

        // Fallback to mock data
        const mockReels = getMockReels(locale);
        const mockReel = mockReels.find((r) => r.id === reelId);

        if (mockReel) {
          return mockReel;
        }

        throw error;
      }
    },
    enabled: !!reelId,
    staleTime: 2 * 60 * 1000,
  });
};

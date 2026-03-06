// app/hooks/useCategories.js
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_HOME_CATEGORIES = gql`
  query HomeCategories($filters: [FilterHomeCategoriesInput]) {
    homeCategories(input: $filters) {
      id
      name
      slug
      description
      logoUrl
      bannerUrl
      children {
        id
        name
        slug
        logoUrl
        bannerUrl
      }
    }
  }
`;

// Updated hook with locale support for X-Locale header
export const useCategories = (locale = "en") => {
  return useQuery({
    queryKey: ["categories", locale], // Add locale to queryKey for proper caching
    queryFn: async () => {
      try {
        console.log("=== FETCHING CATEGORIES ===");
        console.log("GraphQL Endpoint:", GRAPHQL_ENDPOINT);
        console.log("Requested locale:", locale);

        const filters = [{ key: "status", value: "1" }];

        // Add headers with X-Locale
        const headers = {
          "X-Locale": locale,
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        const data = await request(
          GRAPHQL_ENDPOINT,
          GET_HOME_CATEGORIES,
          { filters },
          headers, // Pass headers
        );

        console.log("Raw API response received");
        console.log("Number of categories:", data.homeCategories?.length || 0);

        // Log each category with details
        data.homeCategories?.forEach((cat, i) => {
          console.log(
            `\n[${i}] ${cat.name} (ID: ${cat.id}) - Locale: ${locale}`,
          );
          console.log(`  - Banner: ${cat.bannerUrl ? "YES" : "NO"}`);
          console.log(`  - Logo: ${cat.logoUrl ? "YES" : "NO"}`);
          console.log(`  - Children: ${cat.children?.length || 0}`);

          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((child, j) => {
              console.log(`    Child [${j}]: ${child.name} (ID: ${child.id})`);
              console.log(`      - Banner: ${child.bannerUrl ? "YES" : "NO"}`);
              console.log(`      - Logo: ${child.logoUrl ? "YES" : "NO"}`);
            });
          }
        });

        return data.homeCategories || [];
      } catch (error) {
        console.error("ERROR fetching categories:", error.message);
        return [];
      }
    },
    select: (data) => {
      // Simple deduplication - only show top-level categories with images
      const seenIds = new Set();
      const result = [];

      data.forEach((cat) => {
        // Skip "Root" (check in both English and Arabic)
        const catNameLower = cat.name.toLowerCase();
        if (catNameLower === "root" || catNameLower === "الجذر") return;

        // Skip if already seen
        if (seenIds.has(cat.id)) return;

        // Only include if has image
        if (cat.bannerUrl || cat.logoUrl) {
          seenIds.add(cat.id);
          result.push({
            id: cat.id,
            name: cat.name,
            image: cat.bannerUrl || cat.logoUrl || "",
            icon: getIconByCategoryName(cat.name, locale),
            slug: cat.slug,
          });
        }
      });

      return result;
    },
    // Add locale to dependencies to refetch when language changes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Updated helper function with Arabic category name support
const getIconByCategoryName = (categoryName, locale = "en") => {
  // Arabic category names mapping
  const arabicIconMap = {
    رجال: "User",
    نساء: "User",
    أطفال: "User",
    الكترونيات: "Globe",
    ملابس: "Sparkles",
    أحذية: "Star",
    إكسسوارات: "Gem",
    تجميل: "Sparkles",
    منزل: "Globe",
    رياضة: "Star",
    كتب: "Gem",
    طعام: "Sparkles",
    صحة: "Star",
    سيارات: "Globe",
    ألعاب: "Gem",
    مجوهرات: "Gem",
    ساعات: "Star",
    حقائب: "Sparkles",
    عطور: "Sparkles",
    مستلزمات: "User",
  };

  // English category names mapping
  const englishIconMap = {
    men: "User",
    women: "User",
    kids: "User",
    electronics: "Globe",
    clothing: "Sparkles",
    shoes: "Star",
    accessories: "Gem",
    beauty: "Sparkles",
    home: "Globe",
    sports: "Star",
    books: "Gem",
    food: "Sparkles",
    health: "Star",
    automotive: "Globe",
    toys: "Gem",
    jewelry: "Gem",
    watches: "Star",
    bags: "Sparkles",
    perfume: "Sparkles",
    supplies: "User",
  };

  const lowerName = categoryName.toLowerCase();

  // Choose the appropriate icon map based on locale
  const iconMap = locale === "ar" ? arabicIconMap : englishIconMap;

  // Try to find matching icon
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key.toLowerCase())) {
      return icon;
    }
  }

  // Default icons for categories without specific mapping
  const defaultIcons = ["Sparkles", "User", "Globe", "Star", "Gem"];
  return defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
};

// Optional: Create a separate hook for getting translated category names
export const useTranslatedCategories = (locale = "en") => {
  return useCategories(locale);
};

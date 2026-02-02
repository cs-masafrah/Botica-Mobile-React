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

// Debug version with maximum logging
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        console.log("=== FETCHING CATEGORIES ===");
        console.log("GraphQL Endpoint:", GRAPHQL_ENDPOINT);

        const filters = [{ key: "status", value: "1" }];
        const data = await request(GRAPHQL_ENDPOINT, GET_HOME_CATEGORIES, {
          filters,
        });

        console.log("Raw API response received");
        console.log("Number of categories:", data.homeCategories?.length || 0);

        // Log each category with details
        data.homeCategories?.forEach((cat, i) => {
          console.log(`\n[${i}] ${cat.name} (ID: ${cat.id})`);
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
        // Skip "Root"
        if (cat.name.toLowerCase() === "root") return;

        // Skip if already seen
        if (seenIds.has(cat.id)) return;

        // Only include if has image
        if (cat.bannerUrl || cat.logoUrl) {
          seenIds.add(cat.id);
          result.push({
            id: cat.id,
            name: cat.name,
            image: cat.bannerUrl || cat.logoUrl || "",
            icon: getIconByCategoryName(cat.name),
            slug: cat.slug,
          });
        }
      });

      return result;
    },
  });
};

// Helper function to assign icons based on category name
const getIconByCategoryName = (categoryName) => {
  const iconMap = {
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
  };

  const lowerName = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  const defaultIcons = ["Sparkles", "User", "Globe", "Star", "Gem"];
  return defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
};

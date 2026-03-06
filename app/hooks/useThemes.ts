// hooks/useThemes.ts - TEMPORARY FIX
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Theme, ThemeCustomizationResponse } from "@/types/theme";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_THEME_CUSTOMIZATION = gql`
  query themeCustomization {
    themeCustomization {
      id
      type
      name
      sortOrder
      translations {
        localeCode
        options {
          css
          html
          title
          links {
            url
            slug
            type
            id
          }
          services {
            title
            description
            serviceIcon
          }
          images {
            imageUrl
          }
          filters {
            key
            value
          }
          column_1 {
            url
            title
            sortOrder
          }
          column_2 {
            url
            title
            sortOrder
          }
          column_3 {
            url
            title
            sortOrder
          }
        }
      }
    }
  }
`;

export const useThemes = () => {
  const { locale } = useLanguage();

  return useQuery({
    // Keep locale in queryKey for proper caching when language changes
    queryKey: ["themeCustomization", locale],
    queryFn: async () => {
      try {
        console.log(
          `📡 Fetching theme customization from: ${GRAPHQL_ENDPOINT} (locale tracking: ${locale})`,
        );

        // TEMPORARY: Don't send X-Locale header until backend is fixed
        // const headers = { "X-Locale": locale };

        const headers = {
          "X-Locale": locale,
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // Send without locale header for now
        const data = await request<ThemeCustomizationResponse>(
          GRAPHQL_ENDPOINT,
          GET_THEME_CUSTOMIZATION,
          {}, // no headers
          headers,
        );

        console.log(
          `✅ Theme customization fetched: ${data.themeCustomization.length} themes`,
        );

        // Sort themes by sortOrder (smallest to largest)
        const sortedThemes = [...data.themeCustomization].sort((a, b) => {
          const aOrder =
            a.sortOrder !== null && a.sortOrder !== undefined
              ? Number(a.sortOrder)
              : Number.MAX_SAFE_INTEGER;
          const bOrder =
            b.sortOrder !== null && b.sortOrder !== undefined
              ? Number(b.order)
              : Number.MAX_SAFE_INTEGER;

          return aOrder - bOrder;
        });

        return sortedThemes;
      } catch (error: any) {
        console.error(
          `❌ Error fetching theme customization:`,
          error.message || error,
        );
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// hooks/useThemes.ts
import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';
import { BAGISTO_CONFIG } from '@/constants/bagisto';
import { Theme, ThemeCustomizationResponse } from '@/types/theme';

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_THEME_CUSTOMIZATION = gql`
  query themeCustomization {
    themeCustomization {
      id
      type
      name
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
  return useQuery({
    queryKey: ['themeCustomization'],
    queryFn: async () => {
      try {
        console.log('📡 Fetching theme customization...');
        
        const data = await request<ThemeCustomizationResponse>(
          GRAPHQL_ENDPOINT, 
          GET_THEME_CUSTOMIZATION
        );

        console.log(`✅ Theme customization fetched: ${data.themeCustomization.length} themes`);
        
        // Sort themes by ID (or we could use name) to maintain consistent order
        // In a real app, you might want to add sortOrder field in the API
        const sortedThemes = data.themeCustomization
          .map((theme, index) => ({
            ...theme,
            sortOrder: index, // Use index as temporary sort order
          }))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        return sortedThemes;
      } catch (error: any) {
        console.error('❌ Error fetching theme customization:', error.message || error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
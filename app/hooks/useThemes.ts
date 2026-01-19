// hooks/useThemes.ts - UPDATED VERSION
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
        console.log('📡 Fetching theme customization from:', GRAPHQL_ENDPOINT);
        
        const data = await request<ThemeCustomizationResponse>(
          GRAPHQL_ENDPOINT, 
          GET_THEME_CUSTOMIZATION
        );

        console.log(`✅ Theme customization fetched: ${data.themeCustomization.length} themes`);
        console.log('📊 Theme types:', data.themeCustomization.map(t => t.type));
        
        // Add sortOrder based on ID for now
        const sortedThemes = data.themeCustomization
          .map((theme, index) => ({
            ...theme,
            sortOrder: parseInt(theme.id) || index,
          }))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        return sortedThemes;
      } catch (error: any) {
        console.error('❌ Error fetching theme customization:', error.message || error);
        // Return empty array instead of throwing error
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
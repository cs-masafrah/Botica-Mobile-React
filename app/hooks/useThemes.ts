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
        
        // Log sortOrder values for debugging
        console.log('📊 Theme sortOrder values:', 
          data.themeCustomization.map(t => ({
            id: t.id,
            type: t.type,
            name: t.name,
            sortOrder: t.sortOrder
          }))
        );
        
        // Sort themes by sortOrder (smallest to largest)
        const sortedThemes = [...data.themeCustomization]
          .sort((a, b) => {
            const aOrder = a.sortOrder !== null && a.sortOrder !== undefined 
              ? Number(a.sortOrder) 
              : Number.MAX_SAFE_INTEGER;
            const bOrder = b.sortOrder !== null && b.sortOrder !== undefined 
              ? Number(b.sortOrder) 
              : Number.MAX_SAFE_INTEGER;
            
            return aOrder - bOrder;
          });

        console.log('📊 Sorted themes order:', sortedThemes.map(t => ({ 
          type: t.type, 
          sortOrder: t.sortOrder 
        })));

        return sortedThemes;
      } catch (error: any) {
        console.error('❌ Error fetching theme customization:', error.message || error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
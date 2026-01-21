import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';
import { BAGISTO_CONFIG } from '@/constants/bagisto';

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const SEARCH_PRODUCTS = gql`
  query searchProducts($search: String!, $page: Int, $limit: Int) {
    products(search: $search, page: $page, limit: $limit) {
      data {
        id
        name
        sku
        price
        specialPrice
        images {
          id
          url
          path
          type
          productId
        }
        inStock
        isSaleable
        categories {
          id
          name
        }
        additionalData {
          id
          code
          label
          value
          type
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

export const useBagistoSearch = (searchTerm: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bagistoSearch', searchTerm],
    queryFn: async () => {
      try {
        if (!searchTerm.trim()) {
          return {
            products: {
              data: [],
              paginatorInfo: {
                total: 0,
                currentPage: 1,
                lastPage: 1,
                perPage: 10,
              },
            },
          };
        }

        console.log('🔍 Searching products:', searchTerm);
        
        const data = await request<any>(
          GRAPHQL_ENDPOINT,
          SEARCH_PRODUCTS,
          { 
            search: searchTerm,
            limit: 20,
          }
        );

        console.log(`✅ Found ${data.products.data.length} search results`);
        return data;
      } catch (error: any) {
        console.error('❌ Error searching products:', error.message || error);
        return {
          products: {
            data: [],
            paginatorInfo: {
              total: 0,
              currentPage: 1,
              lastPage: 1,
              perPage: 10,
            },
          },
        };
      }
    },
    enabled: enabled && !!searchTerm.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};
// app/hooks/useProductsByBrand.ts - FIXED WITH NO INLINE COMMENTS
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { BagistoProduct } from "@/app/types/product";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_PRODUCTS_BY_BRAND = gql`
  query GetProductsByBrand($brandValue: String!, $page: Int, $perPage: Int) {
    productsByAttribute(
      input: {
        attribute: "brand"
        value: $brandValue
        page: $page
        perPage: $perPage
      }
    ) {
      paginatorInfo {
        total
        currentPage
        lastPage
      }
      data {
        id
        name
        sku
        type
        urlKey
        description
        shortDescription
        isSaleable
        isInWishlist
        isInSale
        averageRating
        percentageRating
        images {
          id
          type
          url
          productId
        }
        inventories {
          qty
        }
        categories {
          id
          name
          slug
        }
        reviews {
          id
          title
          rating
          comment
          createdAt
        }
        priceHtml {
          id
          type
          priceHtml
          regularPrice
          formattedRegularPrice
          finalPrice
          formattedFinalPrice
        }
        additionalData {
          id
          label
          value
          type
        }
        variants {
          id
          type
          sku
        }
        configutableData {
          attributes {
            id
            code
            label
            swatchType
            options {
              id
              label
              swatchType
              swatchValue
            }
          }
        }
      }
    }
  }
`;

interface ProductsByAttributeResponse {
  productsByAttribute: {
    paginatorInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
    };
    data: BagistoProduct[];
  };
}

export const useProductsByBrand = (brandValue: string | null, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ["productsByBrand", brandValue, page],
    queryFn: async () => {
      console.log('🔍 [useProductsByBrand] Fetching with:', {
        brandValue,
        page,
        perPage,
        type: typeof brandValue
      });
      
      if (!brandValue) {
        console.log('⚠️ [useProductsByBrand] No brandValue provided');
        return { data: [], paginatorInfo: null };
      }
      
      try {
        console.log('📡 [useProductsByBrand] Sending GraphQL request...');
        const data = await request<ProductsByAttributeResponse>(
          GRAPHQL_ENDPOINT, 
          GET_PRODUCTS_BY_BRAND, 
          {
            brandValue,
            page,
            perPage,
          }
        );
        
        console.log('✅ [useProductsByBrand] Response received:', {
          dataCount: data.productsByAttribute.data.length,
          totalProducts: data.productsByAttribute.paginatorInfo.total
        });
        
        return {
          data: data.productsByAttribute.data,
          paginatorInfo: data.productsByAttribute.paginatorInfo
        };
      } catch (error: any) {
        console.error('❌ [useProductsByBrand] Error:', {
          message: error.message,
          brandValue,
          response: error.response?.errors
        });
        throw error;
      }
    },
    enabled: !!brandValue,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};
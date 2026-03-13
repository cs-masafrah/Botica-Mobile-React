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
        type
        isInWishlist
        isInSale
        isSaleable
        name
        shareURL
        urlKey
        shortDescription
        description
        sku
        parentId
        
        # Add direct price fields (cart needs these)
        price
        specialPrice
        specialPriceFrom
        specialPriceTo
        weight
        
        variants {
          id
          type
          sku
          price
          specialPrice
        }
        
        images {
          id
          type
          url
          productId
          path
        }
        
        averageRating
        percentageRating
        
        reviews {
          id
          title
          rating
          comment
          status
          name
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
          code
        }
        
        # Add categories
        categories {
          id
          name
          slug
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
          index {
            id
            attributeOptionIds {
              attributeId
              attributeCode
              attributeOptionId
            }
          }
          variantPrices {
            id
            regularPrice {
              price
              formattedPrice
            }
            finalPrice {
              price
              formattedPrice
            }
          }
        }
        
        customizableOptions {
          id
          label
          productId
          type
          isRequired
          maxCharacters
          supportedFileExtensions
          sortOrder
          customizableOptionPrices {
            id
            isDefault
            isUserDefined
            label
            price
            productCustomizableOptionId
            qty
            sortOrder
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
  });
};
// hooks/useFilteredProducts.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Product } from "@/types/product";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

interface PriceHtml {
  id: string;
  type: string;
  regularPrice: number;
  formattedRegularPrice: string;
  finalPrice: number;
  formattedFinalPrice: string;
}

interface ProductImage {
  id: string;
  type: string;
  url: string;
  productId: string;
}

interface Review {
  id: string;
  title: string;
  rating: number;
}

interface AdditionalData {
  id: string;
  label: string;
  value: string;
  type: string;
}

interface BagistoProduct {
  id: string;
  type: string;
  isInWishlist: boolean;
  isInSale: boolean;
  isSaleable: boolean;
  name: string;
  shortDescription: string;
  description: string;
  images: ProductImage[];
  averageRating: number;
  reviews: Review[];
  priceHtml: PriceHtml;
  additionalData?: AdditionalData[];
}

const GET_FILTERED_PRODUCTS = gql`
  query allProducts($input: [FilterHomeCategoriesInput!]) {
    allProducts(input: $input) {
      paginatorInfo {
        count
        currentPage
        lastPage
        total
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
        variants {
          id
          type
          sku
        }
        images {
          id
          type
          url
          productId
        }
        averageRating
        percentageRating
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
        
        customizableOptions{
          id
          label
          productId
          type
          isRequired
          maxCharacters
          supportedFileExtensions
          sortOrder
          
          
          customizableOptionPrices{
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

const fetchFilteredProducts = async (
  filters: FilterHomeCategoriesInput[] = [],
  accessToken?: string | null,
  locale: string = 'en'
): Promise<BagistoProduct[]> => {
  try {
    console.log(`📡 Fetching filtered products with locale: ${locale} and filters:`, filters);
    
    const variables = { input: filters };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Locale": locale, // Add locale header
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const data = await request<{ allProducts: { data: BagistoProduct[] } }>({
      url: GRAPHQL_ENDPOINT,
      document: GET_FILTERED_PRODUCTS,
      variables,
      requestHeaders: headers,
    });

    console.log(`✅ Filtered products API response: ${data.allProducts.data.length} products`);
    return data.allProducts.data;
  } catch (error: any) {
    console.error("❌ Error fetching filtered products:", error.message || error);
    
    // Try without auth headers if auth fails, but keep locale
    try {
      const variables = { input: filters };
      const headers: Record<string, string> = {
        "X-Locale": locale, // Keep locale even in retry
      };
      
      const data = await request<{ allProducts: { data: BagistoProduct[] } }>({
        url: GRAPHQL_ENDPOINT,
        document: GET_FILTERED_PRODUCTS,
        variables,
        requestHeaders: headers,
      });
      return data.allProducts.data;
    } catch (noAuthError: any) {
      console.error("❌ Error fetching without auth:", noAuthError);
      return [];
    }
  }
};

export const useFilteredProducts = (filters: FilterHomeCategoriesInput[] = []) => {
  const { accessToken } = useAuth();
  const { locale } = useLanguage(); // Get locale from language context

  return useQuery<BagistoProduct[], Error>({
    queryKey: ["filteredProducts", filters, accessToken, locale], // Add locale to queryKey
    queryFn: () => fetchFilteredProducts(filters, accessToken, locale),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
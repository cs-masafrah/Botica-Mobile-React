// app/hooks/useBagistoProductFilters.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

export interface ProductFilterInput {
  attribute: string;
  value: string[];
  operator?: "eq" | "gt" | "lt" | "gte" | "lte" | "in" | "like";
}

export interface ProductsByAttributeEavInput {
  filters?: ProductFilterInput[];
  search?: string;
  categories?: string[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sortBy?: string;
  sortOrder?: string;
  perPage?: number;
  page?: number;
}

interface UseProductFiltersProps {
  filters?: ProductFilterInput[];
  search?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useBagistoProductFilters({
  filters,
  search,
  categories,
  minPrice,
  maxPrice,
  inStock,
  sortBy = "created_at",
  sortOrder = "desc",
  page = 1,
  perPage = 10,
  enabled = true,
}: UseProductFiltersProps) {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery({
    queryKey: [
      "productsByAttributeEav",
      filters,
      search,
      categories,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
      page,
      perPage,
      locale,
    ],
    queryFn: async () => {
      const input: ProductsByAttributeEavInput = {
        ...(filters && filters.length > 0 && { filters }),
        ...(search && { search }),
        ...(categories?.length && { categories }),
        ...(minPrice !== undefined && { min_price: minPrice }),
        ...(maxPrice !== undefined && { max_price: maxPrice }),
        ...(inStock !== undefined && { in_stock: inStock }),
        sortBy,
        sortOrder,
        perPage,
        page,
      };

  const query = gql`
    query GetProductsByAttribute($input: ProductsByAttributeEavInput!) {
      productsByAttributeEav(input: $input) {
        data {
          id
          sku
          type
          parentId
          attributeFamilyId
          productNumber
          name
          shortDescription
          description
          urlKey
          shareURL
          new
          featured
          status
          guestCheckout
          visibleIndividually
          metaTitle
          metaKeywords
          metaDescription
          price
          specialPrice
          specialPriceFrom
          specialPriceTo
          weight
          createdAt
          updatedAt

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
          }

          isInWishlist
          isInSale
          isSaleable

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

          # Add configutableData for variant products (needed for selectedConfigurableOption)
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

          # Add customizableOptions (needed for products with customizable options)
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

        paginatorInfo {
          total
          perPage
          currentPage
          lastPage
        }
      }
    }
`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Locale": locale,
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      try {
        console.log("🔍 Fetching products with filters:", input);
        const response = await request<{
          productsByAttributeEav: {
            data: any[];
            paginatorInfo: {
              total: number;
              perPage: number;
              currentPage: number;
              lastPage: number;
            };
          };
        }>(GRAPHQL_ENDPOINT, query, { input }, headers);

        return response.productsByAttributeEav;
      } catch (error) {
        console.error("Error fetching products by attribute:", error);
        if (error instanceof Object && "response" in error) {
          console.error("Error response:", (error as any).response);
        }
        throw error;
      }
    },
    enabled,
    retry: 1,
  });
}
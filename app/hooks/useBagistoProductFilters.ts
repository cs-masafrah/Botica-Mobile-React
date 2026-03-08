// app/hooks/useBagistoProductFilters.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

interface ProductsByAttributeEavInput {
  attribute: string;
  value: string;
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
  attribute: string;
  value: string;
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
  attribute,
  value,
  categories,
  minPrice,
  maxPrice,
  inStock,
  sortBy,
  sortOrder,
  page = 1,
  perPage = 10,
  enabled = true,
}: UseProductFiltersProps) {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery({
    queryKey: [
      "productsByAttributeEav",
      attribute,
      value,
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
      // For EAV, we need to use the correct field names that the GraphQL API expects
      // The API will handle the EAV complexity on the backend
      let apiSortBy = sortBy;
      
      // Don't transform the field names - let the API handle it
      // The API knows how to sort by price in EAV
      
      const input: ProductsByAttributeEavInput = {
        attribute,
        value,
        ...(categories?.length && { categories }),
        ...(minPrice !== undefined && { min_price: minPrice }),
        ...(maxPrice !== undefined && { max_price: maxPrice }),
        ...(inStock !== undefined && { in_stock: inStock }),
        ...(apiSortBy && { sortBy: apiSortBy }),
        ...(sortOrder && { sortOrder }),
        perPage,
        page,
      };

      // Log the input to see what we're sending
      console.log("🔍 Sending filter input:", input);

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
        // Log the full error for debugging
        if (error instanceof Object && "response" in error) {
          console.error("Error response:", (error as any).response);
        }
        throw error;
      }
    },
    enabled,
    retry: 1, // Only retry once to avoid infinite loops
  });
}
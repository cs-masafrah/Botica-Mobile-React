// app/hooks/useBagistoProductFilters.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

interface ProductsByAttributeInput {
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
      "productsByAttribute",
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
      // Convert sortBy to database column names
      let apiSortBy = sortBy;
      if (sortBy === 'createdAt') apiSortBy = 'created_at';
      if (sortBy === 'price') apiSortBy = 'price';
      if (sortBy === 'name') apiSortBy = 'name';

      const input: ProductsByAttributeInput = {
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

      const query = gql`
        query GetProductsByAttribute($input: ProductsByAttributeInput!) {
          productsByAttribute(input: $input) {
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
              variants { id }
              parent { id }
              isInWishlist
              isInSale
              isSaleable
              images {
                url
              }
              priceHtml {
                id
                type
                minPrice
                priceHtml
                currencyCode
                formattedFinalPrice
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
          productsByAttribute: {
            data: any[];
            paginatorInfo: {
              total: number;
              perPage: number;
              currentPage: number;
              lastPage: number;
            };
          };
        }>(GRAPHQL_ENDPOINT, query, { input }, headers);

        return response.productsByAttribute;
      } catch (error) {
        console.error("Error fetching products by attribute:", error);
        throw error;
      }
    },
    enabled,
  });
}
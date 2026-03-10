// app/hooks/useFilterAttributes.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

export interface FilterOption {
  id: string;
  adminName: string;
  swatchValue: string | null;
  sortOrder: number;
  isNew: boolean | null;
  isDelete: boolean | null;
  position: number | null;
  translations: Array<{
    id: string;
    locale: string;
    label: string;
  }>;
}

export interface FilterAttribute {
  id: string;
  code: string;
  adminName: string;
  type: string;
  position: number;
  defaultValue: string | null;
  isRequired: boolean;
  isUnique: boolean;
  validation: string | null;
  valuePerLocale: boolean;
  valuePerChannel: boolean;
  isFilterable: boolean;
  isConfigurable: boolean;
  isVisibleOnFront: boolean;
  isUserDefined: boolean;
  swatchType: string | null;
  isComparable: boolean;
  options: FilterOption[];
}

export interface SortOrder {
  key: string | null;
  title: string;
  value: string;
  sort: string;
  order: string;
  position: string;
}

export interface FilterAttributesResponse {
  getFilterAttribute: {
    id: string | null;
    minPrice: number;
    maxPrice: number;
    filterAttributes: FilterAttribute[];
    sortOrders: SortOrder[];
  };
}

const GET_FILTER_ATTRIBUTES = gql`
  query GetFilterAttribute($categorySlug: String!) {
    getFilterAttribute(categorySlug: $categorySlug) {
      id
      minPrice
      maxPrice
      filterAttributes {
        id
        code
        adminName
        type
        position
        defaultValue
        isRequired
        isUnique
        validation
        valuePerLocale
        valuePerChannel
        isFilterable
        isConfigurable
        isVisibleOnFront
        isUserDefined
        swatchType
        isComparable
        options {
          id
          adminName
          swatchValue
          sortOrder
          isNew
          isDelete
          position
          translations {
            id
            locale
            label
          }
        }
      }
      sortOrders {
        key
        title
        value
        sort
        order
        position
      }
    }
  }
`;

export const useFilterAttributes = (categorySlug: string = "all") => {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery<FilterAttributesResponse, Error>({
    queryKey: ["filterAttributes", categorySlug, locale],
    queryFn: async () => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Locale": locale,
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      try {
        const response = await request<FilterAttributesResponse>(
          GRAPHQL_ENDPOINT,
          GET_FILTER_ATTRIBUTES,
          { categorySlug },
          headers
        );
        return response;
      } catch (error) {
        console.error("Error fetching filter attributes:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
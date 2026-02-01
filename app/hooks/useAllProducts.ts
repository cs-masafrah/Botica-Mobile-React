import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { useAuth } from "@/contexts/AuthContext";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

export interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

export interface PaginatorInfo {
  count: number;
  currentPage: number;
  lastPage: number;
  total: number;
}

export interface PriceHtml {
  id: string;
  type: string;
  priceHtml: string;
  regularPrice: number;
  formattedRegularPrice: string;
  finalPrice: number;
  formattedFinalPrice: string;
}

export interface ProductImage {
  id: string;
  type: string;
  url: string;
  productId: string;
}

export interface Review {
  id: string;
  title: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Variant {
  id: string;
  type: string;
  sku: string;
}

export interface Product {
  id: string;
  type: string;
  isInWishlist: boolean;
  isInSale: boolean;
  isSaleable: boolean;
  name: string;
  shareURL: string;
  urlKey: string;
  shortDescription: string;
  description: string;
  sku: string;
  parentId: string | null;
  variants: Variant[];
  images: ProductImage[];
  averageRating: number;
  percentageRating: number;
  reviews: Review[];
  priceHtml: PriceHtml;
  price: number;
  additionalData?: Array<{
    id: string;
    label: string;
    value: string;
    type: string;
  }>;
  configutableData?: {
    attributes: Array<{
      id: string;
      code: string;
      label: string;
      swatchType: string;
      options: Array<{
        id: string;
        label: string;
        swatchType: string;
        swatchValue: string;
      }>;
    }>;
    index: Array<{
      id: string;
      attributeOptionIds: Array<{
        attributeId: string;
        attributeCode: string;
        attributeOptionId: string;
      }>;
    }>;
    variantPrices: Array<{
      id: string;
      regularPrice: { price: number; formattedPrice: string };
      finalPrice: { price: number; formattedPrice: string };
    }>;
  };
}

export interface AllProductsResponse {
  allProducts: {
    paginatorInfo: PaginatorInfo;
    data: Product[];
  };
}

const GET_ALL_PRODUCTS = gql`
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
      }
    }
  }
`;

const fetchAllProducts = async (
  filters: FilterHomeCategoriesInput[] = [],
  accessToken?: string | null
): Promise<AllProductsResponse> => {
  try {
    console.log("📡 Fetching products from:", GRAPHQL_ENDPOINT);
    
    const variables = { input: filters };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const data = await request<AllProductsResponse>({
      url: GRAPHQL_ENDPOINT,
      document: GET_ALL_PRODUCTS,
      variables,
      requestHeaders: headers,
    });

    console.log(`✅ Products API response received: ${data.allProducts.data.length} products`);
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching products:", error.message || error);
    
    // Try without auth headers if auth fails
    try {
      const variables = { input: filters };
      const data = await request<AllProductsResponse>(
        GRAPHQL_ENDPOINT,
        GET_ALL_PRODUCTS,
        variables
      );
      return data;
    } catch (noAuthError: any) {
      console.error("❌ Error fetching without auth:", noAuthError);
      throw noAuthError;
    }
  }
};

export const useAllProducts = (
  filters: FilterHomeCategoriesInput[] = [
    { key: "status", value: "1" },
  ],
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) => {
  const { accessToken } = useAuth();

  return useQuery<AllProductsResponse, Error>({
    queryKey: ["allProducts", filters, accessToken],
    queryFn: () => fetchAllProducts(filters, accessToken),
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes default
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
};
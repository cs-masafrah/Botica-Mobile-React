// app/hooks/useProductsByBrand.js
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

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
        images {
          url
        }
        inventories {
          qty
          inventorySourceId
          inventorySource {
            id
            name
          }
        }
        categories {
          id
          name
          slug
        }
        reviews {
          rating
          comment
          title
          status
        }
        ... on Product {
          attributeValues {
            id
            textValue
            booleanValue
            integerValue
            floatValue
            attribute {
              id
              code
              adminName
              type
            }
          }
        }
      }
    }
  }
`;

export const useProductsByBrand = (brandValue, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ["productsByBrand", brandValue, page],
    queryFn: async () => {
      try {
        const data = await request(GRAPHQL_ENDPOINT, GET_PRODUCTS_BY_BRAND, {
          brandValue,
          page,
          perPage,
        });
        return data;
      } catch (error) {
        console.error("Error fetching products by brand:", error);
        throw error;
      }
    },
    enabled: !!brandValue,
    // Add cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// app/hooks/useProductsByCategory.js
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($input: [FilterHomeCategoriesInput!]) {
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
        additionalData {
          id
          label
          value
          type
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
        sku
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
      }
    }
  }
`;

export const useProductsByCategory = (categoryId, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ["productsByCategory", categoryId, page],
    queryFn: async () => {
      if (!categoryId) {
        console.log("No category ID provided");
        return { allProducts: { data: [], paginatorInfo: { total: 0 } } };
      }

      try {
        console.log("Fetching products for category:", categoryId);

        const input = [
          { key: "category_id", value: categoryId },
          { key: "status", value: "1" },
          { key: "page", value: page.toString() },
          { key: "perPage", value: perPage.toString() },
        ];

        const data = await request(GRAPHQL_ENDPOINT, GET_PRODUCTS_BY_CATEGORY, {
          input,
        });

        console.log("Products data received for category", categoryId);
        return data;
      } catch (error) {
        console.error("Error fetching products by category:", error.message);
        return { allProducts: { data: [], paginatorInfo: { total: 0 } } };
      }
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

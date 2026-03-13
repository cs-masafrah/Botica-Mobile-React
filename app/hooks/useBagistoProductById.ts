import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_PRODUCT_BY_ID = gql`
  query GetProductById($input: [FilterHomeCategoriesInput!]) {
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
        sku
        name
        description
        shortDescription
        isSaleable

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

        averageRating
        percentageRating

        reviews {
          id
          title
          rating
          comment
          createdAt
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
            label
            price
            qty
            sortOrder
          }
        }
      }
    }
  }
`;

interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

export const useBagistoProductById = (id?: string) => {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["bagistoProduct", id, locale],

    queryFn: async () => {
      if (!id) return null;

      const input: FilterHomeCategoriesInput[] = [
        { key: "id", value: id },
        { key: "status", value: "1" },
      ];

      const data = await request<any>(
        GRAPHQL_ENDPOINT,
        GET_PRODUCT_BY_ID,
        { input },
        { "X-Locale": locale }
      );

      if (!data?.allProducts?.data?.length) return null;

      return data.allProducts.data[0];
    },

    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
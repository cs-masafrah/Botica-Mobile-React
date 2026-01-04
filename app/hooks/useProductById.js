// app/hooks/useProductById.js
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

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
        isInWishlist
        isInSale
        isSaleable
        name
        shareURL
        urlKey
        shortDescription
        description
        customizableOptions {
          id
          label
          productId
          type
          isRequired
          maxCharacters
          supportedFileExtensions
          product {
            id
          }
          translations {
            id
            label
          }
          customizableOptionPrices {
            id
            label
            price
          }
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
        sku
        parentId
        variants {
          id
          type
          sku
        }
        attributeFamily {
          id
        }
        superAttributes {
          id
          code
          adminName
          type
          position
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
        groupedProducts {
          id
          qty
          associatedProductId
          associatedProduct {
            id
            name
            type
            sku
            priceHtml {
              id
              type
              priceHtml
              regularPrice
              formattedRegularPrice
              finalPrice
              formattedFinalPrice
            }
          }
        }
        relatedProducts {
          id
          name
          sku
          urlKey
          isSaleable
          priceHtml {
            finalPrice
            formattedFinalPrice
            regularPrice
            formattedRegularPrice
          }
          images {
            id
            url
          }
        }
        downloadableSamples {
          id
          fileName
          translations {
            id
            title
          }
        }
        downloadableLinks {
          id
          title
          price
          url
          file
          fileName
          type
          sampleUrl
          sampleFile
          sampleFileUrl
          sampleFileName
          sampleType
          sortOrder
          productId
          downloads
          translations {
            id
            title
          }
        }
        bundleOptions {
          id
          type
          isRequired
          sortOrder
          productId
          bundleOptionProducts {
            id
            qty
            isUserDefined
            sortOrder
            isDefault
            productBundleOptionId
            productId
            product {
              sku
              name
              id
              priceHtml {
                id
                type
                priceHtml
                regularPrice
                formattedRegularPrice
                finalPrice
                formattedFinalPrice
              }
            }
          }
          translations {
            id
            locale
            label
            productBundleOptionId
          }
        }
        booking {
          id
          type
          qty
          location
          showLocation
          availableEveryWeek
          availableFrom
          availableTo
          productId
          product {
            id
          }
          defaultSlot {
            id
            bookingType
            duration
            breakTime
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          appointmentSlot {
            id
            duration
            breakTime
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          eventTickets {
            id
            price
            qty
            name
            description
            specialPrice
            specialPriceFrom
            specialPriceTo
            translations {
              locale
              name
              description
            }
          }
          rentalSlot {
            id
            rentingType
            dailyPrice
            hourlyPrice
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
          tableSlot {
            id
            priceType
            guestLimit
            duration
            breakTime
            preventSchedulingBefore
            sameSlotAllDays
            slotManyDays {
              to
              from
            }
            slotOneDay {
              id
              to
              from
            }
          }
        }
      }
    }
  }
`;

export const useProductById = (productId) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      if (!productId) {
        console.log("No product ID provided");
        return null;
      }

      try {
        console.log("Fetching product by ID:", productId);

        const input = [
          { key: "id", value: productId },
          { key: "status", value: "1" },
        ];

        const data = await request(GRAPHQL_ENDPOINT, GET_PRODUCT_BY_ID, {
          input,
        });

        console.log("Product data received:", data);

        // Return the first product from the array
        return data?.allProducts?.data?.[0] || null;
      } catch (error) {
        console.error("Error fetching product by ID:", error);
        return null;
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

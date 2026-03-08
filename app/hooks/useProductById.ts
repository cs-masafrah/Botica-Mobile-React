// hooks/useProductById.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Product } from "../types/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID) {
    product(id: $id) {
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

      images {
        id
        url
      }

      cacheBaseImage {
        smallImageUrl
        mediumImageUrl
        largeImageUrl
        originalImageUrl
      }

      cacheGalleryImages {
        smallImageUrl
        mediumImageUrl
        largeImageUrl
        originalImageUrl
      }

      videos {
        id
        type
        path
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

      attributeFamily {
        id
      }

      attributeValues {
        id
        attributeId
        textValue
        integerValue
        floatValue
        booleanValue
        dateValue
        channel
        locale
      }

      superAttributes {
        id
        code
        adminName
        type
        position
      }

      variants {
        id
        type
        sku
        name
        images {
          id
          url
        }
        priceHtml {
          finalPrice
          formattedFinalPrice
          regularPrice
          formattedRegularPrice
        }
      }

      relatedProducts {
        id
        name
        sku
        urlKey
        isSaleable
        images {
          id
          url
        }
        priceHtml {
          finalPrice
          formattedFinalPrice
          regularPrice
          formattedRegularPrice
        }
      }

      upSells {
        id
        name
        sku
        urlKey
      }

      crossSells {
        id
        name
        sku
        urlKey
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
            id
            sku
            name
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
`;

export const useProductById = (productId?: string) => {
  return useQuery<Product | null>({
    queryKey: ["product", productId],

    queryFn: async () => {
      if (!productId) {
        console.log("No product ID provided");
        return null;
      }

      try {
        console.log("Fetching product by ID:", productId);

        const data = await request<{ product: Product }>(
          GRAPHQL_ENDPOINT,
          GET_PRODUCT_BY_ID,
          { id: productId }
        );

        console.log("Product data received:", data);

        return data?.product || null;
      } catch (error: any) {
        console.error("Error fetching product by ID:", error);
        return null;
      }
    },

    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};
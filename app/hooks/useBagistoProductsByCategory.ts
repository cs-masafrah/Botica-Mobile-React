import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_PRODUCTS_BY_CATEGORY = gql`
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
        
        # Add direct price fields (cart needs these)
        price
        specialPrice
        specialPriceFrom
        specialPriceTo
        weight
        
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
          path
        }
        
        averageRating
        percentageRating
        
        reviews {
          id
          title
          rating
          comment
          status
          name
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
          code
        }
        
        # Add categories
        categories {
          id
          name
          slug
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
    }
  }
`;

interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

interface ProductCategory {
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
  price?: string;
  specialPrice?: string;
  specialPriceFrom?: string;
  specialPriceTo?: string;
  weight?: string;
  
  // Add variants array
  variants?: Array<{
    id: string;
    type: string;
    sku: string;
    price?: string;
    specialPrice?: string;
    selectedOptions?: Array<{
      attributeId: string;
      attributeCode: string;
      attributeOptionId: string;
    }>;
  }>;
  
  images: Array<{
    id: string;
    type: string;
    url: string;
    productId: string;
    path?: string;
  }>;
  
  averageRating: number;
  percentageRating: number;
  
  reviews: Array<{
    id: string;
    title: string;
    rating: number;
    comment: string;
    status?: string;
    name?: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  
  priceHtml: {
    id: string;
    type: string;
    priceHtml: string;
    regularPrice: number;
    formattedRegularPrice: string;
    finalPrice: number;
    formattedFinalPrice: string;
  };
  
  additionalData: Array<{
    id: string;
    label: string;
    value: string;
    type: string;
    code?: string;
  }>;
  
  // Add categories array
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  
  // Add configutableData
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
      regularPrice: {
        price: number;
        formattedPrice: string;
      };
      finalPrice: {
        price: number;
        formattedPrice: string;
      };
    }>;
  };
  
  // Add customizableOptions
  customizableOptions?: Array<{
    id: number;
    label: string;
    productId: string;
    type: string;
    isRequired: boolean;
    maxCharacters: number | null;
    supportedFileExtensions: string[] | null;
    sortOrder: number;
    customizableOptionPrices: Array<{
      id: number;
      isDefault: boolean | null;
      isUserDefined: boolean | null;
      label: string;
      price: number;
      productCustomizableOptionId: string;
      qty: number | null;
      sortOrder: number;
    }>;
  }>;
}

interface ProductsByCategoryResponse {
  allProducts: {
    data: ProductCategory[];
    paginatorInfo: {
      count: number;
      currentPage: number;
      lastPage: number;
      total: number;
    };
  };
}

const transformProductList = (bagistoProduct: ProductCategory): any => {
  const price = parseFloat(bagistoProduct.specialPrice || bagistoProduct.price || '0');
  const comparePrice = parseFloat(bagistoProduct.price || '0');
  
  const images = bagistoProduct.images.map((img) => img.url);
  const mainImage = images[0] || '';
  
  // Get brand from additional data
  const brand = bagistoProduct.additionalData.find(
    (data) => data.label === 'Brand' || data.code === 'brand'
  )?.value || '';
  
  // Get approved reviews
  const reviews = bagistoProduct.reviews
    .filter((review) => review.status === 'approved')
    .map((review) => ({
      id: review.id,
      title: review.title,
      rating: review.rating,
      comment: review.comment,
      name: review.name,
      createdAt: review.createdAt,
    }));
  
  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  // Get category
  const category = bagistoProduct.categories?.[0]?.name || 'Uncategorized';
  
  return {
    id: bagistoProduct.id,
    productId: bagistoProduct.id, // CRITICAL: Add alias for cart
    name: bagistoProduct.name,
    sku: bagistoProduct.sku,
    type: bagistoProduct.type,
    // Add direct price fields (CRITICAL for cart)
    price: price,
    comparePrice: comparePrice,
    // Add variant info (CRITICAL for configurable products)
    variantId: bagistoProduct.variants?.[0]?.id,
    selectedConfigurableOption: bagistoProduct.variants?.[0]?.id,
    selectedOptions: bagistoProduct.variants?.[0]?.selectedOptions || [],
    // Add full variants array
    variants: bagistoProduct.variants,
    priceHtml: {
      id: bagistoProduct.id,
      type: bagistoProduct.type,
      priceHtml: `<p class="final-price">${formatPrice(price)}</p>`,
      regularPrice: comparePrice,
      formattedRegularPrice: formatPrice(comparePrice),
      finalPrice: price,
      formattedFinalPrice: formatPrice(price),
    },
    images: bagistoProduct.images.map((img) => ({
      id: img.id,
      url: img.url,
      path: img.path,
      type: img.type,
      productId: img.productId,
    })),
    additionalData: bagistoProduct.additionalData,
    // Add configurable data
    configutableData: bagistoProduct.configutableData,
    // Add customizable options and flag
    customizableOptions: bagistoProduct.customizableOptions,
    hasCustomizableOptions: bagistoProduct.customizableOptions && 
      bagistoProduct.customizableOptions.length > 0,
    isSaleable: bagistoProduct.isSaleable,
    inStock: bagistoProduct.isSaleable,
    averageRating,
    reviewCount: reviews.length,
    reviews,
    brand,
    categories: bagistoProduct.categories,
  };
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const useBagistoProductsByCategory = (categoryId?: string) => {
  return useQuery({
    queryKey: ["bagistoProductsByCategory", categoryId],
    queryFn: async () => {
      try {
        if (!categoryId) {
          console.log("❌ No category ID provided");
          return {
            allProducts: {
              data: [],
              paginatorInfo: {
                count: 0,
                currentPage: 1,
                lastPage: 1,
                total: 0,
              },
            },
          };
        }

        console.log("📡 Fetching products for category:", categoryId);

        const input: FilterHomeCategoriesInput[] = [
          { key: "category_id", value: categoryId },
          { key: "status", value: "1" },
          { key: "perPage", value: "50" },
        ];

        const data = await request<ProductsByCategoryResponse>(
          GRAPHQL_ENDPOINT,
          GET_PRODUCTS_BY_CATEGORY,
          { input }
        );

        console.log(`✅ Found ${data.allProducts.data.length} products in category ${categoryId}`);
        
        const transformedProducts = data.allProducts.data.map(transformProductList);
        
        return {
          allProducts: {
            data: transformedProducts,
            paginatorInfo: data.allProducts.paginatorInfo,
          },
        };
      } catch (error: any) {
        console.error(
          "❌ Error fetching products by category:",
          error.message || error
        );
        console.error("❌ Full error:", JSON.stringify(error, null, 2));
        return {
          allProducts: {
            data: [],
            paginatorInfo: {
              count: 0,
              currentPage: 1,
              lastPage: 1,
              total: 0,
            },
          },
        };
      }
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
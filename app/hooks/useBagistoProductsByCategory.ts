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
        sku
        name
        description
        shortDescription
        price
        specialPrice
        specialPriceFrom
        specialPriceTo
        images {
          id
          url
          path
          type
          productId
        }
        isSaleable
        categories {
          id
          name
          slug
        }
        additionalData {
          id
          code
          label
          value
          type
        }
        reviews {
          id
          title
          rating
          comment
          status
          name
          createdAt
          updatedAt
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
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  specialPrice: string;
  specialPriceFrom?: string;
  specialPriceTo?: string;
  images: Array<{
    id: string;
    url: string;
    path: string;
    type: string;
    productId: string;
  }>;
  isSaleable: boolean;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  additionalData: Array<{
    id: string;
    code: string;
    label: string;
    value: string;
    type: string;
  }>;
  reviews: Array<{
    id: string;
    title: string;
    rating: number;
    comment: string;
    status: string;
    name: string;
    createdAt: string;
    updatedAt: string;
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
    name: bagistoProduct.name,
    sku: bagistoProduct.sku,
    type: bagistoProduct.type,
    priceHtml: {
      finalPrice: price.toString(),
      regularPrice: comparePrice.toString(),
      formattedFinalPrice: formatPrice(price),
      formattedRegularPrice: formatPrice(comparePrice),
    },
    images: bagistoProduct.images.map((img) => ({
      id: img.id,
      url: img.url,
      path: img.path,
      type: img.type,
      productId: img.productId,
    })),
    additionalData: bagistoProduct.additionalData,
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
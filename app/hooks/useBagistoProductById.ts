// hooks/useBagistoProductById.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { useLanguage } from "@/contexts/LanguageContext";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

// Remove the top-level useLanguage() call - it's not allowed here

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
        price
        specialPrice
        specialPriceFrom
        specialPriceTo
        isSaleable
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
      }
    }
  }
`;

interface FilterHomeCategoriesInput {
  key: string;
  value: string;
}

interface ProductImage {
  id: string;
  type: string;
  url: string;
  productId: string;
}

interface AdditionalData {
  id: string;
  label: string;
  value: string;
  type: string;
}

interface PriceHtml {
  id: string;
  type: string;
  priceHtml: string;
  regularPrice: string;
  formattedRegularPrice: string;
  finalPrice: string;
  formattedFinalPrice: string;
}

interface Review {
  id: string;
  title: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductData {
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
  isSaleable: boolean;
  images: ProductImage[];
  additionalData: AdditionalData[];
  priceHtml: PriceHtml;
  averageRating: number;
  percentageRating: number;
  reviews: Review[];
}

interface ProductResponse {
  allProducts: {
    data: ProductData[];
    paginatorInfo: {
      count: number;
      currentPage: number;
      lastPage: number;
      total: number;
    };
  };
}

const transformProduct = (product: ProductData): any => {
  const price = parseFloat(
    product.priceHtml?.finalPrice ||
      product.specialPrice ||
      product.price ||
      "0",
  );
  const comparePrice = parseFloat(
    product.priceHtml?.regularPrice || product.price || "0",
  );

  // Get brand from additional data
  const brand =
    product.additionalData.find(
      (data) => data.label === "Brand" || data.code === "brand",
    )?.value || "";

  // Get category from additional data
  const categoryData = product.additionalData.find(
    (data) => data.label === "Category",
  );
  const category = categoryData?.value || "";

  // Transform images
  const images = product.images.map((img) => img.url);
  const mainImage = images[0] || "";

  // Get approved reviews
  const reviews = product.reviews || [];

  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    sku: product.sku,
    type: product.type,
    priceHtml: {
      finalPrice: price.toString(),
      regularPrice: comparePrice.toString(),
      formattedFinalPrice: formatPrice(price),
      formattedRegularPrice: formatPrice(comparePrice),
    },
    images: product.images,
    additionalData: product.additionalData,
    isSaleable: product.isSaleable,
    inStock: product.isSaleable, // Assuming isSaleable means in stock
    averageRating: product.averageRating || 0,
    reviewCount: reviews.length,
    reviews,
    brand,
    category,
  };
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const useBagistoProductById = (id?: string) => {
  // ✅ Call useLanguage() here, inside the custom hook
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["bagistoProduct", id, locale], // locale is now available
    queryFn: async () => {
      try {
        if (!id) {
          console.log("❌ No product ID provided");
          return null;
        }

        console.log("📡 Fetching product from Bagisto:", id);

        // Add locale to the input if needed
        const input: FilterHomeCategoriesInput[] = [
          { key: "id", value: id },
          { key: "status", value: "1" },
          // Add locale filter if your API supports it
          // { key: "locale", value: locale },
        ];

        const data = await request<ProductResponse>(
          GRAPHQL_ENDPOINT,
          GET_PRODUCT_BY_ID,
          { input },
          {
            "X-Locale": locale, // Add locale header
          },
        );

        if (!data.allProducts?.data?.length) {
          console.log("❌ Product not found in response");
          return null;
        }

        console.log("✅ Product fetched successfully");
        const product = data.allProducts.data[0];
        return transformProduct(product);
      } catch (error: any) {
        console.error("❌ Error fetching product:");

        if (error.message) {
          console.error("Error message:", error.message);
        }

        if (error.response?.errors) {
          console.error(
            "GraphQL errors:",
            JSON.stringify(error.response.errors, null, 2),
          );
        }

        return null;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Optional: Add a variant that doesn't depend on language context
export const useBagistoProductByIdSimple = (id?: string) => {
  return useQuery({
    queryKey: ["bagistoProductSimple", id],
    queryFn: async () => {
      try {
        if (!id) return null;

        const input: FilterHomeCategoriesInput[] = [
          { key: "id", value: id },
          { key: "status", value: "1" },
        ];

        const data = await request<ProductResponse>(
          GRAPHQL_ENDPOINT,
          GET_PRODUCT_BY_ID,
          { input },
        );

        if (!data.allProducts?.data?.length) return null;

        return transformProduct(data.allProducts.data[0]);
      } catch (error) {
        console.error("❌ Error fetching product:", error);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Helper types for transforming Bagisto data to app format
export interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  currencyCode: string;
  image: string;
  images: string[];
  brand: string;
  category: string;
  categoryId?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isSaleable: boolean;
  variantId?: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    currencyCode: string;
    availableForSale: boolean;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
    image?: string;
  }>;
  options: Array<{
    id: string;
    name: string;
    values: string[];
  }>;
  tags: string[];
  additionalData?: Array<{
    label: string;
    value: string;
    type: string;
  }>;
  configutableData?: {
    attributes: Array<{
      id: string;
      code: string;
      label: string;
      options: Array<{
        id: string;
        label: string;
      }>;
    }>;
  };
}

// Helper functions
export const transformBagistoProduct = (product: any): TransformedProduct => {
  const price = parseFloat(product.priceHtml?.finalPrice || "0");
  const comparePrice = parseFloat(product.priceHtml?.regularPrice || "0");
  const brand =
    product.additionalData?.find((data: any) => data.label === "Brand")
      ?.value || "";

  // Get category from additional data
  const categoryData = product.additionalData?.find(
    (data: any) => data.label === "Category",
  );
  const category = categoryData?.value || "";
  const categoryId = categoryData?.id || "";

  // Transform images
  const images = product.images?.map((img: any) => img.url) || [];
  const mainImage = images[0] || "";

  // Transform variants
  const variants =
    product.variants?.map((variant: any) => ({
      id: variant.id,
      title: variant.sku,
      price,
      compareAtPrice: comparePrice > price ? comparePrice : undefined,
      currencyCode: "USD",
      availableForSale: product.isSaleable,
      selectedOptions: [],
      image: mainImage,
    })) || [];

  // Transform options from configutable data
  const options =
    product.configutableData?.attributes?.map((attr: any) => ({
      id: attr.id,
      name: attr.label,
      values: attr.options?.map((opt: any) => opt.label) || [],
    })) || [];

  // Get tags from additional data
  const tagsData = product.additionalData?.find(
    (data: any) => data.label.toLowerCase() === "tags",
  );
  const tags =
    tagsData?.value?.split(",").map((tag: string) => tag.trim()) || [];

  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    price,
    compareAtPrice: comparePrice,
    currencyCode: "USD",
    image: mainImage,
    images,
    brand,
    category,
    categoryId,
    rating: product.averageRating || 0,
    reviewCount: product.reviews?.length || 0,
    inStock: product.isSaleable,
    isSaleable: product.isSaleable,
    variantId: variants[0]?.id,
    variants,
    options,
    tags,
    additionalData: product.additionalData,
    configutableData: product.configutableData,
  };
};

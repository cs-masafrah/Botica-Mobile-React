// types/product.ts

export interface BagistoPriceHtml {
  id: string;
  type: string;
  priceHtml: string;
  regularPrice: number;
  formattedRegularPrice: string;
  finalPrice: number;
  formattedFinalPrice: string;
}

export interface BagistoImage {
  id: string;
  type: string;
  url: string;
  productId: string;
}

export interface BagistoReview {
  id: string;
  title: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface BagistoVariant {
  id: string;
  type: string;
  sku: string;
}

export interface AdditionalData {
  id: string;
  label: string;
  value: string;
  type: string;
}

export interface ConfigurableAttribute {
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
}

export interface ConfigurableIndex {
  id: string;
  attributeOptionIds: Array<{
    attributeId: string;
    attributeCode: string;
    attributeOptionId: string;
  }>;
}

export interface VariantPrice {
  id: string;
  regularPrice: { price: number; formattedPrice: string };
  finalPrice: { price: number; formattedPrice: string };
}

export interface ConfigurableData {
  attributes: ConfigurableAttribute[];
  index: ConfigurableIndex[];
  variantPrices: VariantPrice[];
}

export interface BagistoProduct {
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
  variants: BagistoVariant[];
  images: BagistoImage[];
  averageRating: number;
  percentageRating: number;
  reviews: BagistoReview[];
  priceHtml: BagistoPriceHtml;
  additionalData?: AdditionalData[];
  configurableData?: ConfigurableData;
}

export type Product = BagistoProduct;
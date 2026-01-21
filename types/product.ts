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


// types/product.ts

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  formattedPrice?: {
    price: number;
    total: number;
    taxAmount: number;
    discountAmount: number;
  };
}

export type Product = BagistoProduct;
export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currencyCode: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  currencyCode: string;
  image: string;
  images: string[];
  category: string;
  collectionId?: string;
  collectionName?: string;
  description: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  variantId?: string;
  variants?: ProductVariant[];
  options?: ProductOption[];
  smellslike?: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
  image: string;
};

export interface ShippingRate {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  shippingRates: ShippingRate[];
}

export interface ShippingDiscount {
  id: string;
  title: string;
  code: string;
  minimumOrderAmount: number;
  currencyCode: string;
  type: 'FREE_SHIPPING';
}

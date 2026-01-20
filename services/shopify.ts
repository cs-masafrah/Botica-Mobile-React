// services/shopify.ts - DUMMY VERSION
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText?: string;
  cta?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  currencyCode: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
    variantTitle?: string;
  }[];
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
    country?: string;
  };
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  shippingRates: ShippingRate[];
}

export interface ShippingRate {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
}

export interface ShippingDiscount {
  id: string;
  title: string;
  code: string;
  minimumOrderAmount: number;
  currencyCode: string;
  type: 'FREE_SHIPPING';
}

export class ShopifyService {
  constructor() {
    console.log('⚠️ ShopifyService initialized in dummy mode - Using Bagisto instead');
  }

  // All methods return empty arrays or throw errors
  async getProducts(): Promise<any[]> {
    console.log('⚠️ Shopify.getProducts() called - returning empty array');
    return [];
  }

  async getBanners(): Promise<Banner[]> {
    console.log('⚠️ Shopify.getBanners() called - returning empty array');
    return [];
  }

  async getReels(): Promise<any[]> {
    console.log('⚠️ Shopify.getReels() called - returning empty array');
    return [];
  }

  async getCollections(): Promise<any[]> {
    console.log('⚠️ Shopify.getCollections() called - returning empty array');
    return [];
  }

  async getProductById(): Promise<any> {
    console.log('⚠️ Shopify.getProductById() called - returning null');
    return null;
  }

  async getProductsByCollection(): Promise<any[]> {
    console.log('⚠️ Shopify.getProductsByCollection() called - returning empty array');
    return [];
  }

  async createCheckout(): Promise<string> {
    throw new Error('Shopify is disabled. Please use Bagisto checkout.');
  }

  async createOrder(): Promise<any> {
    throw new Error('Shopify is disabled. Please use Bagisto order creation.');
  }

  async getCustomerOrders(): Promise<Order[]> {
    console.log('⚠️ Shopify.getCustomerOrders() called - returning empty array');
    return [];
  }

  async getShippingDiscounts(): Promise<ShippingDiscount[]> {
    console.log('⚠️ Shopify.getShippingDiscounts() called - returning empty array');
    return [];
  }

  async getShippingZones(): Promise<ShippingZone[]> {
    console.log('⚠️ Shopify.getShippingZones() called - returning empty array');
    return [];
  }
}

export const shopifyService = new ShopifyService();
// contexts/ShopifyContext.tsx - Dummy version
import createContextHook from '@nkzw/create-context-hook';

export const [ShopifyContext, useShopify] = createContextHook(() => {
  return {
    products: [],
    banners: [],
    reels: [],
    collections: [],
    vendors: [],
    isLoading: false,
    error: null,
    getProducts: () => Promise.resolve([]),
    getBanners: () => Promise.resolve([]),
    getReels: () => Promise.resolve([]),
    getCollections: () => Promise.resolve([]),
  };
});

export const useShopifyVendors = () => {
  return [];
};

export const useShopifyProductsByCollectionId = (collectionId: string) => {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
};
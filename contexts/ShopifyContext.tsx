import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { shopifyService, Banner, Reel } from '@/services/shopify';
import { Product, Category } from '@/types/product';
import { products as mockProducts, categories as mockCategories } from '@/mocks/products';
import { useLanguage } from '@/contexts/LanguageContext';
import { preloadImages, extractImageUrls } from '@/utils/imagePreloader';

export const [ShopifyContext, useShopify] = createContextHook(() => {
  const { locale } = useLanguage();
  
  const productsQuery = useQuery({
    queryKey: ['shopify-products', locale],
    queryFn: () => (shopifyService as any).getProducts(locale),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const collectionsQuery = useQuery({
    queryKey: ['shopify-collections'],
    queryFn: () => shopifyService.getCollections(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const bannersQuery = useQuery({
    queryKey: ['shopify-banners'],
    queryFn: () => shopifyService.getBanners(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const reelsQuery = useQuery({
    queryKey: ['shopify-reels'],
    queryFn: () => shopifyService.getReels(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo<Product[]>(() => {
    console.log('Products query status:', {
      isLoading: productsQuery.isLoading,
      isError: productsQuery.isError,
      dataLength: productsQuery.data?.length,
      error: productsQuery.error,
    });
    if (productsQuery.data && productsQuery.data.length > 0) {
      console.log('Using Shopify products:', productsQuery.data.length);
      return productsQuery.data;
    }
    console.log('Using mock products');
    return mockProducts;
  }, [productsQuery.data, productsQuery.isLoading, productsQuery.isError, productsQuery.error]);

  const categories = useMemo<Category[]>(() => {
    console.log('Collections query status:', {
      isLoading: collectionsQuery.isLoading,
      isError: collectionsQuery.isError,
      dataLength: collectionsQuery.data?.length,
      error: collectionsQuery.error,
    });
    if (collectionsQuery.data && collectionsQuery.data.length > 0) {
      console.log('Using Shopify collections:', collectionsQuery.data.length);
      return collectionsQuery.data;
    }
    console.log('Using mock categories');
    return mockCategories;
  }, [collectionsQuery.data, collectionsQuery.isLoading, collectionsQuery.isError, collectionsQuery.error]);

  const banners = useMemo<Banner[]>(() => {
    console.log('Banners query status:', {
      isLoading: bannersQuery.isLoading,
      isError: bannersQuery.isError,
      dataLength: bannersQuery.data?.length,
      error: bannersQuery.error,
    });
    if (bannersQuery.data && bannersQuery.data.length > 0) {
      console.log('Using Shopify banners:', bannersQuery.data.length);
      return bannersQuery.data;
    }
    console.log('No Shopify banners found, will use fallback in component');
    return [];
  }, [bannersQuery.data, bannersQuery.isLoading, bannersQuery.isError, bannersQuery.error]);

  const reels = useMemo<Reel[]>(() => {
    console.log('Reels query status:', {
      isLoading: reelsQuery.isLoading,
      isError: reelsQuery.isError,
      dataLength: reelsQuery.data?.length,
      error: reelsQuery.error,
    });
    if (reelsQuery.data && reelsQuery.data.length > 0) {
      console.log('Using Shopify reels:', reelsQuery.data.length);
      return reelsQuery.data;
    }
    console.log('No Shopify reels found');
    return [];
  }, [reelsQuery.data, reelsQuery.isLoading, reelsQuery.isError, reelsQuery.error]);

  const isLoading = productsQuery.isLoading || collectionsQuery.isLoading || bannersQuery.isLoading || reelsQuery.isLoading;
  const isError = productsQuery.isError && collectionsQuery.isError;
  const isUsingShopify = !!(productsQuery.data && productsQuery.data.length > 0);

  useEffect(() => {
    if (products.length > 0) {
      const productImages = extractImageUrls(products);
      console.log(`📦 Preloading ${productImages.length} product images...`);
      preloadImages(productImages);
    }
  }, [products]);

  useEffect(() => {
    if (banners.length > 0) {
      const bannerImages = extractImageUrls(banners);
      console.log(`🎨 Preloading ${bannerImages.length} banner images...`);
      preloadImages(bannerImages);
    }
  }, [banners]);

  useEffect(() => {
    if (categories.length > 0) {
      const categoryImages = extractImageUrls(categories);
      console.log(`📂 Preloading ${categoryImages.length} category images...`);
      preloadImages(categoryImages);
    }
  }, [categories]);

  return {
    products,
    categories,
    banners,
    reels,
    isLoading,
    isError,
    isUsingShopify,
    refetch: () => {
      productsQuery.refetch();
      collectionsQuery.refetch();
      bannersQuery.refetch();
      reelsQuery.refetch();
    },
  };
});

export function useShopifyProduct(id: string) {
  const { locale } = useLanguage();
  
  return useQuery({
    queryKey: ['shopify-product', id, locale],
    queryFn: async () => {
      const product = await (shopifyService as any).getProductById(id, locale);
      if (!product) {
        const mockProduct = mockProducts.find(p => p.id === id);
        return mockProduct || null;
      }
      return product;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopifyProductsByCategory(categoryName: string) {
  const { products } = useShopify();
  
  return useMemo(() => {
    return products.filter(p => p.category === categoryName);
  }, [products, categoryName]);
}

export function useShopifyProductsByCollectionId(collectionId: string | null) {
  const { locale } = useLanguage();
  
  return useQuery({
    queryKey: ['shopify-collection-products', collectionId, locale],
    queryFn: async () => {
      if (!collectionId) return [];
      console.log('Fetching products for collection ID:', collectionId);
      return (shopifyService as any).getProductsByCollection(collectionId, locale);
    },
    enabled: !!collectionId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopifyVendors() {
  const { products } = useShopify();
  
  return useMemo(() => {
    const vendorMap = new Map<string, { name: string; count: number; image: string }>();
    
    products.forEach(product => {
      const vendor = product.brand || 'Unknown';
      if (vendorMap.has(vendor)) {
        const existing = vendorMap.get(vendor)!;
        vendorMap.set(vendor, { ...existing, count: existing.count + 1 });
      } else {
        vendorMap.set(vendor, { name: vendor, count: 1, image: product.image });
      }
    });
    
    return Array.from(vendorMap.values()).sort((a, b) => b.count - a.count);
  }, [products]);
}

export function useShopifyProductsByVendor(vendorName: string) {
  const { products } = useShopify();
  
  return useMemo(() => {
    return products.filter(p => p.brand === vendorName);
  }, [products, vendorName]);
}

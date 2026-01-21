// hooks/useProduct.ts (wrapper)
import { useProductById } from './useProductById';
import { useProductsByCategory } from './useProductsByCategory';
import { transformBagistoProduct } from '../types/utility';

// Re-export the hooks for direct use
export { useProductById, useProductsByCategory };

// Create a transformed version of the product hook
export const useProduct = (productId?: string) => {
  const { data: product, isLoading, error } = useProductById(productId);
  
  return {
    data: product ? transformBagistoProduct(product) : null,
    isLoading,
    error,
    rawProduct: product, // Keep the raw Bagisto product if needed
  };
};

// Create a transformed version of the products by category hook
export const useCategoryProducts = (
  categoryId?: string, 
  options?: { page?: number; perPage?: number }
) => {
  const { data, isLoading, error } = useProductsByCategory(categoryId, options);
  
  const transformedProducts = data?.allProducts?.data?.map(transformBagistoProduct) || [];
  
  return {
    data: transformedProducts,
    rawData: data,
    isLoading,
    error,
    pagination: data?.allProducts?.paginatorInfo,
  };
};
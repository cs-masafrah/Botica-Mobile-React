import { useQuery } from '@tanstack/react-query';
import { bagistoProductService } from '@/services/bagisto-products';

export const useBagistoProducts = (options?: {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['bagistoProducts', options],
    queryFn: () => bagistoProductService.getProducts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useBagistoProduct = (id: string) => {
  return useQuery({
    queryKey: ['bagistoProduct', id],
    queryFn: () => bagistoProductService.getProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useBagistoCategories = () => {
  return useQuery({
    queryKey: ['bagistoCategories'],
    queryFn: () => bagistoProductService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
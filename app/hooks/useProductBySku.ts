// hooks/useProductBySku.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchAllProducts, FilterHomeCategoriesInput } from "./useAllProducts";

export const useProductBySku = (sku: string | null) => {
  const { accessToken } = useAuth();
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["productBySku", sku, locale],
    queryFn: async () => {
      if (!sku) return null;
      
      const filters: FilterHomeCategoriesInput[] = [
        { key: "page", value: "1" },
        { key: "limit", value: "10" },
        { key: "sku", value: sku }
      ];
      
      const result = await fetchAllProducts(filters, accessToken, locale);
      return result.allProducts.data[0] || null;
    },
    enabled: !!sku,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
// app/hooks/useBrands.ts
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_BRANDS = gql`
  query GetBrands($locale: String) {
    attributeValuesWithCounts(attribute: "brand", locale: $locale) {
      values {
        value
        label
        product_count
        option_id
        image_url
        # locale field removed from here
      }
    }
  }
`;

interface BrandRawData {
  value: string;
  label: string;
  product_count: number;
  option_id: number;
  image_url?: string;
  // locale field removed from interface
}

interface BrandData {
  name: string;
  count: number;
  image?: string;
  value: string;
  option_id: number;
  // locale field removed from interface
}

interface BrandResponse {
  attributeValuesWithCounts: {
    values: BrandRawData[];
  };
}

interface UseBrandsOptions {
  locale?: string;
}

const fetchBrands = async (locale?: string): Promise<BrandRawData[]> => {
  try {
    const data = await request<BrandResponse>(GRAPHQL_ENDPOINT, GET_BRANDS, {
      locale
    });
    return data.attributeValuesWithCounts.values;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

export const useBrands = (options?: UseBrandsOptions) => {
  const { locale } = options || {};

  return useQuery({
    queryKey: ["brands", locale],
    queryFn: () => fetchBrands(locale),
    select: (data: BrandRawData[]): BrandData[] =>
      data.map((brand) => ({
        name: brand.label,
        count: brand.product_count,
        image: brand.image_url,
        value: brand.value,
        option_id: brand.option_id,
        // locale field removed from mapping
      })),
    staleTime: 5 * 60 * 1000,
  });
};
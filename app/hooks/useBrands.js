// app/hooks/useBrands.js
import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";
import { BAGISTO_CONFIG } from "@/constants/bagisto";
import { Platform } from "react-native";

const GRAPHQL_ENDPOINT = BAGISTO_CONFIG.baseUrl;

const GET_BRANDS = gql`
  query GetBrands {
    attributeValuesWithCounts(attribute: "brand") {
      values {
        value
        label
        product_count
        option_id
        image_url
      }
    }
  }
`;

const fetchBrands = async () => {
  try {
    const data = await request(GRAPHQL_ENDPOINT, GET_BRANDS);
    return data.attributeValuesWithCounts.values;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    select: (data) =>
      data.map((brand) => ({
        name: brand.label,
        count: brand.product_count,
        image: brand.image_url,
        value: brand.value,
        option_id: brand.option_id,
      })),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

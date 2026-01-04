import Constants from "expo-constants";
import { Platform } from "react-native";

const extra =
  // Constants.manifest?.extra ||
  Constants.expoConfig?.extra || {};

const GRAPHQL_ENDPOINT =
  Platform.OS === "android" ? extra.BASE_URL_ANDROID : extra.BASE_URL_IOS;

export const BAGISTO_CONFIG = {
  baseUrl: GRAPHQL_ENDPOINT,
  storeName: extra.STORE_NAME,
  storefrontAccessToken: extra.STORE_ACCESS_TOKEN,
  adminAccessToken: extra.ADMIN_ACCESS_TOKEN,
};

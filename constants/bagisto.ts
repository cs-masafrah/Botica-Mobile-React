import Constants from 'expo-constants';

const extra =
  // Constants.manifest?.extra ||
  Constants.expoConfig?.extra ||
  {};

export const BAGISTO_CONFIG = {
  baseUrl: extra.BASE_URL,
  storeName: extra.STORE_NAME,
  storefrontAccessToken: extra.STORE_ACCESS_TOKEN,
  adminAccessToken: extra.ADMIN_ACCESS_TOKEN,
};
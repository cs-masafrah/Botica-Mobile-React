// import Config from 'react-native-config';

// console.log("config:" + Config)
// export const SHOPIFY_CONFIG = {
//   storeName: Config.STORE_NAME,
//   storefrontAccessToken: Config.STORE_ACCESS_TOKEN,
//   adminAccessToken: Config.ADMIN_ACCESS_TOKEN,
// };

import Constants from 'expo-constants';

// const { STORE_NAME, STORE_ACCESS_TOKEN, ADMIN_ACCESS_TOKEN } = Constants.expoConfig.extra;

export const SHOPIFY_CONFIG = {
  storeName: Constants.STORE_NAME,
  storefrontAccessToken: Constants.STORE_ACCESS_TOKEN,
  adminAccessToken: Constants.ADMIN_ACCESS_TOKEN,
  baseUrl: Constants.Base_URL
};

// app.config.js
import "dotenv/config"; // Load environment variables from .env

export default {
  expo: {
    name: "Botica",
    slug: "Botica",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rork-app",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.rork.Botica.asafrah",
      infoPlist: {
        UIBackgroundModes: ["audio"],
        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to access your microphone",
        NSAppTransportSecurity: {
          NSExceptionDomains: {
            "164.92.172.89": {
              NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
            },
          },
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "app.rork.beauty_ecommerce_platform",
      permissions: ["RECORD_AUDIO"], // duplicates removed
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ["expo-router", { origin: "https://rork.com/" }],
      "expo-font",
      "expo-web-browser",
      [
        "expo-av",
        {
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    updates: {
      // Disabled until properly configured with EAS Update
      enabled: false,
      // After running `eas update:configure`, this URL will be correct
      url: "https://u.expo.dev/0329a2f7-15a7-4d99-b99a-52933f18153b",
      requestHeaders: {},
      checkAutomatically: "ALWAYS",
      fallbackToCacheTimeout: 0,
      useEmbeddedUpdate: true,
      assetPatternsToBeBundled: [],
      disableAntiBrickingMeasures: false,
    },
    runtimeVersion: "1.0.0",
    extra: {
      // These values come from your .env file (or fallback to local dev defaults)
      BASE_URL_ANDROID:
        process.env.BASE_URL_ANDROID || "http://10.0.2.2:8000/graphql",
      BASE_URL_IOS: process.env.BASE_URL_IOS || "http://127.0.0.1:8000/graphql",
      STORE_NAME: process.env.STORE_NAME || "Botica",
      STORE_ACCESS_TOKEN: process.env.STORE_ACCESS_TOKEN || "",
      ADMIN_ACCESS_TOKEN: process.env.ADMIN_ACCESS_TOKEN || "",
      eas: {
        projectId: "0329a2f7-15a7-4d99-b99a-52933f18153b",
      },
    },
  },
};

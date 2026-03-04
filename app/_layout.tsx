// app/_layout.tsx - Updated
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nManager } from "react-native";
import { AddressContext } from "@/contexts/AddressContext";
import { AuthContext } from "@/contexts/AuthContext";
import { CartContext } from "@/contexts/CartContext";
import { HomepageConfigContext } from "@/contexts/HomepageConfigContext";
import { LanguageContext } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { WishlistContext } from "@/contexts/WishlistContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { FloatingCart } from "@/components/FloatingCart";
import { preloadImages, extractImageUrls } from "@/utils/imagePreloader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [, setImagesPreloaded] = useState(false);
  const { t, isRTL } = useLanguage();

  // Force RTL/LTR layout based on language
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  }, [isRTL]);

  useEffect(() => {
    const preloadAppImages = async () => {
      try {
        const queryCache = queryClient.getQueryCache();
        const allQueries = queryCache.getAll();
        const allData = allQueries.map((q) => q.state.data).filter(Boolean);

        const imageUrls = extractImageUrls(allData);

        if (imageUrls.length > 0) {
          console.log("Found", imageUrls.length, "images to preload");
          await preloadImages(imageUrls.slice(0, 30));
        }
      } catch (error) {
        console.error("Error preloading images:", error);
      } finally {
        setImagesPreloaded(true);
      }
    };

    const timer = setTimeout(() => {
      preloadAppImages();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerBackTitle: t("back") }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: false,
            headerTitle: "",
            headerTransparent: true,
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{
            headerShown: true,
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="brand/[id]"
          options={{
            headerShown: true,
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="wishlist"
          options={{
            headerShown: true,
            headerTitle: t("wishlist"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerTitle: t("signIn"),
            headerBackTitle: t("back"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: true,
            headerTitle: t("signUp"),
            headerBackTitle: t("back"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="addresses"
          options={{
            headerShown: true,
            headerTitle: t("addresses"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            headerTitle: t("editProfile"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: t("settings"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="order-history"
          options={{
            headerShown: true,
            headerTitle: t("orderHistory"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="order-details"
          options={{
            headerShown: true,
            headerTitle: t("orderDetails"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="vendor/[name]"
          options={{
            headerShown: true,
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="customize-homepage"
          options={{
            headerShown: true,
            headerTitle: t("customizeHomepage"),
            headerBackTitle: t("back"),
          }}
        />
        <Stack.Screen
          name="products/index"
          options={{
            headerShown: true,
            headerTitle: t("allProducts"),
            headerBackTitle: t("back"),
          }}
        />
      </Stack>
      <FloatingCart />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CurrencyProvider>
          <LanguageContext>
            <AuthContext>
              <AddressContext>
                <HomepageConfigContext>
                  <CheckoutProvider>
                    <CartContext>
                      <WishlistContext>
                        <RootLayoutNav />
                      </WishlistContext>
                    </CartContext>
                  </CheckoutProvider>
                </HomepageConfigContext>
              </AddressContext>
            </AuthContext>
          </LanguageContext>
        </CurrencyProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

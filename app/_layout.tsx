// app/vendor/_layout.tsx - Updated
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AddressContext } from '@/contexts/AddressContext';
import { AuthContext } from '@/contexts/AuthContext';
import { CartContext } from '@/contexts/CartContext';
import { HomepageConfigContext } from '@/contexts/HomepageConfigContext';
import { LanguageContext } from '@/contexts/LanguageContext';
import { WishlistContext } from '@/contexts/WishlistContext';
import { FloatingCart } from '@/components/FloatingCart';
import { preloadImages, extractImageUrls } from '@/utils/imagePreloader';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [, setImagesPreloaded] = useState(false);

  useEffect(() => {
    const preloadAppImages = async () => {
      try {
        const queryCache = queryClient.getQueryCache();
        const allQueries = queryCache.getAll();
        const allData = allQueries.map(q => q.state.data).filter(Boolean);
        
        const imageUrls = extractImageUrls(allData);
        
        if (imageUrls.length > 0) {
          console.log('Found', imageUrls.length, 'images to preload');
          await preloadImages(imageUrls.slice(0, 30));
        }
      } catch (error) {
        console.error('Error preloading images:', error);
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
      <Stack screenOptions={{ headerBackTitle: 'Back' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="wishlist"
          options={{
            headerShown: true,
            headerTitle: 'Wishlist',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerTitle: 'Sign In',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: true,
            headerTitle: 'Sign Up',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="addresses"
          options={{
            headerShown: true,
            headerTitle: 'Addresses',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            headerTitle: 'Edit Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="order-history"
          options={{
            headerShown: true,
            headerTitle: 'Order History',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="order-details"
          options={{
            headerShown: true,
            headerTitle: 'Order Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="vendor/[name]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="customize-homepage"
          options={{
            headerShown: true,
            headerTitle: 'Customize Homepage',
            headerBackTitle: 'Back',
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
        <LanguageContext>
          <AuthContext>
            <AddressContext>
              {/* REMOVED: <ShopifyContext> */}
              <HomepageConfigContext>
                <CartContext>
                  <WishlistContext>
                    <RootLayoutNav />
                  </WishlistContext>
                </CartContext>
              </HomepageConfigContext>
              {/* REMOVED: </ShopifyContext> */}
            </AddressContext>
          </AuthContext>
        </LanguageContext>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
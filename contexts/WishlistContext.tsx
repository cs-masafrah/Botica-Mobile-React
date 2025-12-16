import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '@/types/product';

const WISHLIST_STORAGE_KEY = '@beauty_wishlist';

export const [WishlistContext, useWishlist] = createContextHook(() => {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadWishlist = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          } else {
            console.warn('Invalid wishlist format, clearing storage');
            await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('Failed to parse wishlist data:', parseError);
          console.log('Clearing corrupted wishlist data');
          await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveWishlist = useCallback(async () => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  }, [items]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    if (isLoaded) {
      saveWishlist();
    }
  }, [items, isLoaded, saveWishlist]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prevItems) => {
      const exists = prevItems.find(item => item.id === product.id);
      if (exists) {
        return prevItems;
      }
      return [...prevItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.id !== productId));
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setItems((prevItems) => {
      const exists = prevItems.find(item => item.id === product.id);
      if (exists) {
        return prevItems.filter(item => item.id !== product.id);
      }
      return [...prevItems, product];
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return useMemo(() => ({
    items,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoaded,
  }), [items, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist, isLoaded]);
});

import { useCart } from '@/contexts/CartContext';
import { useRouter, usePathname } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

export function FloatingCart() {
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const isReelsPage = pathname === '/reels';

  useEffect(() => {
    if (itemCount > 0) {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [itemCount, bounceAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isCartPage) {
      router.push('/cart');
    }
  };

  if (isCartPage || isCheckoutPage || itemCount === 0) {
    return null;
  }

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isReelsPage && styles.containerReels,
        {
          transform: [{ scale: scaleAnim }, { translateY }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && Platform.OS === 'ios' && styles.buttonPressed,
        ]}
      >
        <View style={styles.iconContainer}>
          <ShoppingBag size={28} color="#fff" strokeWidth={2} />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    zIndex: 1000,
    ...Platform.select({
      web: {
        cursor: 'pointer' as const,
      },
    }),
  },
  containerReels: {
    bottom: 240,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
});

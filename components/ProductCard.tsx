// components/ProductCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Plus, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Product, BagistoProduct } from '@/app/types/product';

interface ProductCardProps {
  product: Product | BagistoProduct;
  onAddToCart?: (product: Product | BagistoProduct) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedProductId, setAddedProductId] = React.useState<string | null>(null);

  const inWishlist = isInWishlist(product.id);
  const hasDiscount = product.priceHtml?.regularPrice > product.priceHtml?.finalPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.priceHtml.regularPrice - product.priceHtml.finalPrice) / product.priceHtml.regularPrice) * 100)
    : 0;
  const isAdded = addedProductId === product.id;
  const imageUrl = product.images?.[0]?.url || '';
  const brand = product.additionalData?.find(data => data.label === 'Brand')?.value || '';

 const handleAddToCart = async () => {
  if (onAddToCart) {
    onAddToCart(product);
  } else {
    try {
      // Prepare product for Bagisto GraphQL API
      const bagistoProduct: any = {
        id: product.id,
        productId: product.id,
        name: product.name,
        description: product.shortDescription || product.description || '',
        compareAtPrice: product.priceHtml?.regularPrice || 0,
        currencyCode: 'USD', 
        image: imageUrl,
        images: product.images?.map(img => img.url) || [],
        brand: brand,
        rating: product.averageRating || 0,
        reviewCount: product.reviews?.length || 0,
        inStock: product.isSaleable,
        category: product.additionalData?.find(data => data.label === 'Category')?.value || '',
        options: (product as any).configutableData?.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.label,
          values: attr.options.map((opt: any) => opt.label)
        })) || [],

        price: product.priceHtml?.finalPrice || 0,
        // Include any variant data if available
        ...(product.variants?.[0] && {
          selectedConfigurableOption: product.variants[0].id
        }),
        // Pass variantId if available
        variantId: product.variants?.[0]?.id
      };

      console.log('🛒 [PRODUCT CARD] Adding to cart:', bagistoProduct);
      
      const result = await addToCart(bagistoProduct, 1);
      
      if (result.success) {
        setAddedProductId(product.id);
        setTimeout(() => setAddedProductId(null), 600);
        
        // You can show a success toast here if needed
        console.log('✅ Added to cart:', result.message);
      } else {
        // Show error message
        console.error('❌ Failed to add to cart:', result.message);
        // You can show an error toast here
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  }
};

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={[styles.productImage, { backgroundColor: Colors.cardBackground }]} />
        )}
        
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
          </View>
        )}
        
        <Pressable 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart 
            size={18} 
            color={inWishlist ? Colors.error : Colors.text}
            fill={inWishlist ? Colors.error : 'transparent'}
          />
        </Pressable>
        
        <Pressable 
          style={[styles.addToCartButton, isAdded && styles.addToCartButtonSuccess]}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isAdded ? (
            <Check 
              size={13} 
              color={Colors.white}
              strokeWidth={3}
            />
          ) : (
            <Plus 
              size={13} 
              color={Colors.white}
              strokeWidth={3}
            />
          )}
        </Pressable>
      </View>
      
      <View style={styles.productInfo}>
        {brand && (
          <Text style={styles.brandText} numberOfLines={1}>{brand}</Text>
        )}
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>★ {product.averageRating || '0.0'}</Text>
          {product.reviews && product.reviews.length > 0 && (
            <Text style={styles.reviewText}>({product.reviews.length})</Text>
          )}
        </View>
        
        <View style={styles.priceRow}>
          {hasDiscount && (
            <Text style={styles.compareAtPriceText}>
              {product.priceHtml?.formattedRegularPrice || ''}
            </Text>
          )}
          <Text style={styles.priceText}>
            {product.priceHtml?.formattedFinalPrice || 'N/A'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: Colors.cardBackground,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonSuccess: {
    backgroundColor: '#10B981',
  },
  productInfo: {
    padding: 8,
  },
  brandText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  compareAtPriceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ProductCard;
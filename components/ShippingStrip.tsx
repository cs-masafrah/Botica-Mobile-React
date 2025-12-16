import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAddress } from '@/contexts/AddressContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

export function ShippingStrip() {
  const { addresses } = useAddress();
  const { t, isRTL } = useLanguage();

  return (
    <View style={styles.shippingStrip}>
      <Text style={[styles.shippingText, isRTL && { textAlign: 'right' }]}>
        {t('shippingTo')}
      </Text>
      <Pressable 
        onPress={() => router.push('/addresses')}
        style={styles.addressButton}
      >
        <Text 
          style={[styles.addressText, isRTL && { textAlign: 'right' }]} 
          numberOfLines={1}
        >
          {addresses.length > 0 
            ? (() => {
                const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
                if (!defaultAddress) return t('noAddress');
                const parts = [
                  defaultAddress.address1,
                  defaultAddress.address2,
                  defaultAddress.city,
                  defaultAddress.country
                ].filter(Boolean);
                return parts.join(', ');
              })()
            : t('noAddress')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shippingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || 'rgba(0, 0, 0, 0.05)',
    gap: 6,
  },
  shippingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  addressButton: {
    flex: 1,
  },
  addressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});

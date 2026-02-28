import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAddress } from '@/contexts/AddressContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

export function ShippingStrip() {
  const { addresses } = useAddress();
  const { t, isRTL } = useLanguage();

  const formatAddress = () => {
    if (addresses.length === 0) return t('noAddress');
    
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
    
    // Format address based on RTL/LTR
    const parts = [
      defaultAddress.address1,
      defaultAddress.address2,
      defaultAddress.city,
      defaultAddress.country
    ].filter(Boolean);
    
    // For RTL, we might want to reverse the order or use a different separator
    // This depends on how addresses are typically formatted in Arabic
    return parts.join(isRTL ? '، ' : ', ');
  };

  return (
    <View style={[styles.shippingStrip, isRTL && styles.shippingStripRTL]}>
      <Text style={[styles.shippingText, isRTL && styles.shippingTextRTL]}>
        {t('shippingTo')}
      </Text>
      <Pressable 
        onPress={() => router.push('/addresses')}
        style={[styles.addressButton, isRTL && styles.addressButtonRTL]}
      >
        <Text 
          style={[styles.addressText, isRTL && styles.addressTextRTL]} 
          numberOfLines={1}
        >
          {formatAddress()}
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
  shippingStripRTL: {
    flexDirection: 'row-reverse',
  },
  shippingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  shippingTextRTL: {
    textAlign: 'right',
  },
  addressButton: {
    flex: 1,
  },
  addressButtonRTL: {
    alignItems: 'flex-end',
  },
  addressText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressTextRTL: {
    textAlign: 'right',
  },
});
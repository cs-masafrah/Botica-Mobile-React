import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAddress } from "@/contexts/AddressContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";

export function ShippingStrip() {
  const { addresses } = useAddress();
  const { t, isRTL } = useLanguage();

  const formatAddress = () => {
    if (addresses.length === 0) return t("noAddress");

    const defaultAddress =
      addresses.find((a) => a.defaultAddress) || addresses[0];
    const separator = isRTL ? "، " : ", ";

    // Flatten the multi-line address (Street 1\nBuilding 5\nApartment 3) into a single line
    const flattenedAddress = defaultAddress.address
      ? defaultAddress.address
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join(separator)
      : "";

    // Build address parts in standard order (omit building if already included above)
    const parts = [
      flattenedAddress,
      defaultAddress.city,
      defaultAddress.state,
      defaultAddress.postcode,
      defaultAddress.country,
    ].filter(Boolean);

    return parts.join(separator);
  };

  return (
    <View style={[styles.shippingStrip, isRTL && styles.shippingStripRTL]}>
      <Text style={[styles.shippingText, isRTL && styles.shippingTextRTL]}>
        {t("shippingTo")}
      </Text>
      <Pressable
        onPress={() => router.push("/addresses")}
        style={[styles.addressButton, isRTL && styles.addressButtonRTL]}
      >
        <Text
          style={[styles.addressText, isRTL && styles.addressTextRTL]}
          numberOfLines={5}
        >
          {formatAddress()}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shippingStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || "rgba(0, 0, 0, 0.05)",
    gap: 6,
  },
  shippingStripRTL: {
    flexDirection: "row-reverse",
  },
  shippingText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  shippingTextRTL: {
    textAlign: "right",
  },
  addressButton: {
    flex: 1,
  },
  addressButtonRTL: {
    alignItems: "flex-end",
  },
  addressText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  addressTextRTL: {
    textAlign: "right",
  },
});

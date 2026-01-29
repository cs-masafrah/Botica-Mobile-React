// components/checkout/AddressStep.tsx - STYLES ONLY UPDATE
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import Colors from "@/constants/colors";
import { Check, Plus, MapPin, Sparkles } from "lucide-react-native";
import { authService, Address } from "@/services/auth";
import { router } from "expo-router";

const AddressStep: React.FC = () => {
  const {
    useBillingForShipping,
    setUseBillingForShipping,
    saveAddresses,
    isLoading,
  } = useCheckout();

  /* ------------------ ADDRESS LIST STATE ------------------ */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  /* ------------------ LOAD CUSTOMER ADDRESSES ------------------ */
  useEffect(() => {
    let mounted = true;

    const loadAddresses = async () => {
      try {
        const result = await authService.getAddresses();
        if (!mounted) return;

        setAddresses(result);

        const defaultAddress =
          result.find((a) => a.isDefault) || result[0];

        setSelectedAddressId(defaultAddress?.id || null);
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------ SAVE ADDRESSES ------------------ */
  const handleSave = async () => {
    try {
      const selectedAddress = addresses.find(
        (a) => a.id === selectedAddressId
      );

      if (!selectedAddress) {
        Alert.alert("Error", "Please select an address");
        return;
      }

      const mappedAddress = {
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        email: selectedAddress.email || "",
        address: [selectedAddress.address1],
        country: selectedAddress.country,
        state: selectedAddress.province || "",
        city: selectedAddress.city,
        postcode: selectedAddress.zip,
        phone: selectedAddress.phone || "",
        companyName: selectedAddress.companyName || "",
        useForShipping: true,
      };

      const billing = mappedAddress;
      const shipping = useBillingForShipping
        ? mappedAddress
        : mappedAddress; // future-proof if you add separate shipping later

      await saveAddresses(billing, shipping);
    } catch (error) {
      console.error("Error saving addresses:", error);
      Alert.alert("Error", "Failed to continue checkout.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <MapPin size={24} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.title}>Delivery Address</Text>
          <Text style={styles.subtitle}>
            Where should we deliver your order?
          </Text>
        </View>
      </View>

      {/* ------------------ ADDRESS SELECTOR ------------------ */}
      {loadingAddresses ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingPulse}>
            <MapPin size={48} color={Colors.primary} />
          </View>
          <Text style={styles.loadingText}>Finding your addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <Pressable
          style={styles.emptyState}
          onPress={() => router.push("/addresses")}
        >
          <View style={styles.emptyIcon}>
            <Plus size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No addresses found</Text>
          <Text style={styles.emptySubtitle}>
            Add your first address to continue
          </Text>
        </Pressable>
      ) : (
        <>
          {addresses.map((address) => {
            const isSelected = selectedAddressId === address.id;

            return (
              <Pressable
                key={address.id}
                style={[
                  styles.addressCard,
                  isSelected && styles.addressCardSelected,
                ]}
                onPress={() => setSelectedAddressId(address.id)}
              >
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Sparkles size={10} color="#ffffff" />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
                
                <View style={styles.addressContent}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressName}>
                      {address.firstName} {address.lastName}
                    </Text>
                    <View style={styles.checkmarkContainer}>
                      <View style={[
                        styles.checkmark,
                        isSelected && styles.checkmarkSelected
                      ]}>
                        {isSelected && <Check size={12} color="#ffffff" />}
                      </View>
                    </View>
                  </View>

                  <Text style={styles.addressLine}>
                    {address.address1}
                  </Text>
                  <Text style={styles.addressDetails}>
                    {address.city}, {address.country} - {address.zip}
                  </Text>
                  {address.phone && (
                    <Text style={styles.addressPhone}>{address.phone}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* -------- Add new address CTA -------- */}
          <Pressable
            style={styles.addNewButton}
            onPress={() => router.push('/addresses')}
          >
            <View style={styles.addNewIcon}>
              <Plus size={18} color={Colors.primary} />
            </View>
            <Text style={styles.addNewText}>
              Add a new address
            </Text>
          </Pressable>
        </>
      )}

      {/* ------------------ SAME ADDRESS CHECKBOX ------------------ */}
      <Pressable
        style={styles.checkboxRow}
        onPress={() => setUseBillingForShipping(!useBillingForShipping)}
      >
        <View
          style={[
            styles.checkbox,
            useBillingForShipping && styles.checkboxChecked,
          ]}
        >
          {useBillingForShipping && (
            <Check size={10} color="#ffffff" />
          )}
        </View>
        <Text style={styles.checkboxLabel}>
          Use same address for billing
        </Text>
      </Pressable>

      {/* ------------------ CONTINUE ------------------ */}
      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Saving..." : "Continue to Shipping"}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

/* ------------------ STYLES ONLY ------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981', // Emerald green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addressGrid: {
    gap: 12,
  },
  addressCardWrapper: {
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#d1fae5', // Light green border
    position: 'relative',
  },
  addressCardSelected: {
    borderColor: '#10b981', // Emerald green
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#059669', // Darker green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  addressLine: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 20,
  },
  addressDetails: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 13,
    color: '#059669', // Dark green
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#d1fae5',
    gap: 12,
  },
  addNewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#10b981', // Emerald green
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default AddressStep;
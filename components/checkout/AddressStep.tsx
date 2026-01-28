// components/checkout/AddressStep.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useCheckout } from "@/contexts/CheckoutContext";
import Colors from "@/constants/colors";
import { Check } from "lucide-react-native";

const AddressStep: React.FC = () => {
  const {
    billingAddress,
    shippingAddress,
    useBillingForShipping,
    setUseBillingForShipping,
    saveAddresses,
    isLoading,
    setStep,
  } = useCheckout();

  const [formData, setFormData] = useState({
    billing: {
      firstName: billingAddress?.firstName || "",
      lastName: billingAddress?.lastName || "",
      email: billingAddress?.email || "",
      address: billingAddress?.address?.[0] || "",
      country: billingAddress?.country || "US",
      state: billingAddress?.state || "",
      city: billingAddress?.city || "",
      postcode: billingAddress?.postcode || "",
      phone: billingAddress?.phone || "",
      companyName: billingAddress?.companyName || "",
    },
    shipping: {
      firstName: shippingAddress?.firstName || "",
      lastName: shippingAddress?.lastName || "",
      email: shippingAddress?.email || "",
      address: shippingAddress?.address?.[0] || "",
      country: shippingAddress?.country || "US",
      state: shippingAddress?.state || "",
      city: shippingAddress?.city || "",
      postcode: shippingAddress?.postcode || "",
      phone: shippingAddress?.phone || "",
      companyName: shippingAddress?.companyName || "",
    },
  });

  const handleSave = async () => {
    try {
      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "address",
        "city",
        "postcode",
        "phone",
      ];

      for (const field of requiredFields) {
        if (!formData.billing[field as keyof typeof formData.billing]) {
          Alert.alert("Validation Error", `Please fill in billing ${field}`);
          return;
        }
        if (
          !useBillingForShipping &&
          !formData.shipping[field as keyof typeof formData.shipping]
        ) {
          Alert.alert("Validation Error", `Please fill in shipping ${field}`);
          return;
        }
      }

      // Prepare billing address
      const billing = {
        firstName: formData.billing.firstName,
        lastName: formData.billing.lastName,
        email: formData.billing.email,
        address: [formData.billing.address],
        country: formData.billing.country,
        state: formData.billing.state || "",
        city: formData.billing.city,
        postcode: formData.billing.postcode,
        phone: formData.billing.phone,
        useForShipping: useBillingForShipping,
        companyName: formData.billing.companyName || "",
      };

      // Prepare shipping address
      const shipping = useBillingForShipping
        ? { ...billing }
        : {
            firstName: formData.shipping.firstName,
            lastName: formData.shipping.lastName,
            email: formData.shipping.email,
            address: [formData.shipping.address],
            country: formData.shipping.country,
            state: formData.shipping.state || "",
            city: formData.shipping.city,
            postcode: formData.shipping.postcode,
            phone: formData.shipping.phone,
            companyName: formData.shipping.companyName || "",
          };

      console.log("🏠 Saving addresses:", { billing, shipping });

      await saveAddresses(billing, shipping);
    } catch (error: any) {
      console.error("Error saving addresses:", error);
      Alert.alert("Error", "Failed to save addresses. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Shipping Address</Text>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.billing.email}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              billing: { ...prev.billing, email: text },
            }))
          }
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="First Name *"
            value={formData.billing.firstName}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, firstName: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last Name *"
            value={formData.billing.lastName}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, lastName: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Company Name"
          value={formData.billing.companyName}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              billing: { ...prev.billing, companyName: text },
            }))
          }
          placeholderTextColor={Colors.textSecondary}
        />

        <TextInput
          style={styles.input}
          placeholder="Address *"
          value={formData.billing.address}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              billing: { ...prev.billing, address: text },
            }))
          }
          placeholderTextColor={Colors.textSecondary}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="City *"
            value={formData.billing.city}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, city: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Postcode *"
            value={formData.billing.postcode}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, postcode: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="State"
            value={formData.billing.state}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, state: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Country *"
            value={formData.billing.country}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                billing: { ...prev.billing, country: text },
              }))
            }
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Phone *"
          value={formData.billing.phone}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              billing: { ...prev.billing, phone: text },
            }))
          }
          placeholderTextColor={Colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      {/* Same as billing checkbox */}
      <View style={styles.checkboxContainer}>
        <Pressable
          style={styles.checkbox}
          onPress={() => setUseBillingForShipping(!useBillingForShipping)}
        >
          <View
            style={[
              styles.checkboxBox,
              useBillingForShipping && styles.checkboxBoxChecked,
            ]}
          >
            {useBillingForShipping && <Check size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>Use same address for billing</Text>
        </Pressable>
      </View>

      {/* Continue Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddressStep;

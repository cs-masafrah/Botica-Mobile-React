import { router } from "expo-router";
import { MapPin, Plus, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { useAddress } from "@/contexts/AddressContext";
import { useAuth } from "@/contexts/AuthContext";
import { Address } from "@/services/auth";

type AddressFormData = Omit<Address, "id"> & {
  email?: string;
  companyName?: string;
  vatId?: string;
};

export default function AddressesScreen() {
  const { isAuthenticated, isLoading: authLoading, customer } = useAuth();
  const {
    addresses,
    isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isAddingAddress,
    isUpdatingAddress,
    isDeletingAddress,
    isSettingDefault,
    refetchAddresses,
  } = useAddress();

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    zip: "",
    country: "",
    phone: "",
    companyName: "",
    email: customer?.email || "",
    vatId: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      province: "", // Leave empty, user should enter
      zip: "",
      country: "", // Leave empty, user should enter
      phone: "",
      companyName: "",
      email: customer?.email || "",
      vatId: "",
    });
    setEditingAddress(null);
    setFormError(null);
  };

  const handleAddNew = () => {
    if (customer?.email) {
      setFormData((prev) => ({ ...prev, email: customer.email }));
    }
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      address1: address.address1,
      address2: address.address2 || "",
      city: address.city,
      province: address.province || "",
      zip: address.zip,
      country: address.country,
      phone: address.phone || "",
      companyName: address.companyName || "",
      email: address.email || customer?.email || "",
      vatId: address.vatId || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(addressId);
              Alert.alert("Success", "Address deleted successfully");
              refetchAddresses();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete address",
              );
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      Alert.alert("Success", "Default address updated");
      refetchAddresses();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to set default address",
      );
    }
  };

  const handleSave = async () => {
    // Clear previous errors
    setFormError(null);

    // Validate required fields
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.address1.trim() ||
      !formData.city.trim() ||
      !formData.zip.trim() ||
      !formData.country.trim()
    ) {
      setFormError("Please fill in all required fields (*)");
      return;
    }

    // Validate country code (should be 2 characters)
    if (formData.country.length !== 2) {
      setFormError("Country must be a 2-letter code (e.g., PS for Palestine)");
      return;
    }

    // Validate state code (should be 2 characters for Palestine)
    if (
      formData.province &&
      formData.country === "PS" &&
      formData.province.length !== 2
    ) {
      setFormError(
        "For Palestine, state must be a 2-letter code (e.g., WB for West Bank)",
      );
      return;
    }

    console.log("Saving address data:", JSON.stringify(formData, null, 2));

    try {
      if (editingAddress) {
        console.log("Updating address with ID:", editingAddress.id);
        await updateAddress({
          id: editingAddress.id,
          address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address1,
            address2: formData.address2 || "",
            city: formData.city,
            province: formData.province || "",
            zip: formData.zip,
            country: formData.country,
            phone: formData.phone,
            companyName: formData.companyName,
            email: formData.email,
            vatId: formData.vatId,
          },
        });
        Alert.alert("Success", "Address updated successfully");
        setShowModal(false);
        resetForm();
        refetchAddresses();
      } else {
        console.log("Creating new address...");

        // Prepare address data with proper defaults
        const addressData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address1,
          address2: formData.address2 || "",
          city: formData.city,
          province: formData.province || "WB", // Default to WB for Palestine
          zip: formData.zip,
          country: formData.country || "PS", // Default to PS
          phone: formData.phone || "",
          email: formData.email || customer?.email || "",
          companyName: formData.companyName || "",
          vatId: formData.vatId || "",
          isDefault: false, // Default to false for new addresses
        };

        console.log(
          "Address data to send:",
          JSON.stringify(addressData, null, 2),
        );

        await addAddress(addressData);
        Alert.alert("Success", "Address added successfully");
        setShowModal(false);
        resetForm();
        refetchAddresses();
      }
    } catch (error) {
      console.error("Save address error details:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save address. Please check your information.";
      setFormError(errorMessage);
    }
  };
  const updateField = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formError) {
      setFormError(null);
    }
  };

  // Helper function to format country/state codes
  const formatCode = (value: string) => {
    return value.toUpperCase().trim();
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MapPin size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Sign in Required</Text>
        <Text style={styles.emptyText}>
          Please sign in to manage your addresses
        </Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptyText}>
              Add an address to make checkout faster
            </Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address: Address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressHeaderLeft}>
                    <MapPin size={20} color={Colors.primary} />
                    <Text style={styles.addressName}>
                      {address.firstName} {address.lastName}
                    </Text>
                  </View>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>

                <View style={styles.addressBody}>
                  {address.companyName && (
                    <Text style={styles.addressText}>
                      {address.companyName}
                    </Text>
                  )}
                  <Text style={styles.addressText}>{address.address1}</Text>
                  {address.address2 && address.address2 !== "" && (
                    <Text style={styles.addressText}>{address.address2}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {address.city}, {address.province || ""} {address.zip}
                  </Text>
                  <Text style={styles.addressText}>{address.country}</Text>
                  {address.phone && (
                    <Text style={styles.addressText}>
                      Phone: {address.phone}
                    </Text>
                  )}
                  {address.email && (
                    <Text style={styles.addressText}>
                      Email: {address.email}
                    </Text>
                  )}
                </View>

                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}
                      disabled={isSettingDefault}
                    >
                      {isSettingDefault ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                      ) : (
                        <Text style={styles.actionButtonText}>
                          Set as Default
                        </Text>
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEdit(address)}
                    disabled={isUpdatingAddress}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDelete(address.id)}
                    disabled={isDeletingAddress}
                  >
                    {isDeletingAddress ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <Trash2 size={18} color={Colors.error} />
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.addButton}
          onPress={handleAddNew}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>Add New Address</Text>
            </>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
              disabled={isAddingAddress || isUpdatingAddress}
            >
              <Text
                style={[
                  styles.modalCancel,
                  (isAddingAddress || isUpdatingAddress) && styles.disabledText,
                ]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingAddress ? "Edit Address" : "Add Address"}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isAddingAddress || isUpdatingAddress}
            >
              {isAddingAddress || isUpdatingAddress ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.modalSave,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledText,
                  ]}
                >
                  Save
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Message Display */}
            {formError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.firstName}
                onChangeText={(value) => updateField("firstName", value)}
                placeholder="John"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.lastName}
                onChangeText={(value) => updateField("lastName", value)}
                placeholder="Doe"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.companyName}
                onChangeText={(value) => updateField("companyName", value)}
                placeholder="Company Name"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.address1}
                onChangeText={(value) => updateField("address1", value)}
                placeholder="123 Main St"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.address2}
                onChangeText={(value) => updateField("address2", value)}
                placeholder="Apt 4B"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.city}
                onChangeText={(value) => updateField("city", value)}
                placeholder="Ramallah"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State/Province *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.province}
                onChangeText={(value) =>
                  updateField("province", value.toUpperCase())
                }
                placeholder="WB"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                autoCapitalize="characters"
                maxLength={2}
              />
              <Text style={styles.helperText}>
                Use 2-letter code (e.g., WB for West Bank)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ZIP/Postal Code *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.zip}
                onChangeText={(value) => updateField("zip", value)}
                placeholder="00970"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                editable={!isAddingAddress && !isUpdatingAddress}
                maxLength={10}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Country *</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.country}
                onChangeText={(value) =>
                  updateField("country", value.toUpperCase())
                }
                placeholder="PS"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                autoCapitalize="characters"
                maxLength={2}
              />
              <Text style={styles.helperText}>
                Use 2-letter country code (e.g., PS for Palestine)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.phone}
                onChangeText={(value) => updateField("phone", value)}
                placeholder="+970 59 123 4567"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>VAT ID (Tax Number)</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.vatId}
                onChangeText={(value) => updateField("vatId", value)}
                placeholder="VAT123456"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Note: Make sure to use valid country and state codes. For
                Palestine, use "PS" for country and "WB" for West Bank.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  addressList: {
    padding: 20,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  addressBody: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  addressActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledInput: {
    backgroundColor: Colors.cardBackground,
    color: Colors.textSecondary,
  },
  disabledText: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  noteContainer: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  noteText: {
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 18,
  },
});

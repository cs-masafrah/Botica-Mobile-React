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
  Switch,
} from "react-native";
import Colors from "@/constants/colors";
import { useAddress } from "@/contexts/AddressContext";
import { useAuth } from "@/contexts/AuthContext";
import { Address } from "@/services/auth";

type AddressFormData = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  vatId: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  phone: string;
  defaultAddress: boolean;
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
    companyName: "",
    firstName: "",
    lastName: "",
    email: customer?.email || "",
    vatId: "",
    address: "",
    country: "PS", // Default to Palestine
    state: "WB", // Default to West Bank
    city: "",
    postcode: "",
    phone: "",
    defaultAddress: false,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      companyName: "",
      firstName: "",
      lastName: "",
      email: customer?.email || "",
      vatId: "",
      address: "",
      country: "PS",
      state: "WB",
      city: "",
      postcode: "",
      phone: "",
      defaultAddress: false,
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
      companyName: address.companyName || "",
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      vatId: address.vatId || "",
      address: address.address,
      country: address.country,
      state: address.state,
      city: address.city,
      postcode: address.postcode,
      phone: address.phone,
      defaultAddress: address.defaultAddress,
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
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.postcode.trim() ||
      !formData.country.trim() ||
      !formData.state.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      setFormError("Please fill in all required fields (*)");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    // Validate country and state codes
    if (formData.country.length !== 2) {
      setFormError("Country must be a 2-letter code (e.g., PS for Palestine)");
      return;
    }

    if (formData.state.length !== 2) {
      setFormError("State must be a 2-letter code (e.g., WB for West Bank)");
      return;
    }

    console.log("Saving address data:", JSON.stringify(formData, null, 2));

    try {
      // Prepare the input for GraphQL
      const addressInput = {
        companyName: formData.companyName.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        vatId: formData.vatId.trim() || undefined,
        address: formData.address.trim(),
        country: formData.country.toUpperCase(),
        state: formData.state.toUpperCase(),
        city: formData.city.trim(),
        postcode: formData.postcode.trim(),
        phone: formData.phone.trim(),
        defaultAddress: formData.defaultAddress,
      };

      if (editingAddress) {
        console.log("Updating address with ID:", editingAddress.id);
        await updateAddress({
          id: editingAddress.id,
          address: addressInput,
        });
        Alert.alert("Success", "Address updated successfully");
        setShowModal(false);
        resetForm();
        refetchAddresses();
      } else {
        console.log("Creating new address...");
        await addAddress(addressInput);
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

  const updateField = <K extends keyof AddressFormData>(
    field: K,
    value: AddressFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) {
      setFormError(null);
    }
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
                  {address.defaultAddress && (
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
                  <Text style={styles.addressText}>{address.address}</Text>
                  <Text style={styles.addressText}>
                    {address.city}, {address.state} {address.postcode}
                  </Text>
                  <Text style={styles.addressText}>{address.country}</Text>
                  {address.phone && (
                    <Text style={styles.addressText}>Phone: {address.phone}</Text>
                  )}
                  <Text style={styles.addressText}>Email: {address.email}</Text>
                  {address.vatId && (
                    <Text style={styles.addressText}>VAT ID: {address.vatId}</Text>
                  )}
                </View>

                <View style={styles.addressActions}>
                  {!address.defaultAddress && (
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
            {formError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

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
                placeholder="Company Name (Optional)"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
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

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
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
              <Text style={styles.label}>VAT ID (Tax Number)</Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.vatId}
                onChangeText={(value) => updateField("vatId", value)}
                placeholder="VAT123456 (Optional)"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                ]}
                value={formData.address}
                onChangeText={(value) => updateField("address", value)}
                placeholder="Street, Building, Apartment"
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
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

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Postcode *</Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                  ]}
                  value={formData.postcode}
                  onChangeText={(value) => updateField("postcode", value)}
                  placeholder="00970"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  editable={!isAddingAddress && !isUpdatingAddress}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                  ]}
                  value={formData.country}
                  onChangeText={(value) => updateField("country", value.toUpperCase())}
                  placeholder="PS"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                  ]}
                  value={formData.state}
                  onChangeText={(value) => updateField("state", value.toUpperCase())}
                  placeholder="WB"
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone *</Text>
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

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Set as default address</Text>
              <Switch
                value={formData.defaultAddress}
                onValueChange={(value) => updateField("defaultAddress", value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={isAddingAddress || isUpdatingAddress}
              />
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Note: For Palestine, use &quot;PS&quot; for country and &quot;WB&quot; for West Bank.
                Phone number and email are required fields.
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    shadowColor: Colors.shadow,
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
    fontWeight: "700",
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "700",
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
    fontWeight: "700",
    color: Colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
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
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  noteContainer: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  noteText: {
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 18,
  },
});
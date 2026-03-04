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
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t, isRTL } = useLanguage();
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
    country: "PS",
    state: "WB",
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
    Alert.alert(t("deleteAddress"), t("deleteAddressConfirmation"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(addressId);
            Alert.alert(t("success"), t("addressDeletedSuccess"));
            refetchAddresses();
          } catch (error) {
            Alert.alert(
              t("error"),
              error instanceof Error
                ? error.message
                : t("failedToDeleteAddress"),
            );
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      Alert.alert(t("success"), t("defaultAddressUpdated"));
      refetchAddresses();
    } catch (error) {
      Alert.alert(
        t("error"),
        error instanceof Error ? error.message : t("failedToSetDefaultAddress"),
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
      setFormError(t("fillRequiredFields"));
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError(t("validEmailRequired"));
      return;
    }

    // Validate country and state codes
    if (formData.country.length !== 2) {
      setFormError(t("countryCodeError"));
      return;
    }

    if (formData.state.length !== 2) {
      setFormError(t("stateCodeError"));
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
        Alert.alert(t("success"), t("addressUpdatedSuccess"));
        setShowModal(false);
        resetForm();
        refetchAddresses();
      } else {
        console.log("Creating new address...");
        await addAddress(addressInput);
        Alert.alert(t("success"), t("addressAddedSuccess"));
        setShowModal(false);
        resetForm();
        refetchAddresses();
      }
    } catch (error) {
      console.error("Save address error details:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("failedToSaveAddress");
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
      <View
        style={[
          styles.container,
          styles.centerContent,
          isRTL && styles.containerRTL,
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          isRTL && styles.containerRTL,
        ]}
      >
        <MapPin size={64} color={Colors.textSecondary} />
        <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
          {t("signInRequired")}
        </Text>
        <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
          {t("signInToManageAddresses")}
        </Text>
        <Pressable
          style={[styles.loginButton, isRTL && styles.loginButtonRTL]}
          onPress={() => router.push("/login")}
        >
          <Text
            style={[styles.loginButtonText, isRTL && styles.loginButtonTextRTL]}
          >
            {t("signIn")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : addresses.length === 0 ? (
          <View
            style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}
          >
            <MapPin size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleRTL]}>
              {t("noAddresses")}
            </Text>
            <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
              {t("addAddressToCheckout")}
            </Text>
          </View>
        ) : (
          <View style={[styles.addressList, isRTL && styles.addressListRTL]}>
            {addresses.map((address: Address) => (
              <View
                key={address.id}
                style={[styles.addressCard, isRTL && styles.addressCardRTL]}
              >
                <View
                  style={[
                    styles.addressHeader,
                    isRTL && styles.addressHeaderRTL,
                  ]}
                >
                  <View
                    style={[
                      styles.addressHeaderLeft,
                      isRTL && styles.addressHeaderLeftRTL,
                    ]}
                  >
                    <MapPin size={20} color={Colors.primary} />
                    <Text
                      style={[
                        styles.addressName,
                        isRTL && styles.addressNameRTL,
                      ]}
                    >
                      {address.firstName} {address.lastName}
                    </Text>
                  </View>
                  {address.defaultAddress && (
                    <View
                      style={[
                        styles.defaultBadge,
                        isRTL && styles.defaultBadgeRTL,
                      ]}
                    >
                      <Text style={styles.defaultBadgeText}>
                        {t("default")}
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={[styles.addressBody, isRTL && styles.addressBodyRTL]}
                >
                  {address.companyName && (
                    <Text
                      style={[
                        styles.addressText,
                        isRTL && styles.addressTextRTL,
                      ]}
                    >
                      {address.companyName}
                    </Text>
                  )}
                  <Text
                    style={[styles.addressText, isRTL && styles.addressTextRTL]}
                  >
                    {address.address}
                  </Text>
                  <Text
                    style={[styles.addressText, isRTL && styles.addressTextRTL]}
                  >
                    {address.city}, {address.state} {address.postcode}
                  </Text>
                  <Text
                    style={[styles.addressText, isRTL && styles.addressTextRTL]}
                  >
                    {address.country}
                  </Text>
                  {address.phone && (
                    <Text
                      style={[
                        styles.addressText,
                        isRTL && styles.addressTextRTL,
                      ]}
                    >
                      {t("phone")}: {address.phone}
                    </Text>
                  )}
                  <Text
                    style={[styles.addressText, isRTL && styles.addressTextRTL]}
                  >
                    {t("email")}: {address.email}
                  </Text>
                </View>

                <View
                  style={[
                    styles.addressActions,
                    isRTL && styles.addressActionsRTL,
                  ]}
                >
                  {!address.defaultAddress && (
                    <Pressable
                      style={[
                        styles.actionButton,
                        isRTL && styles.actionButtonRTL,
                      ]}
                      onPress={() => handleSetDefault(address.id)}
                      disabled={isSettingDefault}
                    >
                      {isSettingDefault ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.actionButtonText,
                            isRTL && styles.actionButtonTextRTL,
                          ]}
                        >
                          {t("setAsDefault")}
                        </Text>
                      )}
                    </Pressable>
                  )}
                  <Pressable
                    style={[
                      styles.actionButton,
                      isRTL && styles.actionButtonRTL,
                    ]}
                    onPress={() => handleEdit(address)}
                    disabled={isUpdatingAddress}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        isRTL && styles.actionButtonTextRTL,
                      ]}
                    >
                      {t("edit")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.deleteButton,
                      isRTL && styles.deleteButtonRTL,
                    ]}
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

      <View style={[styles.footer, isRTL && styles.footerRTL]}>
        <Pressable
          style={[styles.addButton, isRTL && styles.addButtonRTL]}
          onPress={handleAddNew}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Plus size={20} color={Colors.white} />
              <Text
                style={[styles.addButtonText, isRTL && styles.addButtonTextRTL]}
              >
                {t("addNewAddress")}
              </Text>
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
          style={[styles.modalContainer, isRTL && styles.modalContainerRTL]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
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
                  isRTL && styles.modalCancelRTL,
                ]}
              >
                {t("cancel")}
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
              {editingAddress ? t("editAddress") : t("addAddress")}
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
                    isRTL && styles.modalSaveRTL,
                  ]}
                >
                  {t("save")}
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={[styles.modalContent, isRTL && styles.modalContentRTL]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {formError && (
              <View
                style={[
                  styles.errorContainer,
                  isRTL && styles.errorContainerRTL,
                ]}
              >
                <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
                  {formError}
                </Text>
              </View>
            )}

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {t("companyName")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                  isRTL && styles.inputRTL,
                ]}
                value={formData.companyName}
                onChangeText={(value) => updateField("companyName", value)}
                placeholder={t("companyNameOptional")}
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View style={[styles.inputRow, isRTL && styles.inputRowRTL]}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("firstName")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.firstName}
                  onChangeText={(value) => updateField("firstName", value)}
                  placeholder={t("firstNamePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="words"
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginLeft: isRTL ? 0 : 8,
                    marginRight: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("lastName")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.lastName}
                  onChangeText={(value) => updateField("lastName", value)}
                  placeholder={t("lastNamePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {t("email")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                  isRTL && styles.inputRTL,
                ]}
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder={t("emailPlaceholder")}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {t("address")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                  isRTL && styles.inputRTL,
                ]}
                value={formData.address}
                onChangeText={(value) => updateField("address", value)}
                placeholder={t("addressPlaceholder")}
                placeholderTextColor={Colors.textSecondary}
                editable={!isAddingAddress && !isUpdatingAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={[styles.inputRow, isRTL && styles.inputRowRTL]}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("city")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.city}
                  onChangeText={(value) => updateField("city", value)}
                  placeholder={t("cityPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginLeft: isRTL ? 0 : 8,
                    marginRight: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("postcode")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.postcode}
                  onChangeText={(value) => updateField("postcode", value)}
                  placeholder={t("postcodePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  editable={!isAddingAddress && !isUpdatingAddress}
                />
              </View>
            </View>

            <View style={[styles.inputRow, isRTL && styles.inputRowRTL]}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("country")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.country}
                  onChangeText={(value) =>
                    updateField("country", value.toUpperCase())
                  }
                  placeholder={t("countryPlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  {
                    flex: 1,
                    marginLeft: isRTL ? 0 : 8,
                    marginRight: isRTL ? 8 : 0,
                  },
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <Text style={[styles.label, isRTL && styles.labelRTL]}>
                  {t("state")} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    (isAddingAddress || isUpdatingAddress) &&
                      styles.disabledInput,
                    isRTL && styles.inputRTL,
                  ]}
                  value={formData.state}
                  onChangeText={(value) =>
                    updateField("state", value.toUpperCase())
                  }
                  placeholder={t("statePlaceholder")}
                  placeholderTextColor={Colors.textSecondary}
                  editable={!isAddingAddress && !isUpdatingAddress}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {t("phone")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  (isAddingAddress || isUpdatingAddress) &&
                    styles.disabledInput,
                  isRTL && styles.inputRTL,
                ]}
                value={formData.phone}
                onChangeText={(value) => updateField("phone", value)}
                placeholder={t("phonePlaceholder")}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                editable={!isAddingAddress && !isUpdatingAddress}
              />
            </View>

            <View
              style={[
                styles.switchContainer,
                isRTL && styles.switchContainerRTL,
              ]}
            >
              <Text style={[styles.label, isRTL && styles.labelRTL]}>
                {t("setAsDefaultAddress")}
              </Text>
              <Switch
                value={formData.defaultAddress}
                onValueChange={(value) => updateField("defaultAddress", value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                disabled={isAddingAddress || isUpdatingAddress}
              />
            </View>

            <View
              style={[styles.noteContainer, isRTL && styles.noteContainerRTL]}
            >
              <Text style={[styles.noteText, isRTL && styles.noteTextRTL]}>
                {t("addressNote")}
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
  containerRTL: {
    direction: "rtl",
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
  emptyContainerRTL: {},
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyTitleRTL: {
    textAlign: "right",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyTextRTL: {
    textAlign: "right",
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonRTL: {},
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  loginButtonTextRTL: {
    textAlign: "right",
  },
  addressList: {
    padding: 20,
  },
  addressListRTL: {},
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
  addressCardRTL: {},
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressHeaderRTL: {
    // flexDirection: "row-reverse",
  },
  addressHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressHeaderLeftRTL: {
    // flexDirection: "row-reverse",
  },
  addressName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  addressNameRTL: {
    textAlign: "left",
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeRTL: {},
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
  addressBody: {
    marginBottom: 16,
  },
  addressBodyRTL: {
    alignItems: "flex-start",
  },
  addressText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  addressTextRTL: {
    textAlign: "left",
    alignSelf: "flex-start",
  },
  addressActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  addressActionsRTL: {
    // flexDirection: "row-reverse",
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
  actionButtonRTL: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  actionButtonTextRTL: {
    textAlign: "right",
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonRTL: {},
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerRTL: {},
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addButtonRTL: {
    flexDirection: "row-reverse",
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  addButtonTextRTL: {
    textAlign: "right",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContainerRTL: {
    direction: "rtl",
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
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalCancelRTL: {
    textAlign: "right",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  modalTitleRTL: {
    textAlign: "right",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  modalSaveRTL: {
    textAlign: "right",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalContentRTL: {},
  inputRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputRowRTL: {
    flexDirection: "row-reverse",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputContainerRTL: {},
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    marginRight: 10,
  },
  labelRTL: {
    textAlign: "left",
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
  inputRTL: {
    textAlign: "right",
    marginLeft: 10,
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
  errorContainerRTL: {},
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  errorTextRTL: {
    textAlign: "right",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchContainerRTL: {
    // flexDirection: "row-reverse",
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
  noteContainerRTL: {
    paddingRight: 10,
    marginRight: 12,
  },
  noteText: {
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 18,
  },
  noteTextRTL: {
    textAlign: "left",
  },
});

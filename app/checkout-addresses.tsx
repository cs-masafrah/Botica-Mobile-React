import { router } from "expo-router";
import {
  MapPin,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
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
import { useCheckout } from "@/contexts/CheckoutContext";

type AddressFormData = {
  firstName: string;
  lastName: string;
  email: string;
  address: string[];
  country: string;
  state: string;
  city: string;
  postcode: string;
  phone: string;
  companyName?: string;
  useForShipping: boolean;
  defaultAddress: boolean;
};

// Palestinian cities and states data
const PALESTINIAN_LOCATIONS = {
  states: ["West Bank", "Gaza Strip", "Jerusalem"],
  cities: {
    "West Bank": [
      "Ramallah",
      "Bethlehem",
      "Hebron",
      "Nablus",
      "Jenin",
      "Jericho",
      "Tulkarm",
      "Qalqilya",
    ],
    "Gaza Strip": [
      "Gaza City",
      "Khan Yunis",
      "Rafah",
      "Jabalia",
      "Deir al-Balah",
    ],
    Jerusalem: ["East Jerusalem", "Old City"],
  },
  postalCodes: {
    Ramallah: "00972",
    Bethlehem: "00971",
    Hebron: "00970",
    Nablus: "00973",
    "Gaza City": "00974",
    Jerusalem: "00975",
  },
};

export default function CheckoutAddressesScreen() {
  const { isAuthenticated, isLoading: authLoading, customer } = useAuth();
  const { addresses, isLoading: addressesLoading } = useAddress();
  const { saveAddresses, isLoading: checkoutLoading } = useCheckout();

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [billingFormData, setBillingFormData] = useState<AddressFormData>({
    firstName: "",
    lastName: "",
    email: customer?.email || "",
    address: [""],
    country: "Palestine",
    state: "West Bank",
    city: "Ramallah",
    postcode: "00972",
    phone: "",
    companyName: "",
    useForShipping: true,
    defaultAddress: false,
  });

  const [shippingFormData, setShippingFormData] = useState<AddressFormData>({
    firstName: "",
    lastName: "",
    email: customer?.email || "",
    address: [""],
    country: "Palestine",
    state: "West Bank",
    city: "Ramallah",
    postcode: "00972",
    phone: "",
    companyName: "",
    useForShipping: true,
    defaultAddress: false,
  });

  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | null
  >(null);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<
    string | null
  >(null);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedState, setSelectedState] = useState("West Bank");
  const [selectedCity, setSelectedCity] = useState("Ramallah");
  const [mode, setMode] = useState<"existing" | "new">("existing");

  // Auto-select default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedBillingAddressId) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedBillingAddressId(defaultAddress.id);
        if (useSameAddress) {
          setSelectedShippingAddressId(defaultAddress.id);
        }
      }
    }
  }, [addresses]);

  const resetForms = () => {
    setBillingFormData({
      firstName: "",
      lastName: "",
      email: customer?.email || "",
      address: [""],
      country: "Palestine",
      state: "West Bank",
      city: "Ramallah",
      postcode: "00972",
      phone: "",
      companyName: "",
      useForShipping: false,
      defaultAddress: false,
    });
    setShippingFormData({
      firstName: "",
      lastName: "",
      email: customer?.email || "",
      address: [""],
      country: "Palestine",
      state: "West Bank",
      city: "Ramallah",
      postcode: "00972",
      phone: "",
      companyName: "",
      useForShipping: true,
      defaultAddress: false,
    });
    setEditingAddress(null);
  };

  const handleAddNewAddress = () => {
    setMode("new");
    resetForms();
    setShowModal(true);
  };

  const handleSelectExistingAddress = () => {
    setMode("existing");
    setShowModal(false);
  };

  const handleSaveCheckoutAddresses = async () => {
    try {
      if (mode === "existing") {
        // Use existing addresses
        const billingAddress = addresses.find(
          (addr) => addr.id === selectedBillingAddressId,
        );
        const shippingAddress = useSameAddress
          ? billingAddress
          : addresses.find((addr) => addr.id === selectedShippingAddressId);

        if (!billingAddress) {
          Alert.alert("Error", "Please select a billing address");
          return;
        }

        if (!useSameAddress && !shippingAddress) {
          Alert.alert("Error", "Please select a shipping address");
          return;
        }

        // Map billing address
        const billing = {
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          email: billingAddress.email || customer?.email || "",
          address: [billingAddress.address1],
          country: billingAddress.country || "Palestine",
          state: billingAddress.province || "West Bank",
          city: billingAddress.city,
          postcode: billingAddress.zip,
          phone: billingAddress.phone || "",
          useForShipping: false,
          defaultAddress: billingAddress.isDefault || false,
          companyName: billingAddress.companyName || "",
        };

        // Map shipping address
        const shipping = useSameAddress
          ? {
              ...billing,
              useForShipping: true,
              defaultAddress: billingAddress.isDefault || false,
            }
          : {
              firstName: shippingAddress!.firstName,
              lastName: shippingAddress!.lastName,
              email: shippingAddress!.email || customer?.email || "",
              address: [shippingAddress!.address1],
              country: shippingAddress!.country || "Palestine",
              state: shippingAddress!.province || "West Bank",
              city: shippingAddress!.city,
              postcode: shippingAddress!.zip,
              phone: shippingAddress!.phone || "",
              useForShipping: true,
              defaultAddress: shippingAddress!.isDefault || false,
              companyName: shippingAddress!.companyName || "",
            };

        await saveAddresses(billing, shipping);
      } else {
        // Use new addresses from form
        if (
          !billingFormData.firstName ||
          !billingFormData.lastName ||
          !billingFormData.address[0] ||
          !billingFormData.city ||
          !billingFormData.postcode ||
          !billingFormData.country
        ) {
          Alert.alert("Error", "Please fill in all required billing fields");
          return;
        }

        if (
          !useSameAddress &&
          (!shippingFormData.firstName ||
            !shippingFormData.lastName ||
            !shippingFormData.address[0] ||
            !shippingFormData.city ||
            !shippingFormData.postcode ||
            !shippingFormData.country)
        ) {
          Alert.alert("Error", "Please fill in all required shipping fields");
          return;
        }

        const billing = {
          ...billingFormData,
          useForShipping: false,
        };

        const shipping = useSameAddress
          ? {
              ...billingFormData,
              useForShipping: true,
            }
          : {
              ...shippingFormData,
              useForShipping: true,
            };

        await saveAddresses(billing, shipping);
      }

      Alert.alert("Success", "Addresses saved successfully");
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save addresses",
      );
    }
  };

  const updateBillingField = (
    field: keyof AddressFormData,
    value: string | boolean | string[],
  ) => {
    setBillingFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateShippingField = (
    field: keyof AddressFormData,
    value: string | boolean | string[],
  ) => {
    setShippingFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setBillingFormData((prev) => ({
      ...prev,
      state,
      city:
        PALESTINIAN_LOCATIONS.cities[
          state as keyof typeof PALESTINIAN_LOCATIONS.cities
        ]?.[0] || "",
      postcode:
        PALESTINIAN_LOCATIONS.postalCodes[
          PALESTINIAN_LOCATIONS.cities[
            state as keyof typeof PALESTINIAN_LOCATIONS.cities
          ]?.[0] as keyof typeof PALESTINIAN_LOCATIONS.postalCodes
        ] || "",
    }));
    if (!useSameAddress) {
      setShippingFormData((prev) => ({
        ...prev,
        state,
        city:
          PALESTINIAN_LOCATIONS.cities[
            state as keyof typeof PALESTINIAN_LOCATIONS.cities
          ]?.[0] || "",
        postcode:
          PALESTINIAN_LOCATIONS.postalCodes[
            PALESTINIAN_LOCATIONS.cities[
              state as keyof typeof PALESTINIAN_LOCATIONS.cities
            ]?.[0] as keyof typeof PALESTINIAN_LOCATIONS.postalCodes
          ] || "",
      }));
    }
    setShowStatePicker(false);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setBillingFormData((prev) => ({
      ...prev,
      city,
      postcode:
        PALESTINIAN_LOCATIONS.postalCodes[
          city as keyof typeof PALESTINIAN_LOCATIONS.postalCodes
        ] || "",
    }));
    if (!useSameAddress) {
      setShippingFormData((prev) => ({
        ...prev,
        city,
        postcode:
          PALESTINIAN_LOCATIONS.postalCodes[
            city as keyof typeof PALESTINIAN_LOCATIONS.postalCodes
          ] || "",
      }));
    }
    setShowCityPicker(false);
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
        {/* Mode Selection */}
        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              mode === "existing" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("existing")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "existing" && styles.modeButtonTextActive,
              ]}
            >
              Select Existing Address
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              mode === "new" && styles.modeButtonActive,
            ]}
            onPress={() => setMode("new")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "new" && styles.modeButtonTextActive,
              ]}
            >
              Add New Address
            </Text>
          </Pressable>
        </View>

        {mode === "existing" ? (
          <>
            {addressesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Addresses</Text>
                <Text style={styles.emptyText}>
                  You don't have any saved addresses
                </Text>
                <Pressable
                  style={styles.addNewButton}
                  onPress={handleAddNewAddress}
                >
                  <Plus size={20} color={Colors.white} />
                  <Text style={styles.addNewButtonText}>Add New Address</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Billing Address Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Billing Address</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select an address for billing
                  </Text>

                  {addresses.map((address: Address) => (
                    <Pressable
                      key={`billing-${address.id}`}
                      style={[
                        styles.addressCard,
                        selectedBillingAddressId === address.id &&
                          styles.selectedCard,
                      ]}
                      onPress={() => {
                        setSelectedBillingAddressId(address.id);
                        if (useSameAddress) {
                          setSelectedShippingAddressId(address.id);
                        }
                      }}
                    >
                      <View style={styles.addressHeader}>
                        <View style={styles.addressHeaderLeft}>
                          <MapPin size={20} color={Colors.primary} />
                          <Text style={styles.addressName}>
                            {address.firstName} {address.lastName}
                          </Text>
                        </View>
                        {selectedBillingAddressId === address.id && (
                          <View style={styles.selectedBadge}>
                            <Check size={16} color={Colors.white} />
                          </View>
                        )}
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
                        <Text style={styles.addressText}>
                          {address.address1}
                        </Text>
                        {address.address2 && address.address2 !== "" && (
                          <Text style={styles.addressText}>
                            {address.address2}
                          </Text>
                        )}
                        <Text style={styles.addressText}>
                          {address.city}, {address.province || ""} {address.zip}
                        </Text>
                        <Text style={styles.addressText}>
                          {address.country}
                        </Text>
                        {address.phone && (
                          <Text style={styles.addressText}>
                            Phone: {address.phone}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* Use Same Address Toggle */}
                <View style={styles.sameAddressContainer}>
                  <Pressable
                    style={styles.checkboxRow}
                    onPress={() => {
                      const newValue = !useSameAddress;
                      setUseSameAddress(newValue);
                      if (newValue && selectedBillingAddressId) {
                        setSelectedShippingAddressId(selectedBillingAddressId);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        useSameAddress && styles.checkboxChecked,
                      ]}
                    >
                      {useSameAddress && (
                        <Check size={10} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Use same address for shipping
                    </Text>
                  </Pressable>
                </View>

                {/* Shipping Address Selection (only show if not using same address) */}
                {!useSameAddress && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Address</Text>
                    <Text style={styles.sectionSubtitle}>
                      Select a different address for shipping
                    </Text>

                    {addresses.map((address: Address) => (
                      <Pressable
                        key={`shipping-${address.id}`}
                        style={[
                          styles.addressCard,
                          selectedShippingAddressId === address.id &&
                            styles.selectedCard,
                        ]}
                        onPress={() => setSelectedShippingAddressId(address.id)}
                      >
                        <View style={styles.addressHeader}>
                          <View style={styles.addressHeaderLeft}>
                            <MapPin size={20} color={Colors.primary} />
                            <Text style={styles.addressName}>
                              {address.firstName} {address.lastName}
                            </Text>
                          </View>
                          {selectedShippingAddressId === address.id && (
                            <View style={styles.selectedBadge}>
                              <Check size={16} color={Colors.white} />
                            </View>
                          )}
                          {address.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.addressBody}>
                          {address.companyName && (
                            <Text style={styles.addressText}>
                              {address.companyName}
                            </Text>
                          )}
                          <Text style={styles.addressText}>
                            {address.address1}
                          </Text>
                          {address.address2 && address.address2 !== "" && (
                            <Text style={styles.addressText}>
                              {address.address2}
                            </Text>
                          )}
                          <Text style={styles.addressText}>
                            {address.city}, {address.province || ""}{" "}
                            {address.zip}
                          </Text>
                          <Text style={styles.addressText}>
                            {address.country}
                          </Text>
                          {address.phone && (
                            <Text style={styles.addressText}>
                              Phone: {address.phone}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          /* New Address Form Mode */
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Billing Address</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.firstName}
                  onChangeText={(value) =>
                    updateBillingField("firstName", value)
                  }
                  placeholder="John"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.lastName}
                  onChangeText={(value) =>
                    updateBillingField("lastName", value)
                  }
                  placeholder="Doe"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.email}
                  onChangeText={(value) => updateBillingField("email", value)}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.address[0]}
                  onChangeText={(value) =>
                    updateBillingField("address", [value])
                  }
                  placeholder="123 Main Street"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>State *</Text>
                <Pressable
                  style={styles.pickerInput}
                  onPress={() => setShowStatePicker(true)}
                >
                  <Text style={styles.pickerText}>{billingFormData.state}</Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>City *</Text>
                <Pressable
                  style={styles.pickerInput}
                  onPress={() => setShowCityPicker(true)}
                >
                  <Text style={styles.pickerText}>{billingFormData.city}</Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Postal Code *</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.postcode}
                  onChangeText={(value) =>
                    updateBillingField("postcode", value)
                  }
                  placeholder="00972"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.phone}
                  onChangeText={(value) => updateBillingField("phone", value)}
                  placeholder="+970 59 123 4567"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  value={billingFormData.companyName}
                  onChangeText={(value) =>
                    updateBillingField("companyName", value)
                  }
                  placeholder="Company Name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Use Same Address Toggle for New Address */}
            <View style={styles.sameAddressContainer}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setUseSameAddress(!useSameAddress)}
              >
                <View
                  style={[
                    styles.checkbox,
                    useSameAddress && styles.checkboxChecked,
                  ]}
                >
                  {useSameAddress && <Check size={10} color={Colors.white} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Use same address for shipping
                </Text>
              </Pressable>
            </View>

            {/* Shipping Address Form (only show if not using same address) */}
            {!useSameAddress && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shipping Address</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.firstName}
                    onChangeText={(value) =>
                      updateShippingField("firstName", value)
                    }
                    placeholder="John"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.lastName}
                    onChangeText={(value) =>
                      updateShippingField("lastName", value)
                    }
                    placeholder="Doe"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.email}
                    onChangeText={(value) =>
                      updateShippingField("email", value)
                    }
                    placeholder="email@example.com"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.address[0]}
                    onChangeText={(value) =>
                      updateShippingField("address", [value])
                    }
                    placeholder="123 Main Street"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>State *</Text>
                  <Pressable
                    style={styles.pickerInput}
                    onPress={() => setShowStatePicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {shippingFormData.state}
                    </Text>
                    <ChevronDown size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>City *</Text>
                  <Pressable
                    style={styles.pickerInput}
                    onPress={() => setShowCityPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {shippingFormData.city}
                    </Text>
                    <ChevronDown size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Postal Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.postcode}
                    onChangeText={(value) =>
                      updateShippingField("postcode", value)
                    }
                    placeholder="00972"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.phone}
                    onChangeText={(value) =>
                      updateShippingField("phone", value)
                    }
                    placeholder="+970 59 123 4567"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    value={shippingFormData.companyName}
                    onChangeText={(value) =>
                      updateShippingField("companyName", value)
                    }
                    placeholder="Company Name"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, checkoutLoading && styles.buttonDisabled]}
          onPress={handleSaveCheckoutAddresses}
          disabled={
            checkoutLoading ||
            (mode === "existing" && !selectedBillingAddressId)
          }
        >
          {checkoutLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Addresses & Continue</Text>
          )}
        </Pressable>

        {mode === "existing" && addresses.length > 0 && (
          <Pressable style={styles.addButton} onPress={handleAddNewAddress}>
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add New Address Instead</Text>
          </Pressable>
        )}
      </View>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} transparent={true} animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setShowStatePicker(false)}>
              <X size={24} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.pickerTitle}>Select State</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.pickerList}>
            {PALESTINIAN_LOCATIONS.states.map((state) => (
              <Pressable
                key={state}
                style={styles.pickerItem}
                onPress={() => handleStateSelect(state)}
              >
                <Text style={styles.pickerItemText}>{state}</Text>
                {selectedState === state && (
                  <Check size={20} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} transparent={true} animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setShowCityPicker(false)}>
              <X size={24} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.pickerTitle}>Select City</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.pickerList}>
            {PALESTINIAN_LOCATIONS.cities[
              selectedState as keyof typeof PALESTINIAN_LOCATIONS.cities
            ]?.map((city) => (
              <Pressable
                key={city}
                style={styles.pickerItem}
                onPress={() => handleCitySelect(city)}
              >
                <Text style={styles.pickerItemText}>{city}</Text>
                {selectedCity === city && (
                  <Check size={20} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
    marginBottom: 24,
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
  modeSelector: {
    flexDirection: "row",
    margin: 20,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modeButtonTextActive: {
    color: Colors.white,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
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
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
  addressBody: {
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sameAddressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  addButton: {
    backgroundColor: Colors.secondary,
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
  addNewButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
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
  pickerInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerModal: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  pickerList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text,
  },
});

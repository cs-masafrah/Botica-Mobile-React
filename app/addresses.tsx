import { router } from 'expo-router';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
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
} from 'react-native';
import Colors from '@/constants/colors';
import { useAddress } from '@/contexts/AddressContext';
import { useAuth } from '@/contexts/AuthContext';
import { Address } from '@/services/auth';

type AddressFormData = Omit<Address, 'id'>;

export default function AddressesScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
  } = useAddress();

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    zip: '',
    country: '',
    phone: '',
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      province: '',
      zip: '',
      country: '',
      phone: '',
    });
    setEditingAddress(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
    });
    setShowModal(true);
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(addressId);
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to set default address');
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.address1.trim() || 
        !formData.city.trim() || !formData.zip.trim() || !formData.country.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress({ id: editingAddress.id, address: formData });
        Alert.alert('Success', 'Address updated successfully');
      } else {
        await addAddress(formData);
        Alert.alert('Success', 'Address added successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save address');
    }
  };

  const updateField = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <Text style={styles.emptyText}>Please sign in to manage your addresses</Text>
        <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
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
            <Text style={styles.emptyText}>Add an address to make checkout faster</Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address: any) => (
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
                  <Text style={styles.addressText}>{address.address1}</Text>
                  {address.address2 && (
                    <Text style={styles.addressText}>{address.address2}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {address.city}, {address.province} {address.zip}
                  </Text>
                  <Text style={styles.addressText}>{address.country}</Text>
                  {address.phone && (
                    <Text style={styles.addressText}>{address.phone}</Text>
                  )}
                </View>

                <View style={styles.addressActions}>
                  {!address.isDefault && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}
                      disabled={isSettingDefault}
                    >
                      <Text style={styles.actionButtonText}>Set as Default</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEdit(address)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDelete(address.id)}
                    disabled={isDeletingAddress}
                  >
                    <Trash2 size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.addButton} onPress={handleAddNew}>
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </Pressable>
      </View>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => {
              setShowModal(false);
              resetForm();
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </Text>
            <Pressable onPress={handleSave} disabled={isAddingAddress || isUpdatingAddress}>
              {isAddingAddress || isUpdatingAddress ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                placeholder="John"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                placeholder="Doe"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={formData.address1}
                onChangeText={(value) => updateField('address1', value)}
                placeholder="123 Main St"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={formData.address2}
                onChangeText={(value) => updateField('address2', value)}
                placeholder="Apt 4B"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(value) => updateField('city', value)}
                placeholder="New York"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={styles.input}
                value={formData.province}
                onChangeText={(value) => updateField('province', value)}
                placeholder="NY"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ZIP/Postal Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.zip}
                onChangeText={(value) => updateField('zip', value)}
                placeholder="10001"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Country *</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(value) => updateField('country', value)}
                placeholder="United States"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    fontWeight: '700' as const,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressName: {
    fontSize: 18,
    fontWeight: '700' as const,
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
    fontWeight: '700' as const,
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
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
});

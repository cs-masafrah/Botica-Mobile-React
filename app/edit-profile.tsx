import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const { customer, updateProfile, updateProfileLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    gender: customer?.gender || '',
    dateOfBirth: customer?.dateOfBirth || '',

    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',

    newsletterSubscriber: false,
  });

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (
        formData.newPassword &&
        formData.newPassword !== formData.newPasswordConfirmation
      ) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        phone: formData.phone || null,

        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation:
          formData.newPasswordConfirmation,

        newsletterSubscriber: formData.newsletterSubscriber,
        image: null,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/** First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(v) => updateField('firstName', v)}
            />
          </View>

          {/** Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(v) => updateField('lastName', v)}
            />
          </View>

          {/** Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(v) => updateField('email', v)}
            />
          </View>

          {/** Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
            />
          </View>

          {/** Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              placeholder="MALE / FEMALE / OTHER"
              value={formData.gender}
              onChangeText={(v) => updateField('gender', v)}
            />
          </View>

          {/** DOB */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.dateOfBirth}
              onChangeText={(v) => updateField('dateOfBirth', v)}
            />
          </View>

          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={formData.currentPassword}
              onChangeText={(v) => updateField('currentPassword', v)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={formData.newPassword}
              onChangeText={(v) => updateField('newPassword', v)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={formData.newPasswordConfirmation}
              onChangeText={(v) =>
                updateField('newPasswordConfirmation', v)
              }
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Newsletter Subscription</Text>
            <Switch
              value={formData.newsletterSubscriber}
              onValueChange={(v) =>
                updateField('newsletterSubscriber', v)
              }
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, updateProfileLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={updateProfileLoading}
        >
          {updateProfileLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  content: { flex: 1 },
  section: { padding: 20, backgroundColor: Colors.white, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footer: { padding: 20, backgroundColor: Colors.white },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
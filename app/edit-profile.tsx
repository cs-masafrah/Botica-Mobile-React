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
    phone: customer?.phone || '',
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (phone: string): string | null => {
    if (!phone || phone.trim() === '') return null;
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 0) return null;
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('1') && cleaned.length > 11) {
      return `+${cleaned.substring(0, 11)}`;
    }
    
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  };

  const handleSave = async () => {
    try {
      const updates: any = {};
      
      if (formData.firstName !== customer?.firstName) {
        updates.firstName = formData.firstName;
      }
      if (formData.lastName !== customer?.lastName) {
        updates.lastName = formData.lastName;
      }
      if (formData.phone !== customer?.phone) {
        const formattedPhone = formatPhoneNumber(formData.phone);
        updates.phone = formattedPhone;
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert('No Changes', 'No changes to save');
        return;
      }

      await updateProfile(updates);
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              placeholder="John"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              placeholder="Doe"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+1 (555) 123-4567 or 555-123-4567"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
            <Text style={styles.note}>Include country code or use US 10-digit format</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={customer?.email}
              editable={false}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.note}>Email cannot be changed</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: Colors.white,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
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
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  note: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});

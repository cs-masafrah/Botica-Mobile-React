import { router } from "expo-router";
import { ArrowLeft, Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  StatusBar,
} from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EditProfileScreen() {
  const { customer, updateProfile, updateProfileLoading } = useAuth();
  const { t, isRTL } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    gender: customer?.gender || "",
    dateOfBirth: customer?.dateOfBirth || "",

    currentPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",

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
        Alert.alert(t("error"), t("passwordsDoNotMatch"));
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
        newPasswordConfirmation: formData.newPasswordConfirmation,

        newsletterSubscriber: formData.newsletterSubscriber,
        image: null,
      });

      Alert.alert(t("success"), t("profileUpdatedSuccess"), [
        { text: t("ok"), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        t("updateFailed"),
        error instanceof Error ? error.message : t("somethingWentWrong"),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isRTL && styles.containerRTL]}
      behavior="padding"
    >
      {/* Uncomment if you want header */}
      {/* <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Pressable style={[styles.backButton, isRTL && styles.backButtonRTL]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} style={isRTL && { transform: [{ scaleX: -1 }] }} />
        </Pressable>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {t('editProfile')}
        </Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, isRTL && styles.sectionRTL]}>
          <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
            {t("personalInformation")}
          </Text>

          {/** First Name */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("firstName")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={formData.firstName}
              onChangeText={(v) => updateField("firstName", v)}
              placeholder={t("enterFirstName")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/** Last Name */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("lastName")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={formData.lastName}
              onChangeText={(v) => updateField("lastName", v)}
              placeholder={t("enterLastName")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/** Email */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("email")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={formData.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(v) => updateField("email", v)}
              placeholder={t("enterEmail")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/** Phone */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("phone")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(v) => updateField("phone", v)}
              placeholder={t("enterPhone")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/** Gender */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("gender")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("genderPlaceholder")}
              value={formData.gender}
              onChangeText={(v) => updateField("gender", v)}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/** DOB */}
          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("dateOfBirth")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("dobPlaceholder")}
              value={formData.dateOfBirth}
              onChangeText={(v) => updateField("dateOfBirth", v)}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <Text
            style={[
              styles.sectionTitle,
              styles.securityTitle,
              isRTL && styles.sectionTitleRTL,
            ]}
          >
            {t("security")}
          </Text>

          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("currentPassword")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              secureTextEntry
              value={formData.currentPassword}
              onChangeText={(v) => updateField("currentPassword", v)}
              placeholder={t("enterCurrentPassword")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("newPassword")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              secureTextEntry
              value={formData.newPassword}
              onChangeText={(v) => updateField("newPassword", v)}
              placeholder={t("enterNewPassword")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View
            style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
          >
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("confirmNewPassword")}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              secureTextEntry
              value={formData.newPasswordConfirmation}
              onChangeText={(v) => updateField("newPasswordConfirmation", v)}
              placeholder={t("enterConfirmPassword")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={[styles.switchRow, isRTL && styles.switchRowRTL]}>
            <Text style={[styles.label, isRTL && styles.labelRTL]}>
              {t("newsletterSubscription")}
            </Text>
            <Switch
              value={formData.newsletterSubscriber}
              onValueChange={(v) => updateField("newsletterSubscriber", v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, isRTL && styles.footerRTL]}>
        <Pressable
          style={[
            styles.saveButton,
            updateProfileLoading && styles.saveButtonDisabled,
            isRTL && styles.saveButtonRTL,
          ]}
          onPress={handleSave}
          disabled={updateProfileLoading}
        >
          {updateProfileLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text
                style={[
                  styles.saveButtonText,
                  isRTL && styles.saveButtonTextRTL,
                ]}
              >
                {t("saveChanges")}
              </Text>
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
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRTL: {
    // flexDirection: "row-reverse",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
  },
  backButtonRTL: {
    marginLeft: 0,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  headerTitleRTL: {
    textAlign: "right",
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: Colors.white,
    marginTop: 1,
  },
  sectionRTL: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    color: Colors.text,
  },
  sectionTitleRTL: {
    textAlign: "right",
    alignSelf: "flex-start",
  },
  securityTitle: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputContainerRTL: {},
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.text,
  },
  labelRTL: {
    textAlign: "left",
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  inputRTL: {
    textAlign: "right",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
  },
  switchRowRTL: {
    // flexDirection: "row-reverse",
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerRTL: {},
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonRTL: {
    // flexDirection: "row-reverse",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  saveButtonTextRTL: {
    textAlign: "right",
  },
});

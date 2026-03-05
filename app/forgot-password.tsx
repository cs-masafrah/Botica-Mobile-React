// app/forgot-password.tsx

import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ForgotPasswordScreen() {
  const { forgotPassword, forgotPasswordLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t("error"), t("enterEmail"));
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t("error"), t("enterValidEmail"));
      return;
    }

    try {
      const result = await forgotPassword(email.trim());
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        Alert.alert(t("error"), result.message || t("forgotPasswordFailed"));
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      Alert.alert(t("error"), error.message || t("forgotPasswordFailed"));
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, isRTL && styles.containerRTL]}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back button */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Pressable
              style={[styles.backButton, isRTL && styles.backButtonRTL]}
              onPress={handleGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {t("forgotPassword")}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {isSubmitted 
                ? t("resetPasswordEmailSent") 
                : t("enterEmailForReset")}
            </Text>
          </View>

          {!isSubmitted ? (
            <View style={[styles.form, isRTL && styles.formRTL]}>
              <View
                style={[
                  styles.inputContainer,
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <View
                  style={[
                    styles.inputIconContainer,
                    isRTL && styles.inputIconContainerRTL,
                  ]}
                >
                  <Mail size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("email")}
                  placeholderTextColor={Colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  editable={!forgotPasswordLoading}
                />
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  forgotPasswordLoading && styles.submitButtonDisabled,
                  isRTL && styles.submitButtonRTL,
                ]}
                onPress={handleSubmit}
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      isRTL && styles.submitButtonTextRTL,
                    ]}
                  >
                    {t("sendResetLink")}
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.backToLogin, isRTL && styles.backToLoginRTL]}
                onPress={handleGoBack}
                disabled={forgotPasswordLoading}
              >
                <Text
                  style={[
                    styles.backToLoginText,
                    isRTL && styles.backToLoginTextRTL,
                  ]}
                >
                  {t("backToLogin")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.successContainer, isRTL && styles.successContainerRTL]}>
              <View style={styles.successIconContainer}>
                <Mail size={48} color={Colors.primary} />
              </View>
              <Text style={[styles.successTitle, isRTL && styles.successTitleRTL]}>
                {t("checkYourEmail")}
              </Text>
              <Text style={[styles.successMessage, isRTL && styles.successMessageRTL]}>
                {t("resetPasswordEmailSentMessage")}
              </Text>
              <Pressable
                style={[styles.backToLoginButton, isRTL && styles.backToLoginButtonRTL]}
                onPress={handleGoBack}
              >
                <Text
                  style={[
                    styles.backToLoginButtonText,
                    isRTL && styles.backToLoginButtonTextRTL,
                  ]}
                >
                  {t("backToLogin")}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  headerRTL: {
    alignItems: "flex-start",
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonRTL: {
    transform: [{ scaleX: -1 }],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  form: {
    flex: 1,
  },
  formRTL: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  inputIconContainer: {
    marginRight: 12,
  },
  inputIconContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 18,
  },
  inputRTL: {
    textAlign: "right",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 56,
    marginBottom: 16,
  },
  submitButtonRTL: {},
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  submitButtonTextRTL: {
    textAlign: "right",
  },
  backToLogin: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backToLoginRTL: {},
  backToLoginText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
  },
  backToLoginTextRTL: {
    textAlign: "right",
  },
  // Success state styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  successContainerRTL: {
    direction: "rtl",
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + "15", // 15% opacity
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  successTitleRTL: {
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  successMessageRTL: {
    textAlign: "center",
  },
  backToLoginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  backToLoginButtonRTL: {},
  backToLoginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  backToLoginButtonTextRTL: {
    textAlign: "right",
  },
});
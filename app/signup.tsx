import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
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

export default function SignupScreen() {
  const { signup, signupLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(t("error"), t("fillAllFields"));
      return;
    }

    if (password.length < 5) {
      Alert.alert(t("error"), t("passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("error"), t("passwordsDoNotMatch"));
      return;
    }

    try {
      await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.back();
    } catch (error: any) {
      console.error("Signup error:", error);
      Alert.alert(
        t("signupFailed"),
        error.message || t("couldNotCreateAccount"),
      );
    }
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
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {t("createAccount")}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {t("signUpToGetStarted")}
            </Text>
          </View>

          <View style={[styles.form, isRTL && styles.formRTL]}>
            <View style={[styles.row, isRTL && styles.rowRTL]}>
              <View
                style={[
                  styles.inputContainer,
                  styles.halfWidth,
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <View
                  style={[
                    styles.inputIconContainer,
                    isRTL && styles.inputIconContainerRTL,
                  ]}
                >
                  <User size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("firstName")}
                  placeholderTextColor={Colors.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  textContentType="givenName"
                  autoComplete="name-given"
                  editable={!signupLoading}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  styles.halfWidth,
                  isRTL && styles.inputContainerRTL,
                ]}
              >
                <View
                  style={[
                    styles.inputIconContainer,
                    isRTL && styles.inputIconContainerRTL,
                  ]}
                >
                  <User size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("lastName")}
                  placeholderTextColor={Colors.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  textContentType="familyName"
                  autoComplete="name-family"
                  editable={!signupLoading}
                />
              </View>
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
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
                editable={!signupLoading}
              />
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <View
                style={[
                  styles.inputIconContainer,
                  isRTL && styles.inputIconContainerRTL,
                ]}
              >
                <Lock size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("password")}
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="password-new"
                editable={!signupLoading}
              />
              <Pressable
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowPassword(!showPassword)}
                disabled={signupLoading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>

            <View
              style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}
            >
              <View
                style={[
                  styles.inputIconContainer,
                  isRTL && styles.inputIconContainerRTL,
                ]}
              >
                <Lock size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("confirmPassword")}
                placeholderTextColor={Colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
                autoComplete="password-new"
                editable={!signupLoading}
              />
              <Pressable
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={signupLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.signupButton,
                signupLoading && styles.signupButtonDisabled,
                isRTL && styles.signupButtonRTL,
              ]}
              onPress={handleSignup}
              disabled={signupLoading}
            >
              {signupLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text
                  style={[
                    styles.signupButtonText,
                    isRTL && styles.signupButtonTextRTL,
                  ]}
                >
                  {t("createAccount")}
                </Text>
              )}
            </Pressable>

            <View style={[styles.divider, isRTL && styles.dividerRTL]}>
              <View style={styles.dividerLine} />
              <Text
                style={[styles.dividerText, isRTL && styles.dividerTextRTL]}
              >
                {t("or")}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[styles.loginButton, isRTL && styles.loginButtonRTL]}
              onPress={() => router.back()}
              disabled={signupLoading}
            >
              <Text
                style={[
                  styles.loginButtonText,
                  isRTL && styles.loginButtonTextRTL,
                ]}
              >
                {t("alreadyHaveAccount")}{" "}
                <Text
                  style={[
                    styles.loginButtonTextBold,
                    isRTL && styles.loginButtonTextBoldRTL,
                  ]}
                >
                  {t("signIn")}
                </Text>
              </Text>
            </Pressable>
          </View>
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
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  headerRTL: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  form: {
    flex: 1,
  },
  formRTL: {},
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  rowRTL: {
    flexDirection: "row-reverse",
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  eyeButton: {
    padding: 4,
  },
  eyeButtonRTL: {},
  signupButton: {
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
    marginTop: 8,
  },
  signupButtonRTL: {},
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  signupButtonTextRTL: {
    textAlign: "right",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerRTL: {
    flexDirection: "row-reverse",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  dividerTextRTL: {
    textAlign: "right",
  },
  loginButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loginButtonRTL: {},
  loginButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  loginButtonTextRTL: {
    textAlign: "right",
  },
  loginButtonTextBold: {
    color: Colors.primary,
    fontWeight: "700",
  },
  loginButtonTextBoldRTL: {
    textAlign: "right",
  },
});

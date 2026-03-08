import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
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
import SocialLoginButtons from "@/components/SocialLoginButtons";

export default function LoginScreen() {
  const { login, loginLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t("error"), t("enterEmailPassword"));
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.back();
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(t("loginFailed"), error.message || t("invalidCredentials"));
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
              {t("welcomeBack")}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              {t("signInToAccount")}
            </Text>
          </View>

          <View style={[styles.form, isRTL && styles.formRTL]}>
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
                editable={!loginLoading}
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
                textContentType="password"
                autoComplete="password"
                editable={!loginLoading}
              />
              <Pressable
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loginLoading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </Pressable>
            </View>

            <Pressable
              style={[styles.forgotPassword, isRTL && styles.forgotPasswordRTL]}
              onPress={() => router.push("/forgot-password")}
            >
              <Text
                style={[
                  styles.forgotPasswordText,
                  isRTL && styles.forgotPasswordTextRTL,
                ]}
              >
                {t("forgotPassword")}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.loginButton,
                loginLoading && styles.loginButtonDisabled,
                isRTL && styles.loginButtonRTL,
              ]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    isRTL && styles.loginButtonTextRTL,
                  ]}
                >
                  {t("signIn")}
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

            {/* Social Login Section */}
            <View style={styles.socialSection}>
              <SocialLoginButtons 
                isLoading={loginLoading} 
                disabled={loginLoading}
              />
            </View>

            {/* Sign Up Link */}
            <Pressable
              style={[styles.signupButton, isRTL && styles.signupButtonRTL]}
              onPress={() => router.push("/signup")}
              disabled={loginLoading}
            >
              <Text
                style={[
                  styles.signupButtonText,
                  isRTL && styles.signupButtonTextRTL,
                ]}
              >
                {t("noAccount")}{" "}
                <Text
                  style={[
                    styles.signupButtonTextBold,
                    isRTL && styles.signupButtonTextBoldRTL,
                  ]}
                >
                  {t("signUp")}
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
    marginBottom: 48,
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
    textAlign: "left",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordRTL: {
    alignSelf: "flex-start",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  forgotPasswordTextRTL: {
    textAlign: "right",
  },
  loginButton: {
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
  },
  loginButtonRTL: {},
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  loginButtonTextRTL: {
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
  // New style for social login section
  socialSection: {
    marginBottom: 24,
  },
  signupButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signupButtonRTL: {},
  signupButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  signupButtonTextRTL: {
    textAlign: "right",
  },
  signupButtonTextBold: {
    color: Colors.primary,
    fontWeight: "700",
  },
  signupButtonTextBoldRTL: {
    textAlign: "right",
  },
});
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoginPromptProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  visible,
  onClose,
  message,
}) => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  const handleSignup = () => {
    onClose();
    router.push("/signup");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, isRTL && styles.overlayRTL]}>
        <View style={[styles.container, isRTL && styles.containerRTL]}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {t("loginRequired")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text style={[styles.message, isRTL && styles.messageRTL]}>
            {message || t("loginPromptMessage")}
          </Text>

          {/* Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              isRTL && styles.buttonsContainerRTL,
            ]}
          >
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.secondaryButtonText,
                  isRTL && styles.buttonTextRTL,
                ]}
              >
                {t("cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={handleSignup}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.signupButtonText,
                  isRTL && styles.buttonTextRTL,
                ]}
              >
                {t("signUp")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={handleLogin}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.loginButtonText,
                  isRTL && styles.buttonTextRTL,
                ]}
              >
                {t("login")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayRTL: {
    direction: "rtl",
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerRTL: {
    // flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  titleRTL: {
    textAlign: "left",
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  messageRTL: {
    textAlign: "left",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  buttonsContainerRTL: {
    // flexDirection: "row-reverse",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextRTL: {
    textAlign: "right",
  },
  secondaryButton: {
    backgroundColor: Colors.gray,
  },
  secondaryButtonText: {
    color: Colors.text,
  },
  loginButton: {
    backgroundColor: Colors.primary,
  },
  loginButtonText: {
    color: Colors.white,
  },
  signupButton: {
    backgroundColor: Colors.secondary,
  },
  signupButtonText: {
    color: Colors.white,
  },
});

export default LoginPrompt;

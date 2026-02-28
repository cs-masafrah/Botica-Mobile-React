import { router } from "expo-router";
import {
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Settings,
  User,
  Package,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  I18nManager,
} from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfileScreen() {
  const { customer, isAuthenticated, isLoading, logout, logoutLoading } =
    useAuth();
  const { items } = useWishlist();
  const { t, isRTL } = useLanguage();

  const handleLogout = async () => {
    Alert.alert(t("Log Out"), t("Are you sure you want to log out?"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Log Out"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            console.log("Logged out successfully");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "1",
      icon: User,
      label: t("Edit Profile"),
      onPress: () => router.push("/edit-profile"),
      badge: undefined,
    },
    {
      id: "2",
      icon: Package,
      label: t("Order History"),
      onPress: () => router.push("/order-history"),
      badge: undefined,
    },
    {
      id: "3",
      icon: MapPin,
      label: t("Addresses"),
      onPress: () => router.push("/addresses"),
      badge: undefined,
    },
    {
      id: "4",
      icon: Heart,
      label: t("Wishlist"),
      onPress: () => router.push("/wishlist"),
      badge: items.length > 0 ? items.length : undefined,
    },
    {
      id: "5",
      icon: Settings,
      label: t("Settings"),
      onPress: () => router.push("/settings"),
      badge: undefined,
    },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.guestContainer}
        >
          <View style={styles.guestSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={48} color={Colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.guestTitle}>{t("Welcome to Beauty App")}</Text>
            <Text style={styles.guestSubtitle}>
              {t("Sign in to access your profile and orders")}
            </Text>

            <Pressable
              style={styles.loginButtonLarge}
              onPress={() => router.push("/login")}
            >
              <LogIn size={20} color={Colors.white} />
              <Text style={styles.loginButtonText}>{t("Sign In")}</Text>
            </Pressable>

            <Pressable
              style={styles.signupButtonLarge}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.signupButtonLargeText}>
                {t("Create Account")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.menuSection}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/wishlist")}
            >
              <View
                style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    isRTL && styles.menuIconContainerRTL,
                  ]}
                >
                  <Heart size={20} color={Colors.text} />
                </View>
                <Text style={[styles.menuLabel, isRTL && styles.menuLabelRTL]}>
                  {t("Wishlist")}
                </Text>
                {items.length > 0 && (
                  <View style={[styles.badge, isRTL && styles.badgeRTL]}>
                    <Text style={styles.badgeText}>{items.length}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.chevron, isRTL && styles.chevronRTL]}>
                {isRTL ? "‹" : "›"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color={Colors.primary} />
            </View>
          </View>
          <Text
            style={styles.name}
          >{`${customer?.firstName} ${customer?.lastName}`}</Text>
          <Text style={styles.email}>{customer?.email}</Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                {/* Arrow on left for RTL, on right for LTR */}
                {isRTL && (
                  <Text style={[styles.chevron, styles.chevronRTL]}>{"‹"}</Text>
                )}

                <View
                  style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}
                >
                  <View
                    style={[
                      styles.menuIconContainer,
                      isRTL && styles.menuIconContainerRTL,
                    ]}
                  >
                    <Icon size={20} color={Colors.text} />
                  </View>
                  <Text
                    style={[styles.menuLabel, isRTL && styles.menuLabelRTL]}
                  >
                    {item.label}
                  </Text>
                  {item.badge !== undefined && (
                    <View style={[styles.badge, isRTL && styles.badgeRTL]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>

                {/* Arrow on right for LTR */}
                {!isRTL && <Text style={[styles.chevron]}>{"›"}</Text>}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={logoutLoading}
        >
          {logoutLoading ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <LogOut size={20} color={Colors.error} />
              <Text style={styles.logoutText}>{t("Log Out")}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 70,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  guestContainer: {
    flexGrow: 1,
  },
  guestSection: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  loginButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  signupButtonLarge: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    marginTop: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  signupButtonLargeText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemLeftRTL: {
    flexDirection: "row-reverse",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  menuLabelRTL: {
    textAlign: "right",
  },
  chevron: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: "400",
    width: 24,
    textAlign: "center",
  },
  chevronRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
  badge: {
    backgroundColor: Colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  badgeRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
});

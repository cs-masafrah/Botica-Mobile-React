// app/_layout.tsx
import { Tabs } from "expo-router";
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
  Video,
} from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { I18nManager } from "react-native";

export default function TabLayout() {
  const { t, isRTL } = useLanguage();
  // Force RTL/LTR layout based on language
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      // I18nManager.forceRTL(isRTL);
    }
  }, [isRTL]);

  console.log("tab is rtl: ", isRTL);
  return (
    <Tabs
      screenOptions={() => ({
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          flexDirection: isRTL ? "row-reverse" : "row",
          direction: isRTL ? "rtl" : "ltr",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          textAlign: isRTL ? "right" : "left",
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
        // Ensure proper RTL layout for tab items
        tabBarItemStyle: {
          flex: 1,
          paddingVertical: 8,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("categories"),
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: t("reels"),
          tabBarIcon: ({ color }) => <Video size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("cart"),
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

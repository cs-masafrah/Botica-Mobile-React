// components/themes/FooterLinksTheme.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Theme, ThemeLink } from "@/types/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { router, Href } from "expo-router";

interface FooterLinksThemeProps {
  theme: Theme;
  locale?: string;
}

const FooterLinksTheme: React.FC<FooterLinksThemeProps> = ({
  theme,
  locale = "en",
}) => {
  const { isRTL, t } = useLanguage();

  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const column1 = translation?.options?.column_1 || [];
  const column2 = translation?.options?.column_2 || [];
  const column3 = translation?.options?.column_3 || [];
  const title = translation?.options?.title || theme.name;

  const allLinks = [...column1, ...column2, ...column3].filter(Boolean);

  const handleLinkPress = (link: ThemeLink) => {
    if (!link.url) return;

    if (link.url.startsWith("/") || link.url.includes("127.0.0.1:8000")) {
      // Handle internal navigation
      if (link.url.includes("/page/")) {
        const slug = link.url.split("/page/")[1];
        const pageHref = `/page/${slug}` as Href<string>;
        router.push(pageHref);
      } else if (link.url.includes("/contact-us")) {
        Linking.openURL(link.url).catch((err) =>
          console.error("Failed to open URL:", err),
        );
      } else {
        Linking.openURL(link.url).catch((err) =>
          console.error("Failed to open URL:", err),
        );
      }
    } else if (link.url.startsWith("mailto:") || link.url.startsWith("tel:")) {
      Linking.openURL(link.url);
    } else {
      Linking.openURL(link.url).catch((err) =>
        console.error("Failed to open URL:", err),
      );
    }
  };

  if (allLinks.length === 0) return null;

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {title ? (
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t(title) || title}
        </Text>
      ) : null}

      <View
        style={[styles.columnsContainer, isRTL && styles.columnsContainerRTL]}
      >
        {column1.length > 0 && (
          <View style={[styles.column, isRTL && styles.columnRTL]}>
            {column1.map((link, index) => (
              <Pressable
                key={index}
                style={[styles.linkButton, isRTL && styles.linkButtonRTL]}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={[styles.linkText, isRTL && styles.linkTextRTL]}>
                  {t(link.title) || link.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {column2.length > 0 && (
          <View style={[styles.column, isRTL && styles.columnRTL]}>
            {column2.map((link, index) => (
              <Pressable
                key={index}
                style={[styles.linkButton, isRTL && styles.linkButtonRTL]}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={[styles.linkText, isRTL && styles.linkTextRTL]}>
                  {t(link.title) || link.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {column3.length > 0 && (
          <View style={[styles.column, isRTL && styles.columnRTL]}>
            {column3.map((link, index) => (
              <Pressable
                key={index}
                style={[styles.linkButton, isRTL && styles.linkButtonRTL]}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={[styles.linkText, isRTL && styles.linkTextRTL]}>
                  {t(link.title) || link.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
  },
  containerRTL: {
    direction: "rtl",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
  },
  titleRTL: {
    textAlign: "right",
  },
  columnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnsContainerRTL: {
    flexDirection: "row-reverse",
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  columnRTL: {
    alignItems: "flex-end",
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkButtonRTL: {
    alignItems: "flex-end",
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkTextRTL: {
    textAlign: "right",
  },
});

export default FooterLinksTheme;

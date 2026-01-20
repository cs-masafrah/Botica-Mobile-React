// components/themes/StaticContentTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Theme } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';

interface StaticContentThemeProps {
  theme: Theme;
  locale?: string;
}

const StaticContentTheme: React.FC<StaticContentThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const options = translation?.options || {};
  const html = options.html;
  const css = options.css;
  const title = options.title || theme.name;

  if (!html) return null;

  // Create HTML with inline CSS for WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${css || ''}
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          a {
            color: #007AFF;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
      ) : null}
      
      <View style={styles.webViewContainer}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webView}
          scalesPageToFit={false}
          onShouldStartLoadWithRequest={(request) => {
            // Handle external links
            if (request.url.startsWith('http')) {
              Linking.openURL(request.url).catch(console.error);
              return false;
            }
            return true;
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  webViewContainer: {
    height: 300, // Adjust based on content
    backgroundColor: Colors.background,
  },
  webView: {
    flex: 1,
  },
});

export default StaticContentTheme;
// components/themes/StaticContentTheme.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Dimensions } from 'react-native';
import { Theme } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { WebView } from 'react-native-webview';
import RenderHtml from 'react-native-render-html'; // Alternative to WebView

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StaticContentThemeProps {
  theme: Theme;
  locale?: string;
}

const StaticContentTheme: React.FC<StaticContentThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();
  const [webViewHeight, setWebViewHeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const options = translation?.options || {};
  const html = options.html;
  const css = options.css;
  const title = options.title || theme.name;

  // Check if this is the "Offer Information" theme (ID: 2 based on your logs)
  const isOfferInformation = theme.id === '2' || theme.name === 'Offer Information';
  
  // Clean HTML - remove excessive whitespace and optimize
  const cleanHtml = useMemo(() => {
    if (!html) return null;
    
    let cleaned = html
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .trim();
    
    // For Offer Information specifically, check if it's empty or minimal
    if (isOfferInformation) {
      console.log(`🔍 [StaticContentTheme] Offer Information HTML length: ${cleaned.length}`);
      console.log(`   Preview: ${cleaned.substring(0, 200)}...`);
      
      // If HTML seems empty or just whitespace, return null
      if (cleaned.length < 50 || cleaned.replace(/<[^>]*>/g, '').trim().length === 0) {
        console.log(`   ⚠️ Empty or minimal content detected`);
        return null;
      }
    }
    
    return cleaned;
  }, [html, isOfferInformation]);

  if (!html) {
    console.log(`❌ [StaticContentTheme] No HTML content for theme: ${theme.name}`);
    return null;
  }

  // If cleaned HTML is null or empty, don't render
  if (!cleanHtml) {
    console.log(`❌ [StaticContentTheme] Skipping empty theme: ${theme.name}`);
    return null;
  }

  // Create HTML with inline CSS for WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          ${css || ''}
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
          }
          a {
            color: #007AFF;
            text-decoration: none;
          }
          p, h1, h2, h3, h4, h5, h6 {
            margin-bottom: 8px;
          }
          .container {
            max-width: 100%;
            overflow: hidden;
          }
          /* Add minimal padding for better mobile viewing */
          body > div {
            padding: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${cleanHtml}
        </div>
        <script>
          // Send height to React Native once content loads
          window.addEventListener('load', function() {
            setTimeout(function() {
              const height = document.documentElement.scrollHeight;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'height',
                height: height
              }));
            }, 100);
          });
          
          // Also send height when images load
          document.addEventListener('DOMContentLoaded', function() {
            const images = document.getElementsByTagName('img');
            Array.from(images).forEach(img => {
              img.addEventListener('load', function() {
                const height = document.documentElement.scrollHeight;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'height',
                  height: height
                }));
              });
            });
          });
        </script>
      </body>
    </html>
  `;

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 0) {
        // For Offer Information, limit maximum height
        const maxHeight = isOfferInformation ? 120 : 400; // Smaller max height for offers
        const calculatedHeight = Math.min(data.height, maxHeight);
        setWebViewHeight(calculatedHeight);
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  // For Offer Information specifically, use a simpler approach
  if (isOfferInformation) {
    return (
      <View style={[styles.container, styles.offerInfoContainer]}>
        {title ? (
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
            {title}
          </Text>
        ) : null}
        
        <View style={[styles.webViewContainer, { height: webViewHeight || 80 }]}>
          <WebView
            source={{ html: htmlContent }}
            style={styles.webView}
            scalesPageToFit={false}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onShouldStartLoadWithRequest={(request) => {
              if (request.url.startsWith('http')) {
                Linking.openURL(request.url).catch(console.error);
                return false;
              }
              return true;
            }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // For other static content
  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
      ) : null}
      
      <View style={[styles.webViewContainer, { height: webViewHeight || 200 }]}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webView}
          scalesPageToFit={false}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith('http')) {
              Linking.openURL(request.url).catch(console.error);
              return false;
            }
            return true;
          }}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: Colors.background,
  },
  offerInfoContainer: {
    marginVertical: 8, // Less vertical margin for offer info
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  webViewContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 60, // Minimum height for offer info
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default StaticContentTheme;
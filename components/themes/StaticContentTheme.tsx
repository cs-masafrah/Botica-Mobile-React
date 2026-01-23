// components/themes/StaticContentTheme.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Linking, Dimensions, ActivityIndicator } from 'react-native';
import { Theme } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StaticContentThemeProps {
  theme: Theme;
  locale?: string;
}

const StaticContentTheme: React.FC<StaticContentThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();
  const [webViewHeight, setWebViewHeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const options = translation?.options || {};
  const html = options.html;
  const css = options.css;

  // Clean HTML
  const cleanHtml = useMemo(() => {
    if (!html) {
      return null;
    }
    
    let cleaned = html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
    
    // Check if HTML is meaningful
    const textOnly = cleaned.replace(/<[^>]*>/g, '').trim();
    
    if (textOnly.length < 5) {
      return null;
    }
    
    return cleaned;
  }, [html]);

  // Determine if we should render
  useEffect(() => {
    const hasValidContent = !!cleanHtml && cleanHtml.length > 10;
    setShouldRender(hasValidContent);
  }, [cleanHtml]);

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'height' && data.height > 0) {
        const newHeight = Math.max(data.height, 10) + 2;
        
        if (Math.abs(newHeight - webViewHeight) > 1) {
          setWebViewHeight(newHeight);
        }
        
        setIsLoading(false);
        setHasError(false);
      }
    } catch (error) {
      // Silently handle parse errors
    }
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    
    // Force height calculation
    setTimeout(() => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          (function() {
            const height = document.documentElement.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'height',
              height: height
            }));
          })();
        `);
      }
    }, 500);
  };

  const handleWebViewError = () => {
    setHasError(true);
    setIsLoading(false);
    setWebViewHeight(100); // Fallback height
  };

  // If no content to render, return null early
  if (!shouldRender) {
    return null;
  }

  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <style>
          ${css || ''}
          
          /* Base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #000000;
            background: transparent !important;
            width: 100%;
          }
          
          .content-wrapper {
            padding: 0;
            background: transparent;
            width: 100%;
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
            margin: 0 0 8px 0;
            padding: 0;
          }
          
          ul, ol {
            margin: 0 0 8px 20px;
            padding: 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body style="background: transparent;">
        <div class="content-wrapper" id="content-wrapper">
          ${cleanHtml}
        </div>
          <script>
            (function () {
              let lastHeight = 0;
              let sent = false;

              function sendHeight(force = false) {
                const wrapper = document.getElementById('content-wrapper');
                if (!wrapper) return;

                const height = Math.ceil(wrapper.scrollHeight);

                if (!force && Math.abs(height - lastHeight) < 2) return;

                lastHeight = height;

                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'height', height })
                );
              }

              function init() {
                sendHeight(true);

                const images = document.images;
                let pending = images.length;

                if (pending === 0) {
                  sendHeight(true);
                  return;
                }

                for (let img of images) {
                  if (img.complete) {
                    pending--;
                  } else {
                    img.onload = img.onerror = () => {
                      pending--;
                      if (pending === 0) {
                        sendHeight(true);
                      }
                    };
                  }
                }

                if (pending === 0) {
                  sendHeight(true);
                }
              }

              window.addEventListener('load', init);
            })();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      )}
      
      {/* WebView container - always render but control visibility */}
      <View style={[
        styles.webViewContainer, 
        { 
          height: webViewHeight > 0 ? webViewHeight : 'auto',
          opacity: isLoading ? 0 : 1 
        }
      ]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webView}
          scalesPageToFit={false}
          scrollEnabled={false}
          onMessage={handleWebViewMessage}
          onLoad={handleWebViewLoad}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={handleWebViewError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigation to external URLs
            if (request.url.startsWith('http')) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
        />
      </View>
      
      {/* Error state - only shown if WebView fails */}
      {hasError && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load content</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginVertical: 8,
  },
  webViewContainer: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    minHeight: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
});

export default StaticContentTheme;
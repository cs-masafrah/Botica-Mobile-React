// components/themes/StaticContentTheme.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Theme } from "@/types/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StaticContentThemeProps {
  theme: Theme;
}

const StaticContentTheme: React.FC<StaticContentThemeProps> = ({
  theme,
}) => {
  const { isRTL, t, locale } = useLanguage();
  const [webViewHeight, setWebViewHeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const translation = useMemo(() => {
    return (
      theme.translations?.find((t) => t.localeCode === locale) ||
      theme.translations?.[0]
    );
  }, [theme.translations, locale]);

  const options = translation?.options || {};
  const html = options.html;
  const css = options.css;

  // Clean HTML
  const cleanHtml = useMemo(() => {
    if (!html) {
      return null;
    }

    let cleaned = html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

    // Check if HTML is meaningful
    const textOnly = cleaned.replace(/<[^>]*>/g, "").trim();

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

      if (data.type === "height" && data.height > 0) {
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

  // Create HTML content with RTL support
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="UTF-8">
        <style>
          ${css || ""}
          
          /* Base styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0 0px 0 0px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #000000;
            background: transparent !important;
            width: 100%;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            text-align: ${isRTL ? 'right' : 'left'};
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
            padding-${isRTL ? 'right' : 'left'}: 20px;
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
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {/* Loading state */}
      {isLoading && (
        <View style={[styles.loadingContainer, isRTL && styles.loadingContainerRTL]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.loadingTextRTL]}>
            {t('loading')}...
          </Text>
        </View>
      )}

      {/* WebView container - always render but control visibility */}
      <View
        style={[
          styles.webViewContainer,
          {
            height: webViewHeight > 0 ? webViewHeight : "auto",
            opacity: isLoading ? 0 : 1,
          },
          isRTL && styles.webViewContainerRTL,
        ]}
      >
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={[styles.webView, isRTL && styles.webViewRTL]}
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
          originWhitelist={["*"]}
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigation to external URLs
            if (request.url.startsWith("http")) {
              Linking.openURL(request.url).catch(() => {});
              return false;
            }
            return true;
          }}
        />
      </View>

      {/* Error state - only shown if WebView fails */}
      {hasError && !isLoading && (
        <View style={[styles.errorContainer, isRTL && styles.errorContainerRTL]}>
          <Text style={[styles.errorText, isRTL && styles.errorTextRTL]}>
            {t('failedToLoadContent')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    marginVertical: 8,
  },
  containerRTL: {
    direction: "rtl",
  },
  webViewContainer: {
    backgroundColor: "transparent",
    overflow: "hidden",
    minHeight: 1,
  },
  webViewContainerRTL: {
    // Any RTL specific styles for container
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webViewRTL: {
    // Any RTL specific styles for webview
  },
  loadingContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 10,
  },
  loadingContainerRTL: {
    flexDirection: "row-reverse",
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingTextRTL: {
    textAlign: "right",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    alignItems: "center",
  },
  errorContainerRTL: {
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: "600",
  },
  errorTextRTL: {
    textAlign: "right",
  },
});

export default StaticContentTheme;
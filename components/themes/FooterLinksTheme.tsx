// components/themes/FooterLinksTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Theme, ThemeLink } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { router } from 'expo-router';

interface FooterLinksThemeProps {
  theme: Theme;
  locale?: string;
}

const FooterLinksTheme: React.FC<FooterLinksThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const column1 = translation?.options?.column_1 || [];
  const column2 = translation?.options?.column_2 || [];
  const column3 = translation?.options?.column_3 || [];
  const title = translation?.options?.title || theme.name;

  const allLinks = [...column1, ...column2, ...column3].filter(Boolean);

  const handleLinkPress = (link: ThemeLink) => {
    if (!link.url) return;
    
    if (link.url.startsWith('/') || link.url.includes('127.0.0.1:8000')) {
      // Handle internal navigation
      if (link.url.includes('/page/')) {
        const slug = link.url.split('/page/')[1];
        router.push({ pathname: '/page/[slug]', params: { slug } });
      } else if (link.url.includes('/contact-us')) {
        router.push('/contact');
      } else {
        Linking.openURL(link.url).catch(err => 
          console.error('Failed to open URL:', err)
        );
      }
    } else if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
      Linking.openURL(link.url);
    } else {
      Linking.openURL(link.url).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
  };

  if (allLinks.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
      ) : null}
      
      <View style={styles.columnsContainer}>
        {column1.length > 0 && (
          <View style={styles.column}>
            {column1.map((link, index) => (
              <Pressable
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={styles.linkText}>{link.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
        
        {column2.length > 0 && (
          <View style={styles.column}>
            {column2.map((link, index) => (
              <Pressable
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={styles.linkText}>{link.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
        
        {column3.length > 0 && (
          <View style={styles.column}>
            {column3.map((link, index) => (
              <Pressable
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link)}
              >
                <Text style={styles.linkText}>{link.title}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default FooterLinksTheme;
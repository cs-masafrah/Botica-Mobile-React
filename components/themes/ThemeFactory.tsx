// components/themes/ThemeFactory.tsx - DEBUG VERSION
import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Theme, ThemeType } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';

// Import all theme components
import ProductCarouselTheme from './ProductCarouselTheme';
import CategoryCarouselTheme from './CategoryCarouselTheme';
import StaticContentTheme from './StaticContentTheme';
import ImageCarouselTheme from './ImageCarouselTheme';
import FooterLinksTheme from './FooterLinksTheme';
import ServicesContentTheme from './ServicesContentTheme';

interface ThemeFactoryProps {
  theme: Theme;
}

const ThemeFactory: React.FC<ThemeFactoryProps> = ({ theme }) => {
  const { locale } = useLanguage();
  
  console.log(`🔍 [ThemeFactory] Processing theme: ${theme.id} - ${theme.type} - "${theme.name}"`);
  
  const translation = useMemo(() => {
    const t = theme.translations?.find(t => t.localeCode === locale) || theme.translations?.[0];
    console.log(`   Translation for ${locale}:`, t?.options ? 'Found' : 'Not found');
    console.log(`   Options:`, JSON.stringify(t?.options, null, 2));
    return t;
  }, [theme.translations, locale]);

  const componentMap: Record<ThemeType, React.ComponentType<any>> = {
    product_carousel: ProductCarouselTheme,
    category_carousel: CategoryCarouselTheme,
    static_content: StaticContentTheme,
    image_carousel: ImageCarouselTheme,
    footer_links: FooterLinksTheme,
    services_content: ServicesContentTheme,
  };

  const ThemeComponent = componentMap[theme.type];

  if (!ThemeComponent) {
    console.warn(`❌ No component found for theme type: ${theme.type}`);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Theme type "{theme.type}" not supported</Text>
      </View>
    );
  }

  console.log(`   ✅ Will render ${theme.type} component`);

  return (
    <View style={styles.container}>
      <ThemeComponent theme={theme} locale={locale} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ThemeFactory;
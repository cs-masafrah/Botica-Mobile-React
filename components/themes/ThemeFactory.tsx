// components/themes/ThemeFactory.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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
  const { currentLocale } = useLanguage();

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
    console.warn(`No component found for theme type: ${theme.type}`);
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemeComponent theme={theme} locale={currentLocale} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
});

export default ThemeFactory;
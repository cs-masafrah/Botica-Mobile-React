// components/themes/ServicesContentTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme, ThemeService } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { Truck, Package, CreditCard, Headphones } from 'lucide-react-native';

interface ServicesContentThemeProps {
  theme: Theme;
  locale?: string;
}

const ServicesContentTheme: React.FC<ServicesContentThemeProps> = ({ theme, locale = 'en' }) => {
  const { isRTL } = useLanguage();

  const translation = useMemo(() => {
    return theme.translations?.find(t => t.localeCode === locale) || 
           theme.translations?.[0];
  }, [theme.translations, locale]);

  const services = translation?.options?.services || [];
  const title = translation?.options?.title || theme.name;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'icon-truck':
      case 'truck':
        return <Truck size={24} color={Colors.primary} />;
      case 'icon-product':
      case 'package':
        return <Package size={24} color={Colors.primary} />;
      case 'icon-dollar-sign':
      case 'credit-card':
        return <CreditCard size={24} color={Colors.primary} />;
      case 'icon-support':
      case 'headphones':
        return <Headphones size={24} color={Colors.primary} />;
      default:
        return <Package size={24} color={Colors.primary} />;
    }
  };

  if (services.length === 0) return null;

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
          {title}
        </Text>
      ) : null}
      
      <View style={styles.servicesGrid}>
        {services.map((service: ThemeService, index: number) => (
          <View key={index} style={styles.serviceItem}>
            <View style={styles.iconContainer}>
              {getIcon(service.serviceIcon)}
            </View>
            <View style={styles.serviceText}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          </View>
        ))}
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  serviceText: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});

export default ServicesContentTheme;
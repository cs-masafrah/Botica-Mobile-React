// components/themes/ServicesContentTheme.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme, ThemeService } from '@/types/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { Truck, Package, CreditCard, Headphones } from 'lucide-react-native';

interface ServicesContentThemeProps {
  theme: Theme;
}

const ServicesContentTheme: React.FC<ServicesContentThemeProps> = ({ theme }) => {
  const { isRTL, t, locale } = useLanguage();

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
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {title ? (
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t(title) || title}
        </Text>
      ) : null}
      
      <View style={[styles.servicesGrid, isRTL && styles.servicesGridRTL]}>
        {services.map((service: ThemeService, index: number) => (
          <View key={index} style={[styles.serviceItem, isRTL && styles.serviceItemRTL]}>
            <View style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}>
              {getIcon(service.serviceIcon)}
            </View>
            <View style={[styles.serviceText, isRTL && styles.serviceTextRTL]}>
              <Text style={[styles.serviceTitle, isRTL && styles.serviceTitleRTL]}>
                {t(service.title) || service.title}
              </Text>
              <Text style={[styles.serviceDescription, isRTL && styles.serviceDescriptionRTL]}>
                {t(service.description) || service.description}
              </Text>
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
  containerRTL: {
    direction: "rtl",
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  titleRTL: {
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  servicesGridRTL: {
    flexDirection: 'row-reverse',
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
  serviceItemRTL: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  serviceText: {
    flex: 1,
  },
  serviceTextRTL: {
    alignItems: 'flex-start',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceTitleRTL: {
    textAlign: 'right',
  },
  serviceDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  serviceDescriptionRTL: {
    textAlign: 'right',
  },
});

export default ServicesContentTheme;
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';
import { useEffect, useState } from 'react';
import { I18nManager, Platform, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { translations } from '@/constants/translations/index';

const LANGUAGE_KEY = 'app_language';

export const [LanguageContext, useLanguage] = createContextHook(() => {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [isLoading, setIsLoading] = useState(true);

  const i18n = new I18n(translations);
  i18n.locale = locale;
  i18n.enableFallback = true;

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === 'ar' || savedLanguage === 'en') {
        setLocale(savedLanguage);
        const isRTL = savedLanguage === 'ar';
        
        if (Platform.OS === 'web') {
          document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
          document.documentElement.lang = savedLanguage;
        } else {
          I18nManager.forceRTL(isRTL);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLocale: 'en' | 'ar') => {
    try {
      const isRTL = newLocale === 'ar';
      const needsReload = I18nManager.isRTL !== isRTL;

      await AsyncStorage.setItem(LANGUAGE_KEY, newLocale);
      setLocale(newLocale);
      
      if (Platform.OS === 'web') {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = newLocale;
      } else {
        I18nManager.forceRTL(isRTL);
        
        if (needsReload) {
          Alert.alert(
            i18n.t('restartRequired'),
            i18n.t('restartMessage'),
            [
              {
                text: i18n.t('restartNow'),
                onPress: async () => {
                  if (__DEV__ || Constants.appOwnership === 'expo') {
                    Alert.alert(
                      'Development Mode',
                      'App reload is only available in production builds. The language will be applied on next app restart.'
                    );
                  } else {
                    await Updates.reloadAsync();
                  }
                },
              },
              {
                text: i18n.t('restartLater'),
                style: 'cancel',
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string) => i18n.t(key);

  return {
    locale,
    changeLanguage,
    t,
    isRTL: locale === 'ar',
    isLoading,
  };
});

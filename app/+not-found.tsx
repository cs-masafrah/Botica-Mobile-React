import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { t, isRTL } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: t('oops') }} />
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t('pageNotFound')}
        </Text>
        <Link href="/" style={[styles.link, isRTL && styles.linkRTL]}>
          <Text style={[styles.linkText, isRTL && styles.linkTextRTL]}>
            {t('goToHome')}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  containerRTL: {
    direction: 'rtl',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: 'left',
  },
  link: {
    marginTop: 16,
  },
  linkRTL: {},
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  linkTextRTL: {
    textAlign: 'left',
  },
});
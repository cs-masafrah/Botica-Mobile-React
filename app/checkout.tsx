// app/checkout.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { useCheckout } from '@/contexts/CheckoutContext';
import Colors from '@/constants/colors';
import AddressStep from '@/components/checkout/AddressStep';
import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import ReviewStep from '@/components/checkout/ReviewStep';
import SuccessStep from '@/components/checkout/SuccessStep';

const CheckoutScreen = () => {
  const { step, resetCheckout, setStep } = useCheckout();
  const insets = useSafeAreaInsets();

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <AddressStep />;
      case 2:
        return <ShippingStep />;
      case 3:
        return <PaymentStep />;
      case 4:
        return <ReviewStep />;
      case 5:
        return <SuccessStep />;
      default:
        return <AddressStep />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Address';
      case 2:
        return 'Shipping';
      case 3:
        return 'Payment';
      case 4:
        return 'Review';
      case 5:
        return 'Success';
      default:
        return 'Checkout';
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else if (step === 5) {
      resetCheckout();
      router.replace('/(tabs)');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <Pressable onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </Pressable>
      </View>

      {/* Progress Steps */}
      {step < 5 && (
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((stepNumber) => (
            <View key={stepNumber} style={styles.progressStep}>
              <View
                style={[
                  styles.progressCircle,
                  step >= stepNumber && styles.progressCircleActive,
                ]}
              >
                <Text style={[
                  styles.progressText,
                  step >= stepNumber && styles.progressTextActive,
                ]}>
                  {stepNumber}
                </Text>
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  step >= stepNumber && styles.progressLabelActive,
                ]}
              >
                {stepNumber === 1 && 'Address'}
                {stepNumber === 2 && 'Shipping'}
                {stepNumber === 3 && 'Payment'}
                {stepNumber === 4 && 'Review'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  progressTextActive: {
    color: Colors.white,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressLabelActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default CheckoutScreen;
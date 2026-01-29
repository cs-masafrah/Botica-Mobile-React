// app/checkout.tsx - NEW DESIGN
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X, Sparkles } from 'lucide-react-native';
import { useCheckout } from '@/contexts/CheckoutContext';
import { CheckoutColors } from '@/constants/checkoutColors';
import AddressStep from '@/components/checkout/AddressStep';
import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import ReviewStep from '@/components/checkout/ReviewStep';
import SuccessStep from '@/components/checkout/SuccessStep';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
  const { step, resetCheckout, setStep } = useCheckout();
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepTitleAnim = useRef(new Animated.Value(0)).current;

  // Animation for step transitions
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(progressAnim, {
        toValue: step / 4,
        tension: 100,
        friction: 15,
        useNativeDriver: false,
      }),
    ]).start();

    // Step title animation
    Animated.sequence([
      Animated.timing(stepTitleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(stepTitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const renderStepContent = () => {
    const stepComponents = {
      1: <AddressStep />,
      2: <ShippingStep />,
      3: <PaymentStep />,
      4: <ReviewStep />,
      5: <SuccessStep />,
    };
    return stepComponents[step as keyof typeof stepComponents];
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Delivery Address',
      2: 'Shipping Method',
      3: 'Payment Method',
      4: 'Review Order',
      5: 'Order Confirmed!',
    };
    return titles[step as keyof typeof titles];
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stepTitleOpacity = stepTitleAnim;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated Background Gradient */}
      <Animated.View style={[styles.backgroundGradient, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={CheckoutColors.primaryGradient as unknown as readonly [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={CheckoutColors.textPrimary} />
        </Pressable>
        
        <Animated.Text
          style={[styles.title, { opacity: stepTitleOpacity }]}
        >
          {getStepTitle()}
        </Animated.Text>
        
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={CheckoutColors.textPrimary} />
        </Pressable>
      </View>

      {/* Progress Bar with Animation */}
      {step < 5 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            >
              <LinearGradient
                colors={CheckoutColors.successGradient as unknown as readonly [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          
          {/* Step Indicators */}
          <View style={styles.stepIndicators}>
            {[1, 2, 3, 4].map((stepNumber) => (
              <View key={stepNumber} style={styles.stepIndicatorWrapper}>
                <View
                  style={[
                    styles.stepIndicator,
                    step >= stepNumber && styles.stepIndicatorActive,
                  ]}
                >
                  {step > stepNumber ? (
                    <Sparkles size={12} color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        step >= stepNumber && styles.stepNumberActive,
                      ]}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step >= stepNumber && styles.stepLabelActive,
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
        </View>
      )}

      {/* Content with Fade Animation */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStepContent()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepIndicatorActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#1e293b',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});


export default CheckoutScreen;
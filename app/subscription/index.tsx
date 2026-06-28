import { View, StyleSheet, Alert, Platform, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Button } from '@/src/shared/components/Button';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { useSubscriptionPlans } from '@/src/services/hooks/useSubscriptionPlans';
import type { SubscriptionPlan } from '@/src/features/subscriptions/types';
import {
  connectIAP,
  disconnectIAP,
  purchaseSubscription,
  IAP_NOT_AVAILABLE,
} from '@/src/features/courses/service/purchaseService';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { setSubscription } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [iapUnavailable, setIapUnavailable] = useState(false);

  // Auto-select the first plan once loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0]);
    }
  }, [plans]);

  // Check IAP availability (Expo Go detection only — actual purchase connects internally)
  useEffect(() => {
    let mounted = true;
    connectIAP()
      .catch(err => {
        if (mounted && (err as Error).message === IAP_NOT_AVAILABLE) {
          setIapUnavailable(true);
        }
      });
    return () => {
      mounted = false;
      disconnectIAP().catch(() => {});
    };
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    const { tokens, user } = useAuthStore.getState();
    if (!tokens?.accessToken || !user) {
      Alert.alert('Sign in required', 'Please log in to subscribe.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    setPurchasing(true);
    try {
      const subscription = await purchaseSubscription(selectedPlan.productIdIos, tokens.accessToken);
      setSubscription(subscription);
      router.back();
    } catch (err) {
      setPurchasing(false);
      const msg = (err as Error).message;
      if (msg === 'CANCELED') return;
      Alert.alert('Subscription Failed', msg ?? 'Something went wrong. Please try again.');
    }
  };

  const hasError = !!plansError || (!plansLoading && plans.length === 0);

  return (
    <>
      <Stack.Screen options={{ title: 'Choose a Plan' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="star" size={36} color={Colors.primary} />
            </View>
            <Text variant="title" style={styles.heroTitle}>Unlock Premium</Text>
            <Text variant="caption" color={Colors.text.secondary} style={styles.heroSubtitle}>
              Choose a plan to access premium courses
            </Text>
          </View>

          {plansLoading && (
            <ActivityIndicator color={Colors.primary} size="large" style={styles.loader} />
          )}

          {hasError && !plansLoading && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
              <Text variant="caption" color={Colors.text.secondary} style={styles.errorText}>
                {plansError ?? 'No subscription plans available right now. Please try again later.'}
              </Text>
            </View>
          )}

          {!plansLoading && !hasError && (
            <View style={styles.planList}>
              {plans.map(plan => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                    onPress={() => setSelectedPlan(plan)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioCol}>
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                    <View style={styles.planInfo}>
                      <Text
                        variant="subtitle"
                        color={isSelected ? Colors.primary : Colors.text.primary}
                        weight={isSelected ? 'semibold' : 'regular'}
                      >
                        {plan.name}
                      </Text>
                      <Text variant="caption" color={Colors.text.secondary} style={styles.planDesc}>
                        {plan.description}
                      </Text>
                    </View>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {formatPrice(plan.price)}{'\n'}
                      <Text style={styles.planPricePer}>/year</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.footer}>
            {iapUnavailable ? (
              <View style={styles.iapWarning}>
                <Ionicons name="warning-outline" size={20} color={Colors.warning} />
                <Text variant="caption" color={Colors.text.secondary} style={styles.iapWarningText}>
                  In-app purchases require a native build.{'\n'}Run{' '}
                  <Text variant="caption" weight="bold" color={Colors.text.primary}>expo run:ios</Text>
                  {' '}to test purchases.
                </Text>
              </View>
            ) : !hasError && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={purchasing}
                onPress={handleSubscribe}
              >
                {purchasing
                  ? 'Processing...'
                  : selectedPlan
                    ? `Subscribe — ${formatPrice(selectedPlan.price)}/year`
                    : 'Subscribe'}
              </Button>
            )}
            {!hasError && (
              <Text variant="caption" color={Colors.text.muted} style={styles.terms}>
                {`Payment via ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'}. Renews annually. Cancel anytime in your account settings.`}
              </Text>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  heroTitle: { textAlign: 'center' },
  heroSubtitle: { textAlign: 'center' },
  loader: { marginVertical: Spacing.xxl },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: { flex: 1, lineHeight: 18 },
  planList: { gap: Spacing.sm },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  radioCol: { paddingTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  planInfo: { flex: 1, gap: 2 },
  planDesc: { lineHeight: 18 },
  planPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  planPriceSelected: { color: Colors.primary },
  planPricePer: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.text.muted,
  },
  footer: { marginTop: Spacing.xl, gap: Spacing.md },
  iapWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  iapWarningText: { flex: 1, lineHeight: 18 },
  terms: { textAlign: 'center', lineHeight: 18 },
});

import { View, StyleSheet, Alert, Platform, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Button } from '@/src/shared/components/Button';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionPlans } from '@/src/services/hooks/useSubscriptionPlans';
import { useMySubscription } from '@/src/services/hooks/useMySubscription';
import type { SubscriptionPlan } from '@/src/features/subscriptions/types';
import {
  initPurchaseFlow,
  disposePurchaseFlow,
  requestPlanPurchase,
  loadSubscriptionProduct,
  getLastPurchaseTraceId,
  IAP_NOT_AVAILABLE,
} from '@/src/features/courses/service/purchaseService';
import { logger, newTraceId, flushLogs } from '@/src/shared/utils/logger';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type ProductAvailability = 'checking' | 'available' | 'unavailable';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans();
  const { subscription: mySubscription } = useMySubscription();

  const activePlanId =
    mySubscription && (mySubscription.status === 'active' || mySubscription.status === 'trial')
      ? mySubscription.planId
      : null;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [iapUnavailable, setIapUnavailable] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [productAvailability, setProductAvailability] = useState<Record<number, ProductAvailability>>({});

  // Auto-select the first plan that isn't the user's current active plan
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const firstSelectable = plans.find(p => p.id !== activePlanId) ?? plans[0];
      setSelectedPlan(firstSelectable);
    }
  }, [plans, activePlanId]);

  // Connection + purchase listeners live for as long as this screen is open —
  // see the comment atop purchaseService.ts for why they aren't re-created
  // per purchase attempt. Deliberately mount/unmount only ([]) — do NOT add
  // `plans` or anything else here, or the connection gets torn down and
  // rebuilt on every re-render, which is the exact bug that caused the
  // replay issue this screen used to have.
  useEffect(() => {
    let mounted = true;
    initPurchaseFlow()
      .then(() => { if (mounted) setIapReady(true); })
      .catch(err => {
        if (mounted && (err as Error).message === IAP_NOT_AVAILABLE) {
          setIapUnavailable(true);
        }
      });
    return () => {
      mounted = false;
      disposePurchaseFlow();
    };
  }, []);

  // Check every plan against the App Store as soon as the connection is ready
  // and plans have loaded — a fast, cheap way to tell "Apple doesn't
  // recognize this product" apart from "the purchase itself failed," instead
  // of only finding out after a 90-second purchase attempt.
  useEffect(() => {
    if (!iapReady || plans.length === 0) return;
    let mounted = true;
    const traceId = newTraceId();
    setProductAvailability(Object.fromEntries(plans.map(p => [p.id, 'checking'])));
    Promise.all(plans.map(async (plan) => {
      const product = await loadSubscriptionProduct(plan.productIdIos, traceId);
      if (!mounted) return;
      setProductAvailability(prev => ({ ...prev, [plan.id]: product ? 'available' : 'unavailable' }));
    })).then(() => flushLogs());
    return () => { mounted = false; };
  }, [iapReady, plans]);

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
      try {
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        console.log('[subscribe] using token — userId in token:', payload?.id, '| store user.id:', user?.id);
      } catch { /* ignore */ }

      const subscription = await requestPlanPurchase(selectedPlan.productIdIos, tokens.accessToken);

      const isExpired = new Date(subscription.currentPeriodEndsAt) < new Date();
      if (isExpired) {
        Alert.alert(
          'Subscription Expired',
          'Your subscription was found but has expired. Please open Settings → Apple ID → Subscriptions to renew, then come back.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }

      router.back();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'CANCELED') return;
      if (msg === 'PURCHASE_SCHEDULED') {
        // Apple defers switches to a lower-level plan until the next renewal —
        // this is its designed behavior, not a failure. The user keeps the
        // current plan (and its content) until the period ends.
        Alert.alert(
          'Plan Change Scheduled',
          `Your plan will switch to ${selectedPlan.name} when your current subscription period ends. Until then, you keep your current plan.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }
      if (msg === 'PURCHASE_TIMEOUT') {
        // A timeout usually means Apple took the payment but confirmation is
        // late — not that the purchase failed. Reconciliation registers it
        // automatically the next time this screen opens.
        Alert.alert(
          'Confirmation Pending',
          "The App Store hasn't confirmed your purchase yet. If your payment went through, your subscription will activate automatically — reopen this screen in a minute to check.",
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }
      Alert.alert('Subscription Failed', msg ?? 'Something went wrong. Please try again.');
    } finally {
      // Guaranteed regardless of how requestPlanPurchase() settles, so the
      // button can never stay stuck on "Processing..." — if this log line is
      // ever missing from debug_logs for a given traceId, requestPlanPurchase
      // itself never settled (a promise-chain bug, not a UI bug).
      setPurchasing(false);
      logger.info(getLastPurchaseTraceId() ?? 'unknown', 'handleSubscribe finally — setPurchasing(false)');
      flushLogs();
    }
  };

  const hasError = !!plansError || (!plansLoading && plans.length === 0);

  return (
    <>
      <Stack.Screen options={{ title: activePlanId ? 'Manage Subscription' : 'Choose a Plan' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="star" size={36} color={Colors.primary} />
            </View>
            <Text variant="title" style={styles.heroTitle}>
              {activePlanId ? 'Manage Subscription' : 'Unlock Premium'}
            </Text>
            <Text variant="caption" color={Colors.text.secondary} style={styles.heroSubtitle}>
              {activePlanId ? 'Switch to a different plan' : 'Choose a plan to access premium courses'}
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
                const isCurrentPlan = plan.id === activePlanId;
                const isSelected = !isCurrentPlan && selectedPlan?.id === plan.id;
                const availability = productAvailability[plan.id];
                const isUnavailable = availability === 'unavailable';
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      isCurrentPlan && styles.planCardCurrent,
                      isUnavailable && styles.planCardUnavailable,
                    ]}
                    onPress={() => !isCurrentPlan && setSelectedPlan(plan)}
                    activeOpacity={isCurrentPlan ? 1 : 0.8}
                  >
                    <View style={styles.radioCol}>
                      {isCurrentPlan ? (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      ) : (
                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <View style={styles.planNameRow}>
                        <Text
                          variant="subtitle"
                          color={isCurrentPlan ? Colors.text.muted : isSelected ? Colors.primary : Colors.text.primary}
                          weight={isSelected ? 'semibold' : 'regular'}
                        >
                          {plan.name}
                        </Text>
                        {isCurrentPlan && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Your Plan</Text>
                          </View>
                        )}
                        {isUnavailable && (
                          <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableBadgeText}>Not available from App Store</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="caption" color={Colors.text.secondary} style={styles.planDesc}>
                        {plan.description}
                      </Text>
                    </View>
                    <Text style={[
                      styles.planPrice,
                      isSelected && styles.planPriceSelected,
                      isCurrentPlan && styles.planPriceMuted,
                    ]}>
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
                disabled={!!selectedPlan && productAvailability[selectedPlan.id] === 'unavailable'}
                onPress={handleSubscribe}
              >
                {purchasing
                  ? 'Processing...'
                  : selectedPlan && productAvailability[selectedPlan.id] === 'unavailable'
                    ? 'Unavailable right now'
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
  planCardCurrent: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    opacity: 0.7,
  },
  planCardUnavailable: {
    borderColor: Colors.warning,
    borderStyle: 'dashed',
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  currentBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.successDark,
  },
  unavailableBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unavailableBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.warning,
  },
  planPriceMuted: {
    color: Colors.text.muted,
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

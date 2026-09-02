import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { syncSubscription } from '@/src/features/subscriptions/service';

// Thin wrapper around the shared syncSubscription() — triggers a sync on
// mount / token change and renders live from the shared store, which is
// also written by syncSubscription() calls elsewhere (session restore,
// login, the purchase flow) so every consumer reflects a new subscription
// immediately, including screens that mounted before that sync ran.
export function useMySubscription() {
  const accessToken = useAuthStore(s => s.tokens?.accessToken);
  const subscription = useSubscriptionStore(s => s.mySubscription);
  const status = useSubscriptionStore(s => s.status);
  const storeError = useSubscriptionStore(s => s.error);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    syncSubscription(accessToken).catch(() => {
      // already recorded on the store (status: 'error') by syncSubscription
    });
  }, [accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return {
    subscription,
    status,
    loading: status === 'loading' || (status === 'unknown' && !!accessToken),
    error: status === 'error' ? storeError : null,
    refetch,
  };
}

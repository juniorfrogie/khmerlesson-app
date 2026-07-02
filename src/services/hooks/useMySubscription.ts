import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import type { Subscription } from '@/src/features/subscriptions/types';

// Returns the user's subscription, rendered live from the shared store. The
// store is written by this hook's server sync AND by the purchase flow the
// moment a purchase registers, so every consumer reflects a new subscription
// immediately — including screens that mounted before the purchase (tab
// screens stay mounted, so returning a mount-time fetch snapshot goes stale).
export function useMySubscription() {
  const accessToken = useAuthStore(s => s.tokens?.accessToken);
  const subscription = useSubscriptionStore(s => s.mySubscription);
  const [loading, setLoading] = useState(!!accessToken);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch<Subscription | null>('/api/v1/subscriptions/me', accessToken)
      .then(sub => {
        const store = useSubscriptionStore.getState();
        if (sub) {
          store.setSubscription(sub);
        } else {
          store.clearSubscription();
        }
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        setError((err as Error).message);
      });
  }, [accessToken, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { subscription, loading, error, refetch };
}
